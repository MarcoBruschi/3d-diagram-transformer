'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NodeStatus } from '@/types/diagram';

interface Controller3DModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
  status?: NodeStatus;
}

/**
 * Procedural 3D Controller Hardware Model
 * Features an industrial controller unit with cooling heatsinks, microchip core, and bus ports.
 */
export function Controller3DModel({
  color = '#10B981',
  isHovered = false,
  isSelected = false,
  status = 'active',
}: Controller3DModelProps) {
  const chipRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (chipRef.current) {
      const t = clock.getElapsedTime();
      const em = 0.3 + Math.sin(t * 4) * 0.2;
      (chipRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = em;
    }
  });

  const chassisColor = isSelected ? '#047857' : isHovered ? '#065F46' : '#064E3B';

  return (
    <group>
      {/* Main Industrial Controller Enclosure */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.4, 0.8]} />
        <meshStandardMaterial
          color={chassisColor}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Top Cooling Heat Sink Fins */}
      {[-0.5, -0.25, 0, 0.25, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.75, 0]}>
          <boxGeometry args={[0.08, 0.12, 0.7]} />
          <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.9} />
        </mesh>
      ))}

      {/* Front Embedded Processing Microchip */}
      <mesh ref={chipRef} position={[0, 0.1, 0.42]}>
        <boxGeometry args={[0.7, 0.7, 0.08]} />
        <meshStandardMaterial
          color="#022C22"
          roughness={0.1}
          metalness={0.9}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Terminal Bus Connector Strip (Bottom) */}
      <mesh position={[0, -0.65, 0.38]}>
        <boxGeometry args={[1.5, 0.14, 0.1]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0.65, 0.5, 0.42]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial
          color={status === 'error' ? '#F43F5E' : status === 'warning' ? '#F59E0B' : '#10B981'}
        />
      </mesh>

      {/* Selection Wireframe Aura */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[1.9, 1.5, 0.9]} />
          <meshBasicMaterial color="#34D399" wireframe opacity={0.4} transparent />
        </mesh>
      )}
    </group>
  );
}
