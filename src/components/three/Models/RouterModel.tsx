'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function RouterModel({ color = '#EC4899', isHovered, isSelected }: ModelProps) {
  const wavesRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (wavesRef.current) {
      const t = clock.getElapsedTime();
      wavesRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const scale = 1 + ((t * 1.5 + i * 0.6) % 2);
          child.scale.set(scale, scale, scale);
          if (child.material instanceof THREE.MeshBasicMaterial) {
            child.material.opacity = Math.max(0, 0.6 - (scale - 1) * 0.3);
          }
        }
      });
    }
  });

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Router Main Body */}
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.22, 0.9]} />
        <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Front Glossy Bezel */}
      <mesh position={[0, -0.1, 0.46]}>
        <boxGeometry args={[1.36, 0.18, 0.02]} />
        <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Front Activity LED Indicators */}
      {[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => (
        <mesh key={i} position={[x, -0.1, 0.475]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.01, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}

      {/* 4 Angled Corner Antennas */}
      {[
        [-0.6, 0.3, -0.38, -0.2, 0, -0.15],
        [-0.2, 0.38, -0.4, -0.1, 0, 0],
        [0.2, 0.38, -0.4, -0.1, 0, 0],
        [0.6, 0.3, -0.38, -0.2, 0, 0.15],
      ].map(([x, y, z, rx, ry, rz], i) => (
        <group key={i} position={[x, y, z]} rotation={[rx, ry, rz]}>
          {/* Base connector joint */}
          <mesh position={[0, -0.32, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          {/* Antenna mast */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.03, 0.7, 12]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Pulsing RF Signal Rings */}
      <group ref={wavesRef} position={[0, 0.4, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <ringGeometry args={[0.4, 0.45, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Selection / Hover Accent Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.1, 32]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
