'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useThemeStore } from '@/store/useThemeStore';

import { WorkstationModel } from '../three/Models/WorkstationModel';
import { ServerRackModel } from '../three/Models/ServerRackModel';
import { DatabaseModel } from '../three/Models/DatabaseModel';
import { FlowParticles } from '../three/Connections/FlowParticles';
import { StudioLighting } from '../three/Lighting/StudioLighting';

function HeroScene() {
  const groupRef = useRef<THREE.Group>(null);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  useFrame(({ clock, pointer }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * 0.4;
      // Gentle parallax and slow orbital tilt
      groupRef.current.rotation.y = Math.sin(t) * 0.2 + pointer.x * 0.3;
      groupRef.current.rotation.x = 0.15 + pointer.y * 0.15;
    }
  });

  // Curve 1: Laptop to Server
  const curve1 = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-2.8, 1.2, 0),
    new THREE.Vector3(-1.4, 0.4, 0.6),
    new THREE.Vector3(0, -0.2, 0)
  );

  // Curve 2: Server to Database
  const curve2 = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, -0.2, 0),
    new THREE.Vector3(1.4, -0.8, 0.6),
    new THREE.Vector3(2.8, -1.2, 0)
  );

  const tubeColor1 = isDark ? '#38BDF8' : '#0284C7';
  const tubeColor2 = isDark ? '#F59E0B' : '#D97706';
  const particleColor1 = isDark ? '#7DD3FC' : '#0369A1';
  const particleColor2 = isDark ? '#FCD34D' : '#B45309';

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Laptop Workstation */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        <group position={[-2.8, 1.2, 0]} scale={0.9}>
          <WorkstationModel color={tubeColor1} isHovered />
        </group>
      </Float>

      {/* Connection 1 */}
      <mesh>
        <tubeGeometry args={[curve1, 32, 0.035, 8, false]} />
        <meshBasicMaterial color={tubeColor1} transparent opacity={isDark ? 0.6 : 0.85} />
      </mesh>
      <FlowParticles curve={curve1} color={particleColor1} speed={0.4} count={4} />

      {/* Server Rack Blade */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        <group position={[0, -0.2, 0]} scale={0.9}>
          <ServerRackModel color={isDark ? '#10B981' : '#059669'} isHovered />
        </group>
      </Float>

      {/* Connection 2 */}
      <mesh>
        <tubeGeometry args={[curve2, 32, 0.035, 8, false]} />
        <meshBasicMaterial color={tubeColor2} transparent opacity={isDark ? 0.6 : 0.85} />
      </mesh>
      <FlowParticles curve={curve2} color={particleColor2} speed={0.4} count={4} />

      {/* Database Platters */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        <group position={[2.8, -1.2, 0]} scale={0.9}>
          <DatabaseModel color={tubeColor2} isHovered />
        </group>
      </Float>
    </group>
  );
}

export function HeroCanvas() {
  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 1.5, 7.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <StudioLighting />
        <HeroScene />
      </Canvas>
    </div>
  );
}
