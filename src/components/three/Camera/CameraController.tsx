'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useCameraStore } from '@/store/useCameraStore';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useCollaborationStore } from '@/store/useCollaborationStore';

export function CameraController() {
  const { camera, size } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const preset = useCameraStore((s) => s.preset);
  const targetPosition = useCameraStore((s) => s.targetPosition);
  const targetLookAt = useCameraStore((s) => s.targetLookAt);
  const resetTrigger = useCameraStore((s) => s.resetTrigger);
  const isCinematic = useCameraStore((s) => s.isCinematicActive);
  const isFreeCamera = useCameraStore((s) => s.isFreeCamera);
  const isDraggingNode = useDiagramStore((s) => s.isDraggingNode);

  // Presenter collaboration state
  const isFollowingPresenter = useCollaborationStore((s) => s.isFollowingPresenter);
  const isCameraDecoupled = useCollaborationStore((s) => s.isCameraDecoupled);
  const remotePresenter = useCollaborationStore((s) => s.remotePresenter);

  // Vectors for smooth lerping
  const desiredPos = useRef(new THREE.Vector3(0, 6, 15));
  const desiredLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const presenterPos = useRef(new THREE.Vector3(0, 6, 15));
  const presenterTarget = useRef(new THREE.Vector3(0, 0, 0));
  const cinematicAngle = useRef(0);
  const isResetting = useRef(false);
  const resetAlpha = useRef(0);

  // Keyboard navigation shortcuts: 'F' focuses selected node or diagram; 'R' resets view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (isInput || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        const selectedNode = useDiagramStore.getState().getSelectedNode();
        if (selectedNode && selectedNode.position3D) {
          useCameraStore.getState().focusOnNode(selectedNode.position3D);
        } else {
          const nodes = useDiagramStore.getState().diagram.nodes;
          useCameraStore.getState().resetToDiagram(nodes);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        useCameraStore.getState().resetCamera();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle explicit resetTrigger or diagram changes with portrait mode framing compensation
  useEffect(() => {
    if (resetTrigger > 0) {
      const aspect = size.width / Math.max(size.height, 1);
      const portraitMult = aspect < 1.0 ? Math.min(Math.max(1.0, 1.25 / aspect), 2.5) : 1.0;

      const lookAt = targetLookAt
        ? new THREE.Vector3(targetLookAt.x, targetLookAt.y, targetLookAt.z)
        : new THREE.Vector3(0, 0, 0);

      const basePos = targetPosition
        ? new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z)
        : new THREE.Vector3(0, 6, 15);

      if (portraitMult > 1.0) {
        const offset = new THREE.Vector3().subVectors(basePos, lookAt).multiplyScalar(portraitMult);
        desiredPos.current.copy(lookAt).add(offset);
      } else {
        desiredPos.current.copy(basePos);
      }

      desiredLookAt.current.copy(lookAt);
      isResetting.current = true;
      resetAlpha.current = 0;
    }
  }, [resetTrigger, targetPosition, targetLookAt, size.width, size.height]);

  useEffect(() => {
    if (isFreeCamera && !isResetting.current) return; // Don't override user's free camera position
    if (isFollowingPresenter && !isCameraDecoupled) return; // Don't override presenter framing
    const aspect = size.width / Math.max(size.height, 1);
    const portraitMult = aspect < 1.0 ? Math.min(Math.max(1.0, 1.25 / aspect), 2.5) : 1.0;

    switch (preset) {
      case 'overview': {
        const lookAt = targetLookAt
          ? new THREE.Vector3(targetLookAt.x, targetLookAt.y, targetLookAt.z)
          : new THREE.Vector3(0, 0, 0);

        const basePos = targetPosition
          ? new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z)
          : new THREE.Vector3(0, 6, 15);

        if (portraitMult > 1.0) {
          const offset = new THREE.Vector3().subVectors(basePos, lookAt).multiplyScalar(portraitMult);
          desiredPos.current.copy(lookAt).add(offset);
        } else {
          desiredPos.current.copy(basePos);
        }
        desiredLookAt.current.copy(lookAt);
        break;
      }
      case 'topology':
        desiredPos.current.set(
          desiredLookAt.current.x,
          desiredLookAt.current.y + 18 * portraitMult,
          desiredLookAt.current.z + 3 * portraitMult
        );
        break;
      case 'focus':
        if (targetPosition && targetLookAt) {
          desiredPos.current.set(targetPosition.x, targetPosition.y, targetPosition.z);
          desiredLookAt.current.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
        }
        break;
      default:
        break;
    }
  }, [preset, targetPosition, targetLookAt, isFreeCamera, isFollowingPresenter, isCameraDecoupled, size.width, size.height]);

  useFrame((_, delta) => {
    // 0. Follow remote presenter camera smoothly without controls fight or preset interference
    if (isFollowingPresenter && !isCameraDecoupled && remotePresenter?.camera) {
      const { position, target } = remotePresenter.camera;
      if (Array.isArray(position) && position.length === 3 && Array.isArray(target) && target.length === 3) {
        presenterPos.current.set(position[0], position[1], position[2]);
        presenterTarget.current.set(target[0], target[1], target[2]);

        const lerpFactor = Math.min(delta * 6.0, 0.3);
        camera.position.lerp(presenterPos.current, lerpFactor);

        if (controlsRef.current) {
          controlsRef.current.target.lerp(presenterTarget.current, lerpFactor);
          controlsRef.current.update();
        }
      }
      return;
    }

    // 1. If actively performing an animated reset / diagram framing
    if (isResetting.current) {
      resetAlpha.current += delta * 2.5;
      camera.position.lerp(desiredPos.current, Math.min(delta * 4.5, 1));
      if (controlsRef.current) {
        controlsRef.current.target.lerp(desiredLookAt.current, Math.min(delta * 4.5, 1));
        controlsRef.current.update();
      }
      if (camera.position.distanceTo(desiredPos.current) < 0.1) {
        isResetting.current = false;
      }
      return;
    }

    // 2. If user enabled Câmera Livre, OrbitControls has 100% full authority without lerp fight
    if (isFreeCamera) {
      return;
    }

    // 3. Cinematic slow rotation around the scene
    if (isCinematic) {
      cinematicAngle.current += delta * 0.15;
      const radius = 15;
      const x = desiredLookAt.current.x + Math.sin(cinematicAngle.current) * radius;
      const z = desiredLookAt.current.z + Math.cos(cinematicAngle.current) * radius;
      desiredPos.current.set(x, desiredLookAt.current.y + 5 + Math.sin(cinematicAngle.current * 0.5) * 2, z);
    }

    if (preset !== 'orbit' || isCinematic) {
      camera.position.lerp(desiredPos.current, delta * 3.5);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(desiredLookAt.current, delta * 3.5);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={!isDraggingNode}
      enableDamping
      dampingFactor={0.05}
      maxDistance={isFreeCamera ? 180 : 65}
      minDistance={isFreeCamera ? 0.3 : 1.2}
      maxPolarAngle={isFreeCamera ? Math.PI : Math.PI / 2 - 0.02} // Prevents camera from passing under the floor plane
      minPolarAngle={0.05}
      screenSpacePanning={true}
      enablePan={true}
      panSpeed={isFreeCamera ? 1.3 : 1.0}
      zoomSpeed={isFreeCamera ? 1.3 : 1.0}
      rotateSpeed={isFreeCamera ? 1.1 : 1.0}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
      onEnd={() => {
        // Only decouple from presenter if user genuinely moved the camera away
        const collab = useCollaborationStore.getState();
        if (collab.isFollowingPresenter) {
          const distToPresenter = camera.position.distanceTo(presenterPos.current);
          if (distToPresenter > 0.8) {
            collab.setIsCameraDecoupled(true);
          }
        }
      }}
    />
  );
}
