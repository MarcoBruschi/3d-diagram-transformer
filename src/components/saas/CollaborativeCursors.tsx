'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useCollaborationStore, RemotePeer } from '@/store/useCollaborationStore';
import { useCameraStore } from '@/store/useCameraStore';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useFeatureGating } from '@/hooks/useFeatureGating';
import { api } from '@/lib/services/apiClient';

const USER_PALETTE = [
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#14B8A6', // Teal
];

export function getStableColorForUser(idOrEmail?: string): string {
  if (!idOrEmail) return USER_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < idOrEmail.length; i++) {
    hash = (hash << 5) - hash + idOrEmail.charCodeAt(i);
    hash |= 0;
  }
  return USER_PALETTE[Math.abs(hash) % USER_PALETTE.length];
}

function SinglePeerCursor({ peer }: { peer: RemotePeer }) {
  const meshRef = useRef<THREE.Group>(null);
  const reticleRef = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const targetPos = useRef(new THREE.Vector3(peer.cursor3D[0], peer.cursor3D[1], peer.cursor3D[2]));

  // Scratch vectors for zero-allocation 60 FPS beam & reticle math
  const scratchStart = useRef(new THREE.Vector3());
  const scratchEnd = useRef(new THREE.Vector3());
  const scratchMid = useRef(new THREE.Vector3());
  const scratchDir = useRef(new THREE.Vector3());
  const upVector = useRef(new THREE.Vector3(0, 1, 0));

  // Diagram nodes for active node beam projection
  const nodes = useDiagramStore((s) => s.diagram.nodes);
  const activeNode = useMemo(() => {
    if (!peer.activeNodeId) return null;
    return nodes.find((n) => n.id === peer.activeNodeId) || null;
  }, [nodes, peer.activeNodeId]);

  // Classic stylized 3D Arrow Cursor pointing precisely down at (0, 0, 0)
  const arrowGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Tip at (0, 0) pointing directly at ground/object target
    shape.moveTo(0, 0);
    shape.lineTo(0.32, 0.65); // Right wing tip
    shape.lineTo(0.14, 0.60); // Right inner notch
    shape.lineTo(0.22, 1.10); // Right stem top
    shape.lineTo(0.06, 1.14); // Left stem top
    shape.lineTo(0.00, 0.70); // Stem bottom left
    shape.lineTo(-0.16, 0.70); // Left wing
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    });
    geom.translate(0, 0, -0.025);
    return geom;
  }, []);

  // Continuous predictive interpolation (delta * 18) for zero-lag 60 FPS multiplayer movement
  useFrame(({ clock }, delta) => {
    targetPos.current.set(peer.cursor3D[0], peer.cursor3D[1], peer.cursor3D[2]);

    if (meshRef.current) {
      // delta * 18 for instantaneous, ultra-smooth predictive tracking without visual stepping
      const lerpFactor = THREE.MathUtils.clamp(delta * 18, 0.05, 1);
      meshRef.current.position.lerp(targetPos.current, lerpFactor);
    }

    // Holographic ground reticle rotation and pulse
    if (reticleRef.current) {
      reticleRef.current.rotation.z += delta * 1.5;
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.06;
      reticleRef.current.scale.set(pulse, pulse, 1);
    }

    // Update holographic beam pointing from arrow to activeNode
    if (beamRef.current) {
      if (activeNode?.position3D && meshRef.current) {
        scratchStart.current.copy(meshRef.current.position).add({ x: 0, y: 0.25, z: 0 });
        scratchEnd.current.set(activeNode.position3D.x, activeNode.position3D.y, activeNode.position3D.z);
        const dist = scratchStart.current.distanceTo(scratchEnd.current);

        if (dist > 0.3) {
          beamRef.current.visible = true;
          scratchMid.current.addVectors(scratchStart.current, scratchEnd.current).multiplyScalar(0.5);
          beamRef.current.position.copy(scratchMid.current);
          beamRef.current.scale.set(1, dist, 1);
          scratchDir.current.subVectors(scratchEnd.current, scratchStart.current).normalize();
          beamRef.current.quaternion.setFromUnitVectors(upVector.current, scratchDir.current);
        } else {
          beamRef.current.visible = false;
        }
      } else {
        beamRef.current.visible = false;
      }
    }
  });

  return (
    <>
      {/* Holographic Beam connecting to active node */}
      <mesh ref={beamRef} visible={false}>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
        <meshStandardMaterial
          color={peer.color}
          emissive={peer.color}
          emissiveIntensity={2.0}
          transparent
          opacity={0.65}
          roughness={0.1}
        />
      </mesh>

      {/* Target Node Focus Indicator */}
      {activeNode?.position3D && (
        <mesh
          position={[activeNode.position3D.x, activeNode.position3D.y, activeNode.position3D.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.9, 1.05, 32]} />
          <meshStandardMaterial
            color={peer.color}
            emissive={peer.color}
            emissiveIntensity={1.5}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 3D Arrow Cursor & Holographic Reticle Group */}
      <group ref={meshRef} position={[peer.cursor3D[0], peer.cursor3D[1], peer.cursor3D[2]]}>
        {/* Subtle Ground Shadow */}
        <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.32} depthWrite={false} />
        </mesh>

        {/* Outer Rotating Holographic Targeting Reticle */}
        <mesh ref={reticleRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.25, 32]} />
          <meshStandardMaterial
            color={peer.color}
            emissive={peer.color}
            emissiveIntensity={1.4}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Inner Pulsing Targeting Ring */}
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.07, 0.1, 24]} />
          <meshStandardMaterial
            color={peer.color}
            emissive={peer.color}
            emissiveIntensity={1.8}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Central Targeting Precision Dot */}
        <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.035, 16]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive={peer.color}
            emissiveIntensity={2.5}
            depthWrite={false}
          />
        </mesh>

        {/* 3D Stylized Sharp Arrow Cursor pointing down precisely at (0, 0, 0) */}
        <group position={[0, 0.04, 0]}>
          <mesh
            geometry={arrowGeometry}
            rotation={[-Math.PI / 5, 0, -Math.PI / 18]}
            castShadow
          >
            <meshStandardMaterial
              color={peer.color}
              emissive={peer.color}
              emissiveIntensity={0.65}
              roughness={0.2}
              metalness={0.5}
            />
          </mesh>

          {/* Neon Pointer Tip Core */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={peer.color}
              emissiveIntensity={2.2}
            />
          </mesh>
        </group>

        {/* Floating User HUD Tag with exact distanceFactor={12} */}
        <Html position={[0, 1.45, 0]} center distanceFactor={12}>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-white shadow-xl pointer-events-none whitespace-nowrap select-none border border-white/30 backdrop-blur-md"
            style={{ backgroundColor: `${peer.color}EE` }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
            <span>{peer.name}</span>
            <span className="text-[8px] uppercase bg-black/40 px-1.5 py-0.5 rounded font-normal tracking-wide">
              {peer.role}
            </span>
          </div>
        </Html>
      </group>
    </>
  );
}

