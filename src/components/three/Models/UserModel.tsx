'use client';

import React from 'react';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function UserModel({ color = '#38BDF8', isHovered, isSelected }: ModelProps) {
  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Floating Holographic Pedestal */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 0.1, 24]} />
        <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Torso / Shoulders */}
      <mesh position={[0, -0.05, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.45, 0.5, 16]} />
        <meshStandardMaterial color="#0F172A" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.12, 12]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Head / Visor Helmet */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.24, 20, 20]} />
        <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Glowing Visor */}
      <mesh position={[0, 0.46, 0.18]}>
        <boxGeometry args={[0.3, 0.09, 0.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.1}
        />
      </mesh>

      {/* Selection / Hover Accent Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh position={[0, -0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.9, 32]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
