'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function ApiGatewayModel({ color = '#8B5CF6', isHovered, isSelected }: ModelProps) {
  const laserRef = useRef<THREE.Mesh>(null);
  const portalRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (laserRef.current) {
      laserRef.current.position.y = Math.sin(t * 3) * 0.45;
    }
    if (portalRef.current && portalRef.current.material instanceof THREE.MeshStandardMaterial) {
      portalRef.current.material.opacity = 0.25 + Math.sin(t * 2) * 0.1;
    }
  });

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Left Pillar */}
      <mesh position={[-0.65, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 1.4, 0.35]} />
        <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Left Pillar Neon Groove */}
      <mesh position={[-0.54, 0, 0.1]}>
        <boxGeometry args={[0.02, 1.3, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Right Pillar */}
      <mesh position={[0.65, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 1.4, 0.35]} />
        <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Right Pillar Neon Groove */}
      <mesh position={[0.54, 0, 0.1]}>
        <boxGeometry args={[0.02, 1.3, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Top Lintel Arch */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[1.5, 0.2, 0.35]} />
        <meshStandardMaterial color="#0F172A" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Holographic Portal Field */}
      <mesh ref={portalRef} position={[0, 0, 0]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Scanning Laser Beam Line */}
      <mesh ref={laserRef} position={[0, 0, 0.02]}>
        <boxGeometry args={[1.1, 0.03, 0.02]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      {/* Selection / Hover Accent Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh position={[0, -0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.1, 32]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