export function CollaborativeCursors() {
  const { canUseMultiplayer } = useFeatureGating();
  const isMultiplayerEnabled = useCollaborationStore((s) => s.isMultiplayerEnabled);
  const peers = useCollaborationStore((s) => s.peers);
  const setPeers = useCollaborationStore((s) => s.setPeers);

  const isPresenterActive = useCollaborationStore((s) => s.isPresenterActive);
  const isFollowingPresenter = useCollaborationStore((s) => s.isFollowingPresenter);

  const backendDiagramId = useDiagramStore((s) => s.backendDiagramId);
  const localDiagramId = useDiagramStore((s) => s.diagram.id);
  const diagramId = backendDiagramId || localDiagramId;
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const presenterPauseUntilRef = useRef<number>(0);
  const heartbeatPauseUntilRef = useRef<number>(0);

  const hasShareToken = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).has('share') ||
    new URLSearchParams(window.location.search).has('token') ||
    new URLSearchParams(window.location.search).has('shareToken')
  );
  const isSharedSession = Boolean(hasShareToken);
  const isValidMultiplayerTarget = Boolean(
    backendDiagramId ||
    isSharedSession ||
    (diagramId && (/^[0-9a-fA-F-]{36}$/.test(diagramId) || diagramId.startsWith('sh_')))
  );
  const canParticipate = Boolean(
    (isAuthenticated || isSharedSession) &&
    (canUseMultiplayer || isSharedSession || Boolean(backendDiagramId)) &&
    isValidMultiplayerTarget
  );

  const { camera, raycaster, pointer, controls } = useThree() as any;
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectPoint = useRef(new THREE.Vector3());
  const lastSentTime = useRef<number>(0);
  const lastBroadcastTime = useRef<number>(0);

  const setRemotePresenter = useCollaborationStore((s) => s.setRemotePresenter);
  const setIsFollowingPresenter = useCollaborationStore((s) => s.setIsFollowingPresenter);

  // Consistent color for local user
  const myColor = useMemo(() => getStableColorForUser(user?.id || user?.email || 'guest'), [user?.id, user?.email]);

  // Note: Continuous participant & diagram mutation polling is managed globally by <MultiplayerSyncManager />
  // avoiding duplicate polling when 3D Canvas is active.

  const isCameraDecoupled = useCollaborationStore((s) => s.isCameraDecoupled);
  const setIsCameraDecoupled = useCollaborationStore((s) => s.setIsCameraDecoupled);

  useEffect(() => {
    presenterPauseUntilRef.current = 0;
    heartbeatPauseUntilRef.current = 0;
  }, [diagramId, isAuthenticated]);

  // Listener for Remote Presenter detection: stores full camera in store for 60 FPS CameraController lerp
  useEffect(() => {
    if (isPresenterActive || !isValidMultiplayerTarget || !canParticipate) return;

    const checkPresenter = async () => {
      if (Date.now() < presenterPauseUntilRef.current) return;
      try {
        const res = await api.collaborate.getPresenterCamera(diagramId);
        if (res && res.active && res.presenter && res.presenter.userId !== user?.id) {
          const presenterCamera = res.presenter.camera;
          setRemotePresenter({
            userId: res.presenter.userId,
            name: res.presenter.userName || 'Colega de Equipe',
            camera: presenterCamera
              ? {
                  position: presenterCamera.position,
                  target: presenterCamera.target,
                  fov: presenterCamera.fov,
                }
              : undefined,
          });
          // Auto-follow live presenter if viewer hasn't manually decoupled camera
          const collab = useCollaborationStore.getState();
          if (!collab.isCameraDecoupled && !collab.isFollowingPresenter) {
            setIsFollowingPresenter(true);
          }
        } else {
          // Immediate termination when presentation ends (res.active === false or presenter left)
          setRemotePresenter(null);
          if (isFollowingPresenter) {
            setIsFollowingPresenter(false);
          }
          if (isCameraDecoupled) {
            setIsCameraDecoupled(false);
          }
        }
      } catch (err: any) {
        const status = err?.status;
        if (status === 401 || status === 403) {
          presenterPauseUntilRef.current = Date.now() + 10000;
        }
      }
    };

    checkPresenter();
    const intervalMs = isFollowingPresenter && !isCameraDecoupled ? 150 : 800;
    const followInterval = setInterval(checkPresenter, intervalMs);

    return () => clearInterval(followInterval);
  }, [canParticipate, isFollowingPresenter, isCameraDecoupled, isPresenterActive, diagramId, user?.id, setRemotePresenter, setIsFollowingPresenter, setIsCameraDecoupled]);

  // Real camera target calculation for presenter broadcast
  const getCameraTarget = (): [number, number, number] => {
    // 1. Try OrbitControls instance registered in Three state (e.g. OrbitControls makeDefault)
    if (controls && controls.target && typeof controls.target.x === 'number') {
      return [
        parseFloat(controls.target.x.toFixed(2)),
        parseFloat(controls.target.y.toFixed(2)),
        parseFloat(controls.target.z.toFixed(2)),
      ];
    }

    // 2. Try targetLookAt stored in CameraStore
    const storeTarget = useCameraStore.getState().targetLookAt;
    if (storeTarget && typeof storeTarget.x === 'number') {
      return [
        parseFloat(storeTarget.x.toFixed(2)),
        parseFloat(storeTarget.y.toFixed(2)),
        parseFloat(storeTarget.z.toFixed(2)),
      ];
    }

    // 3. Compute raycast forward from camera towards ground plane
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const camRay = new THREE.Ray(camera.position, dir);
    const hitPoint = new THREE.Vector3();
    const hitsGround = camRay.intersectPlane(groundPlane.current, hitPoint);
    if (hitsGround && hitPoint.distanceTo(camera.position) > 0.5 && hitPoint.distanceTo(camera.position) < 300) {
      return [
        parseFloat(hitPoint.x.toFixed(2)),
        parseFloat(hitPoint.y.toFixed(2)),
        parseFloat(hitPoint.z.toFixed(2)),
      ];
    }

    // 4. Default forward projection along camera look vector
    const forwardTarget = camera.position.clone().add(dir.multiplyScalar(15));
    return [
      parseFloat(forwardTarget.x.toFixed(2)),
      parseFloat(forwardTarget.y.toFixed(2)),
      parseFloat(forwardTarget.z.toFixed(2)),
    ];
  };

  // Throttled stream of local user's 3D cursor position & Presenter broadcast
  useFrame(() => {
    if (!canParticipate || !isMultiplayerEnabled || !diagramId) return;

    const now = performance.now();
    if (Date.now() < heartbeatPauseUntilRef.current) return;

    // 1. Send cursor heartbeat (100ms throttle for zero-lag multiplayer)
    if (now - lastSentTime.current >= 100) {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.ray.intersectPlane(groundPlane.current, intersectPoint.current);

      if (hit) {
        lastSentTime.current = now;
        const activeNodeId = useDiagramStore.getState().selectedNodeId;

        api.collaborate
          .sendHeartbeat(
            diagramId,
            {
              x: parseFloat(hit.x.toFixed(2)),
              y: parseFloat(hit.y.toFixed(2)),
              z: parseFloat(hit.z.toFixed(2)),
            },
            myColor,
            undefined,
            undefined,
            activeNodeId || undefined
          )
          .then((res) => {
            if (res?.liveDiagramMutation) {
              const currentUserId = user?.id;
              if (!res.liveDiagramMutation.lastModifiedBy || res.liveDiagramMutation.lastModifiedBy !== currentUserId) {
                useDiagramStore.getState().syncRemoteDiagramMutation(res.liveDiagramMutation);
              }
            }
          })
          .catch((err: any) => {
            const status = err?.status;
            if (status === 401 || status === 403) {
              heartbeatPauseUntilRef.current = Date.now() + 10000;
            }
          });
      }
    }

    // 2. Broadcast camera if local user is the active presenter (200ms throttle) with real target
    if (isPresenterActive && now - lastBroadcastTime.current >= 200) {
      lastBroadcastTime.current = now;
      const realTarget = getCameraTarget();
      api.collaborate
        .broadcastCamera(
          diagramId,
          [parseFloat(camera.position.x.toFixed(2)), parseFloat(camera.position.y.toFixed(2)), parseFloat(camera.position.z.toFixed(2))],
          realTarget
        )
        .catch((err: any) => {
          const status = err?.status;
          if (status === 401 || status === 403) {
            heartbeatPauseUntilRef.current = Date.now() + 10000;
          }
        });
    }
  });

  if (!canParticipate || !isMultiplayerEnabled) return null;

  return (
    <group name="collaborative-cursors-layer">
      {peers.map((peer) => (
        <SinglePeerCursor key={peer.id} peer={peer} />
      ))}
    </group>
  );
}
