'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function DataLakehouseModel({ color = '#0284C7', isHovered, isSelected }: ModelProps) {
  const cubesRef = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (cubesRef.current) {
      cubesRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Outer Hexagonal Glass Reservoir / Silo */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.7, 1.3, 6]} />
        <meshStandardMaterial
          color="#0369A1"
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Top Cap Bezel */}
      <mesh position={[0, 0.68, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.08, 6]} />
        <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Bottom Base Pedestal */}
      <mesh position={[0, -0.68, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 6]} />
        <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Suspended Floating Data Blocks inside Reservoir */}
      <group ref={cubesRef} position={[0, 0, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshStandardMaterial color="#38BDF8" emissive="#0284C7" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.3, 0.2, 0.2]}>
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial color="#67E8F9" emissive="#06B6D4" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-0.28, -0.22, 0.15]}>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial color="#38BDF8" emissive="#0284C7" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.15, -0.25, -0.25]}>
          <boxGeometry args={[0.16, 0.16, 0.16]} />
          <meshStandardMaterial color="#BAE6FD" />
        </mesh>
      </group>

      {/* Selection / Hover Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh position={[0, -0.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.1, 32]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
