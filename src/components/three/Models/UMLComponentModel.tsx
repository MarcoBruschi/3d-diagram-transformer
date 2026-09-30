'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NodeStatus } from '@/types/diagram';

interface UMLComponentModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
  status?: NodeStatus;
}

/**
 * Procedural 3D UML 2.0 Component Model
 * Features the universal UML component shape with two protruding module tabs on the left face.
 */
export function UMLComponentModel({
  color = '#0EA5E9',
  isHovered = false,
  isSelected = false,
  status = 'active',
}: UMLComponentModelProps) {
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const t = clock.getElapsedTime();
      const s = 1 + Math.sin(t * 3) * 0.04;
      pulseRef.current.scale.set(s, s, s);
    }
  });

  const bodyColor = isSelected ? '#38BDF8' : isHovered ? '#0284C7' : '#0F172A';
  const tabColor = isSelected ? '#7DD3FC' : color;

  return (
    <group>
      {/* Main Component Chassis */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.2, 0.7]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.25}
          metalness={0.75}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : 0}
        />
      </mesh>

      {/* Front Glossy Faceplate */}
      <mesh position={[0, 0, 0.36]}>
        <planeGeometry args={[2.0, 1.0]} />
        <meshStandardMaterial
          color="#030712"
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Iconic UML Tab 1 (Top Left Prong) */}
      <mesh position={[-1.15, 0.28, 0]} castShadow>
        <boxGeometry args={[0.3, 0.26, 0.45]} />
        <meshStandardMaterial
          color={tabColor}
          roughness={0.2}
          metalness={0.8}
          emissive={tabColor}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Iconic UML Tab 2 (Bottom Left Prong) */}
      <mesh position={[-1.15, -0.28, 0]} castShadow>
        <boxGeometry args={[0.3, 0.26, 0.45]} />
        <meshStandardMaterial
          color={tabColor}
          roughness={0.2}
          metalness={0.8}
          emissive={tabColor}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Glowing Status LED / Activity Core */}
      <mesh ref={pulseRef} position={[0.75, 0.32, 0.38]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial
          color={status === 'error' ? '#F43F5E' : status === 'warning' ? '#F59E0B' : '#10B981'}
        />
      </mesh>

      {/* Selection Glow Aura */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[2.3, 1.3, 0.8]} />
          <meshBasicMaterial color="#38BDF8" wireframe opacity={0.4} transparent />
        </mesh>
      )}
    </group>
  );
}
