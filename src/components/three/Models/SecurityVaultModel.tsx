'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NodeStatus } from '@/types/diagram';

interface SecurityVaultModelProps {
  color?: string;
  isHovered?: boolean;
  isSelected?: boolean;
  status?: NodeStatus;
}

/**
 * Procedural 3D Security / Cryptographic Vault Model
 * Optimized PBR geometry and precalculated perimeter rivet coordinates.
 */
export function SecurityVaultModel({
  color = '#EC4899',
  isHovered = false,
  isSelected = false,
  status = 'active',
}: SecurityVaultModelProps) {
  const cipherRef = useRef<THREE.Mesh>(null);
  const lockRef = useRef<THREE.Mesh>(null);

  // Memoize shared geometries and fixed trigonometric bolt rivet offsets
  const { geometries, boltPositions } = useMemo(() => {
    const bolts = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const ang = (i * Math.PI) / 4;
      return [Math.cos(ang) * 0.78, Math.sin(ang) * 0.78, 0.41] as [number, number, number];
    });

    return {
      boltPositions: bolts,
      geometries: {
        enclosure: new THREE.CylinderGeometry(0.9, 0.9, 0.8, 8),
        cipherRing: new THREE.TorusGeometry(0.55, 0.05, 10, 24), // Optimized from 12x32 to 10x24
        lockEmblem: new THREE.OctahedronGeometry(0.22, 0),
        bolt: new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8),
        selectionGlow: new THREE.CylinderGeometry(0.95, 0.95, 0.85, 8),
      },
    };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (cipherRef.current) {
      cipherRef.current.rotation.z = -t * 1.2;
    }
    if (lockRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.05;
      lockRef.current.scale.set(s, s, s);
    }
  });

  const vaultColor = isSelected ? '#BE185D' : isHovered ? '#831843' : '#1C1917';

  return (
    <group scale={isHovered ? 1.08 : 1.0}>
      {/* Heavy Armored Octagonal / Chamfered Vault Enclosure */}
      <mesh geometry={geometries.enclosure} castShadow receiveShadow>
        <meshStandardMaterial
          color={vaultColor}
          roughness={0.30}
          metalness={0.90}
        />
      </mesh>

      {/* Front Rotating Cryptographic Cipher Ring */}
      <mesh ref={cipherRef} geometry={geometries.cipherRing} position={[0, 0, 0.42]}>
        <meshStandardMaterial
          color="#A16207"
          roughness={0.25}
          metalness={0.80}
          emissive="#EC4899"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Center Holographic Security Shield Emblem */}
      <mesh ref={lockRef} geometry={geometries.lockEmblem} position={[0, 0, 0.44]}>
        <meshBasicMaterial
          color={status === 'error' ? '#F43F5E' : '#FACC15'}
          wireframe
        />
      </mesh>

      {/* Perimeter Bolt Rivets */}
      {boltPositions.map((pos, i) => (
        <mesh key={i} geometry={geometries.bolt} position={pos}>
          <meshStandardMaterial color="#78716C" metalness={0.85} roughness={0.30} />
        </mesh>
      ))}

      {/* Selection Glow */}
      {isSelected && (
        <mesh geometry={geometries.selectionGlow}>
          <meshBasicMaterial color="#F472B6" wireframe opacity={0.4} transparent />
        </mesh>
      )}
    </group>
  );
}
