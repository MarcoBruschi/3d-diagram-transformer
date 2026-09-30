'use client';

import React from 'react';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function WorkstationModel({ color = '#38BDF8', isHovered, isSelected }: ModelProps) {
  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Laptop Base (Keyboard Chassis) */}
      <mesh position={[0, -0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.06, 0.9]} />
        <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Recessed Keyboard Well */}
      <mesh position={[0, -0.115, -0.08]}>
        <boxGeometry args={[1.1, 0.01, 0.45]} />
        <meshStandardMaterial color="#0F172A" metalness={0.6} roughness={0.5} />
      </mesh>

      {/* Trackpad */}
      <mesh position={[0, -0.115, 0.26]}>
        <boxGeometry args={[0.38, 0.01, 0.24]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Display Lid (Hinged at back) */}
      <group position={[0, -0.12, -0.44]} rotation={[0.4, 0, 0]}>
        {/* Lid back shell */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[1.3, 0.84, 0.04]} />
          <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.3} />
        </mesh>

        {/* Display Screen Bezel */}
        <mesh position={[0, 0.42, 0.022]}>
          <boxGeometry args={[1.24, 0.78, 0.01]} />
          <meshStandardMaterial color="#020617" roughness={0.2} />
        </mesh>

        {/* Emissive Code / Terminal Display */}
        <mesh position={[0, 0.42, 0.028]}>
          <planeGeometry args={[1.16, 0.7]} />
          <meshStandardMaterial
            color="#080C14"
            emissive={color}
            emissiveIntensity={0.35}
            roughness={0.1}
          />
        </mesh>

        {/* Simulated Terminal Lines */}
        {[-0.22, -0.12, -0.02, 0.08, 0.18, 0.28].map((y, i) => (
          <mesh key={i} position={[-0.15 + (i % 2) * 0.1, y + 0.42, 0.03]}>
            <planeGeometry args={[0.6 - (i % 3) * 0.15, 0.03]} />
            <meshBasicMaterial color={color} transparent opacity={0.8} />
          </mesh>
        ))}
      </group>

      {/* Selection / Hover Accent Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 1.05, 32]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
