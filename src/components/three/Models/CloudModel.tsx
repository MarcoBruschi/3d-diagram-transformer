'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function CloudModel({ color = '#60A5FA', isHovered, isSelected }: ModelProps) {
  const satellitesRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const geometries = useMemo(() => ({
    core: new THREE.SphereGeometry(0.38, 18, 18),
    dodecMain: new THREE.DodecahedronGeometry(0.7, 1),
    dodecLeft: new THREE.DodecahedronGeometry(0.48, 1),
    dodecRight: new THREE.DodecahedronGeometry(0.52, 1),
    sat1: new THREE.OctahedronGeometry(0.1, 0),
    sat2: new THREE.OctahedronGeometry(0.08, 0),
    sat3: new THREE.OctahedronGeometry(0.09, 0),
    glowRing: new THREE.RingGeometry(0.95, 1.15, 32),
  }), []);

  useFrame(({ clock }, delta) => {
    if (satellitesRef.current) {
      satellitesRef.current.rotation.y += delta * 0.8;
      satellitesRef.current.rotation.x += delta * 0.3;
    }
    if (coreRef.current && coreRef.current.material instanceof THREE.MeshStandardMaterial) {
      const t = clock.getElapsedTime();
      coreRef.current.material.emissiveIntensity = 0.5 + Math.sin(t * 2.5) * 0.25;
    }
  });

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Central Glowing Energy Core */}
      <mesh ref={coreRef} geometry={geometries.core} position={[0, 0, 0]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>

      {/* Volumetric Cluster Components (Translucent Polyhedrons) */}
      <mesh geometry={geometries.dodecMain} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial
          color="#1E293B"
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.8}
        />
      </mesh>
      <mesh geometry={geometries.dodecLeft} position={[-0.45, -0.1, 0.2]}>
        <meshStandardMaterial
          color="#2563EB"
          roughness={0.4}
          metalness={0.6}
          transparent
          opacity={0.65}
        />
      </mesh>
      <mesh geometry={geometries.dodecRight} position={[0.45, 0.1, -0.2]}>
        <meshStandardMaterial
          color="#1D4ED8"
          roughness={0.4}
          metalness={0.6}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Orbiting Satellite Data Nodes */}
      <group ref={satellitesRef}>
        <mesh geometry={geometries.sat1} position={[1.1, 0.3, 0]}>
          <meshBasicMaterial color="#93C5FD" />
        </mesh>
        <mesh geometry={geometries.sat2} position={[-1.0, -0.2, 0.4]}>
          <meshBasicMaterial color="#60A5FA" />
        </mesh>
        <mesh geometry={geometries.sat3} position={[0.2, -0.9, -0.5]}>
          <meshBasicMaterial color="#38BDF8" />
        </mesh>
      </group>

      {/* Selection / Hover Accent Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh geometry={geometries.glowRing} position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
