'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function DatabaseModel({ color = '#F59E0B', isHovered, isSelected }: ModelProps) {
  const ringRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  // Memoize shared geometries to eliminate redundant GPU buffers
  const geometries = useMemo(() => ({
    core: new THREE.CylinderGeometry(0.42, 0.42, 1.25, 20),
    platter: new THREE.CylinderGeometry(0.72, 0.72, 0.22, 28),
    chamfer: new THREE.TorusGeometry(0.72, 0.02, 8, 24), // Optimized from 12x32 to 8x24
    head: new THREE.BoxGeometry(0.08, 0.05, 0.02),
    orbitalRing: new THREE.TorusGeometry(0.95, 0.02, 8, 24),
    satellite: new THREE.SphereGeometry(0.06, 10, 10),
    topCap: new THREE.CylinderGeometry(0.5, 0.65, 0.08, 20),
    glowRing: new THREE.RingGeometry(0.85, 1.05, 32),
  }), []);

  useFrame(({ clock }, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 1.2;
    }
    if (coreRef.current && coreRef.current.material instanceof THREE.MeshStandardMaterial) {
      const t = clock.getElapsedTime();
      coreRef.current.material.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.3;
    }
  });

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Central Pulsing Energy Core */}
      <mesh ref={coreRef} geometry={geometries.core} position={[0, 0, 0]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.25}
          metalness={0.6}
        />
      </mesh>

      {/* 3 Tiered Metallic Storage Platters */}
      {[-0.4, 0, 0.4].map((y, i) => (
        <group key={i} position={[0, y, 0]}>
          <mesh geometry={geometries.platter} castShadow receiveShadow>
            <meshStandardMaterial
              color="#334155"
              metalness={0.90}
              roughness={0.20}
            />
          </mesh>
          {/* Edge Chamfer Rim */}
          <mesh geometry={geometries.chamfer} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Front Disk Read Head Indicator */}
          <mesh geometry={geometries.head} position={[0, 0, 0.73]}>
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      ))}

      {/* Rotating Magnetic Flux Ring */}
      <group ref={ringRef} position={[0, 0, 0]}>
        <mesh geometry={geometries.orbitalRing} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
        {/* Orbital magnetic data node */}
        <mesh geometry={geometries.satellite} position={[0.95, 0, 0]}>
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* Top Cap Bezel */}
      <mesh geometry={geometries.topCap} position={[0, 0.58, 0]}>
        <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Selection / Hover Accent Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh geometry={geometries.glowRing} position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
