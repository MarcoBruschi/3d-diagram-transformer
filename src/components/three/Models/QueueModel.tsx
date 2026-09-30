'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function QueueModel({ color = '#EAB308', isHovered, isSelected }: ModelProps) {
  const packetsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (packetsRef.current) {
      const t = clock.getElapsedTime() * 0.8;
      packetsRef.current.children.forEach((child, i) => {
        const offset = ((t + i * 0.35) % 1.4) - 0.7;
        child.position.x = offset;
      });
    }
  });

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Conveyor Rail Base */}
      <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.1, 0.4]} />
        <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Two Lateral Guide Rails */}
      <mesh position={[0, -0.1, 0.22]}>
        <boxGeometry args={[1.64, 0.08, 0.04]} />
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </mesh>
      <mesh position={[0, -0.1, -0.22]}>
        <boxGeometry args={[1.64, 0.08, 0.04]} />
        <meshStandardMaterial color="#475569" metalness={0.9} />
      </mesh>

      {/* Moving Message Packets */}
      <group ref={packetsRef} position={[0, 0.02, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <group key={i}>
            <mesh castShadow>
              <boxGeometry args={[0.22, 0.22, 0.26]} />
              <meshStandardMaterial
                color="#0F172A"
                emissive={color}
                emissiveIntensity={0.5}
                roughness={0.3}
                metalness={0.8}
              />
            </mesh>
            {/* Edge glow line on packet */}
            <mesh position={[0, 0.115, 0]}>
              <boxGeometry args={[0.18, 0.02, 0.22]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Selection / Hover Accent Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.1, 32]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
