'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
}

export function NeuralNetworkModel({ color = '#8B5CF6', isHovered, isSelected }: ModelProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);

  // Memoize geometries to prevent GC pressure and optimize polygon budget
  const geometries = useMemo(() => ({
    sphereCore: new THREE.SphereGeometry(0.5, 18, 18), // Optimized from 24x24 to 18x18
    cage: new THREE.IcosahedronGeometry(0.75, 1),
    tokenRing: new THREE.TorusGeometry(0.92, 0.018, 8, 24), // Optimized from 8x32 to 8x24
    polarNode: new THREE.OctahedronGeometry(0.07, 0),
    glowRing: new THREE.RingGeometry(0.85, 1.05, 32),
  }), []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (coreRef.current && coreRef.current.material instanceof THREE.MeshStandardMaterial) {
      coreRef.current.material.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.3;
    }
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.y += delta * 0.8;
      ringGroupRef.current.rotation.x += delta * 0.4;
    }
  });

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Central Neural Sphere Core */}
      <mesh ref={coreRef} geometry={geometries.sphereCore} castShadow>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.65}
          roughness={0.25}
          metalness={0.6}
        />
      </mesh>

      {/* Geodesic Synaptic Wireframe Cage */}
      <mesh geometry={geometries.cage}>
        <meshStandardMaterial
          color="#A855F7"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Orbiting Synaptic Token Rings */}
      <group ref={ringGroupRef}>
        <mesh geometry={geometries.tokenRing} rotation={[Math.PI / 3, 0, 0]}>
          <meshBasicMaterial color="#C084FC" transparent opacity={0.6} />
        </mesh>
        {/* Orbital polar nodes */}
        <mesh geometry={geometries.polarNode} position={[0.92, 0, 0]}>
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh geometry={geometries.polarNode} position={[-0.92, 0, 0]}>
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>

      {/* Selection / Hover Glow Ring */}
      {(isSelected || isHovered) && (
        <mesh geometry={geometries.glowRing} position={[0, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.6 : 0.3} />
        </mesh>
      )}
    </group>
  );
}
