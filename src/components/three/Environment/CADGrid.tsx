'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLayersStore } from '@/store/useLayersStore';
import { useThemeStore } from '@/store/useThemeStore';

export function CADGrid() {
  const gridVisible = useLayersStore((s) => s.layers.grid);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const ringRef = useRef<THREE.Mesh>(null);
  const sweepRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.05;
    }
    if (sweepRef.current) {
      sweepRef.current.rotation.z -= delta * 0.4;
    }
  });

  if (!gridVisible) return null;

  const primaryCenter = isDark ? '#1E293B' : '#94A3B8';
  const primaryGrid = isDark ? '#0F172A' : '#CBD5E1';
  const secCenter = isDark ? '#334155' : '#CBD5E1';
  const secGrid = isDark ? '#1E293B' : '#E2E8F0';
  const ringColor = isDark ? '#38BDF8' : '#0284C7';

  return (
    <group position={[0, -3.5, 0]}>
      {/* Primary infinite technical grid */}
      <gridHelper
        args={[60, 60, primaryCenter, primaryGrid]}
        position={[0, 0, 0]}
      />

      {/* Secondary finer coordinate grid */}
      <gridHelper
        args={[30, 60, secCenter, secGrid]}
        position={[0, 0.01, 0]}
      />

      {/* Radar concentric circular guides & sweeping beam */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh ref={ringRef} position={[0, 0, 0.02]}>
          <ringGeometry args={[7.8, 8.0, 64]} />
          <meshBasicMaterial color={ringColor} transparent opacity={isDark ? 0.12 : 0.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <ringGeometry args={[13.8, 14.0, 64]} />
          <meshBasicMaterial color={ringColor} transparent opacity={isDark ? 0.06 : 0.1} side={THREE.DoubleSide} />
        </mesh>

        {/* Sweeping Radar Scanner Beam */}
        <group ref={sweepRef} position={[0, 0, 0.025]}>
          <mesh position={[0, 7, 0]}>
            <planeGeometry args={[0.06, 14]} />
            <meshBasicMaterial
              color={ringColor}
              transparent
              opacity={isDark ? 0.35 : 0.4}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[0, 0, 0.2]}>
            <ringGeometry args={[0.2, 14, 32, 1, 0, Math.PI / 5]} />
            <meshBasicMaterial
              color={ringColor}
              transparent
              opacity={isDark ? 0.035 : 0.05}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>

      {/* Subtle floor contact shadow receiver */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <shadowMaterial opacity={isDark ? 0.3 : 0.15} />
      </mesh>
    </group>
  );
}
