'use client';

import React from 'react';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function UMLClassModel({ color = '#38BDF8', isHovered, isSelected }: ModelProps) {
  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Main Structural Class Box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.4, 0.35]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Top Header Compartment (Class Name Banner) */}
      <mesh position={[0, 0.48, 0.18]}>
        <boxGeometry args={[1.44, 0.38, 0.02]} />
        <meshStandardMaterial color="#1E293B" metalness={0.7} />
      </mesh>
      {/* Header Accent Line */}
      <mesh position={[0, 0.28, 0.19]}>
        <boxGeometry args={[1.42, 0.02, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Middle Compartment (Attributes Slot) */}
      <mesh position={[0, 0.05, 0.18]}>
        <boxGeometry args={[1.44, 0.4, 0.02]} />
        <meshStandardMaterial color="#090D16" />
      </mesh>
      {/* Attribute Mock Lines */}
      {[-0.05, 0.05, 0.15].map((y, i) => (
        <mesh key={i} position={[-0.2 + (i % 2) * 0.1, y, 0.195]}>
          <planeGeometry args={[0.8, 0.03]} />
          <meshBasicMaterial color="#64748B" />
        </mesh>
      ))}

      {/* Separator Line */}
      <mesh position={[0, -0.16, 0.19]}>
        <boxGeometry args={[1.42, 0.02, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Bottom Compartment (Methods Slot) */}
      <mesh position={[0, -0.42, 0.18]}>
        <boxGeometry args={[1.44, 0.44, 0.02]} />
        <meshStandardMaterial color="#090D16" />
      </mesh>
      {/* Method Mock Lines */}
      {[-0.32, -0.42, -0.52].map((y, i) => (
        <mesh key={i} position={[-0.15 - (i % 2) * 0.1, y, 0.195]}>
          <planeGeometry args={[0.9, 0.03]} />
          <meshBasicMaterial color="#38BDF8" />
        </mesh>
      ))}

      {/* Selection / Hover Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh position={[0, -0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.1, 32]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
