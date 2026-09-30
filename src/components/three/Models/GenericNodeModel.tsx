'use client';

import React from 'react';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
  badge?: string;
}

export function GenericNodeModel({ color = '#94A3B8', isHovered, isSelected }: ModelProps) {
  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Central Hexagonal / Beveled Node Chassis */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.65, 0.65, 0.5, 6]} />
        <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Internal Core Accent */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.52, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>

      {/* Top Cap */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.06, 6]} />
        <meshStandardMaterial color="#0F172A" metalness={0.9} />
      </mesh>

      {/* Selection / Hover Accent Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.95, 32]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
