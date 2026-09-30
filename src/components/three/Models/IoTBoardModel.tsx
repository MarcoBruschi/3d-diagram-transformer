'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function IoTBoardModel({ color = '#10B981', isHovered, isSelected }: ModelProps) {
  const ledRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ledRef.current && ledRef.current.material instanceof THREE.MeshBasicMaterial) {
      const t = clock.getElapsedTime();
      ledRef.current.material.opacity = Math.sin(t * 8) > 0 ? 1 : 0.2;
    }
  });

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Printed Circuit Board (PCB) Substrate */}
      <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.06, 0.9]} />
        <meshStandardMaterial color="#064E3B" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Main MCU Microchip (ESP32 / Microcontroller) */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#0F172A" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Metal RF Shield Cap */}
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[0.42, 0.02, 0.42]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* GPIO Pin Header Rows (Top and Bottom) */}
      {[-0.38, 0.38].map((z, rowIdx) => (
        <group key={rowIdx} position={[0, 0.08, z]}>
          <mesh>
            <boxGeometry args={[1.2, 0.1, 0.08]} />
            <meshStandardMaterial color="#1E293B" roughness={0.4} />
          </mesh>
          {/* Gold Pin Tips */}
          {[-0.5, -0.3, -0.1, 0.1, 0.3, 0.5].map((x, pinIdx) => (
            <mesh key={pinIdx} position={[x, 0.08, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
              <meshStandardMaterial color="#F59E0B" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Micro-USB Port on Edge */}
      <mesh position={[-0.7, 0, 0]} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.2]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* PCB Trace Antenna Geometry */}
      <mesh position={[0.5, 0.01, 0]}>
        <boxGeometry args={[0.25, 0.02, 0.4]} />
        <meshStandardMaterial color="#D97706" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Blinking Activity Status LED */}
      <mesh ref={ledRef} position={[-0.35, 0.02, 0.2]}>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.9} />
      </mesh>

      {/* Selection / Hover Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 1.05, 32]} />
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
