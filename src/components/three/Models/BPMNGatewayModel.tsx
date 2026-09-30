'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function BPMNGatewayModel({ color = '#F59E0B', isHovered, isSelected }: ModelProps) {
  const markerRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (markerRef.current && markerRef.current.material instanceof THREE.MeshStandardMaterial) {
      const t = clock.getElapsedTime();
      markerRef.current.material.emissiveIntensity = 0.5 + Math.sin(t * 4) * 0.3;
    }
  });

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* 45-degree Rotated Diamond/Rhombus Prism */}
      <mesh rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.45, 0.9]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Outer Diamond Bezel Wireframe */}
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.94, 0.47, 0.94]} />
        <meshStandardMaterial color={color} wireframe />
      </mesh>

      {/* Glowing Decision Nucleus Marker (e.g. Gateway "X" / Cross) */}
      <mesh ref={markerRef} position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* 4 Branching Ports on Cardinal Directions */}
      {[
        [0.65, 0, 0],
        [-0.65, 0, 0],
        [0, 0, 0.65],
        [0, 0, -0.65],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#F59E0B" metalness={0.8} />
        </mesh>
      ))}

      {/* Selection / Hover Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 1.05, 32]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
