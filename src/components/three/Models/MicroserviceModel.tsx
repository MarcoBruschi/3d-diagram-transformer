'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function MicroserviceModel({ color = '#06B6D4', isHovered, isSelected }: ModelProps) {
  const coreRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.9;
      coreRef.current.rotation.y += delta * 1.3;
    }
  });

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Outer Wireframe Cage */}
      <mesh>
        <boxGeometry args={[1.1, 1.1, 1.1]} />
        <meshStandardMaterial
          color="#1E293B"
          metalness={0.9}
          roughness={0.2}
          wireframe
        />
      </mesh>

      {/* Internal Rotating Modular Nucleus */}
      <group ref={coreRef}>
        <mesh castShadow>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Orbiting Ring */}
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[0.75, 0.02, 8, 24]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* 8 Corner Vertex Markers */}
      {[-0.55, 0.55].map((x) =>
        [-0.55, 0.55].map((y) =>
          [-0.55, 0.55].map((z) => (
            <mesh key={`${x}-${y}-${z}`} position={[x, y, z]}>
              <boxGeometry args={[0.12, 0.12, 0.12]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
          ))
        )
      )}

      {/* Selection / Hover Accent Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 1.05, 32]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
