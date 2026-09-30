'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NodeStatus } from '@/types/diagram';

interface InterfaceLollipopModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
  status?: NodeStatus;
}

/**
 * Procedural 3D UML Interface Model (Ball-and-Socket / Lollipop)
 * Optimized PBR geometry per new3DComponentsDescriptions.md specification:
 * Reduced triangle budget (~3.5k -> ~1.4k) with shared memoized buffers.
 */
export function InterfaceLollipopModel({
  color = '#06B6D4',
  isHovered = false,
  isSelected = false,
  status = 'active',
}: InterfaceLollipopModelProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  // Memoized geometries for GPU performance
  const geometries = useMemo(() => ({
    stalk: new THREE.CylinderGeometry(0.06, 0.06, 0.8, 16),
    sphere: new THREE.SphereGeometry(0.45, 20, 20), // Optimized from 32x32 to 20x20
    torus: new THREE.TorusGeometry(0.7, 0.04, 10, 32), // Optimized from 16x48 to 10x32
    beacon: new THREE.SphereGeometry(0.22, 12, 12),
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      ringRef.current.rotation.x = Math.sin(t * 0.5) * 0.3;
    }
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 2.5) * 0.03;
      coreRef.current.scale.set(s, s, s);
    }
  });

  const coreColor = isSelected ? '#38BDF8' : isHovered ? '#22D3EE' : color;

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Base Connector Stalk / Pin */}
      <mesh geometry={geometries.stalk} position={[0, -0.6, 0]}>
        <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.7} />
      </mesh>

      {/* UML Interface Ball (Provided Interface Sphere - Chrome Reflection) */}
      <mesh ref={coreRef} geometry={geometries.sphere} castShadow>
        <meshStandardMaterial
          color={coreColor}
          roughness={0.10}
          metalness={0.95}
          emissive={coreColor}
          emissiveIntensity={isSelected ? 0.6 : 0.25}
        />
      </mesh>

      {/* UML Socket Ring (Required Interface Torus) */}
      <mesh ref={ringRef} geometry={geometries.torus}>
        <meshStandardMaterial
          color="#F472B6"
          roughness={0.20}
          metalness={0.40}
          wireframe={isSelected}
        />
      </mesh>

      {/* Internal Pulsing Light Beacon */}
      <mesh geometry={geometries.beacon} position={[0, 0, 0]}>
        <meshBasicMaterial
          color={status === 'error' ? '#F43F5E' : '#FDE68A'}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}
