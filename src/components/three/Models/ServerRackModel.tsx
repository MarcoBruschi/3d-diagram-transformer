'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
  status?: string;
}

const TRAY_X_OFFSETS = [-0.6, -0.42, -0.24, -0.06, 0.12, 0.3, 0.48, 0.66];

export function ServerRackModel({ color = '#10B981', isHovered, isSelected }: ModelProps) {
  const ledRef = useRef<THREE.Group>(null);

  const geometries = useMemo(() => ({
    chassis: new THREE.BoxGeometry(1.6, 0.45, 1.2),
    faceplate: new THREE.BoxGeometry(1.56, 0.41, 0.04),
    ear: new THREE.BoxGeometry(0.1, 0.48, 0.12),
    tray: new THREE.BoxGeometry(0.15, 0.28, 0.02),
    latch: new THREE.BoxGeometry(0.12, 0.04, 0.02),
    led: new THREE.BoxGeometry(0.04, 0.02, 0.01),
    fan: new THREE.CylinderGeometry(0.16, 0.16, 0.02, 14),
    glowRing: new THREE.RingGeometry(0.9, 1.05, 32),
  }), []);

  useFrame(({ clock }) => {
    if (ledRef.current) {
      const t = clock.getElapsedTime();
      ledRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          child.material.opacity = 0.4 + Math.sin(t * 4 + i * 1.5) * 0.45;
        }
      });
    }
  });

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Main 2U Chassis */}
      <mesh geometry={geometries.chassis} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          color="#1E2738"
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>

      {/* Front Faceplate */}
      <mesh geometry={geometries.faceplate} position={[0, 0, 0.61]} castShadow>
        <meshStandardMaterial
          color="#0F172A"
          roughness={0.25}
          metalness={0.9}
        />
      </mesh>

      {/* Rack Ears (Mounting Brackets) */}
      <mesh geometry={geometries.ear} position={[-0.85, 0, 0.55]}>
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh geometry={geometries.ear} position={[0.85, 0, 0.55]}>
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Hot-Swap Drive Trays (8 bays) */}
      {TRAY_X_OFFSETS.map((x, i) => (
        <group key={i} position={[x, -0.05, 0.63]}>
          <mesh geometry={geometries.tray}>
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Drive latch */}
          <mesh geometry={geometries.latch} position={[0, -0.08, 0.015]}>
            <meshStandardMaterial color="#64748B" />
          </mesh>
        </group>
      ))}

      {/* Blinking Activity LEDs */}
      <group ref={ledRef} position={[0, 0.12, 0.64]}>
        {TRAY_X_OFFSETS.map((x, i) => (
          <mesh key={i} geometry={geometries.led} position={[x, 0, 0]}>
            <meshBasicMaterial color={color} transparent opacity={0.9} />
          </mesh>
        ))}
      </group>

      {/* Rear Exhaust Fan Grills */}
      <mesh geometry={geometries.fan} position={[-0.4, 0, -0.61]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      <mesh geometry={geometries.fan} position={[0.4, 0, -0.61]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#0F172A" />
      </mesh>

      {/* Selection / Hover Accent Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh geometry={geometries.glowRing} position={[0, -0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
