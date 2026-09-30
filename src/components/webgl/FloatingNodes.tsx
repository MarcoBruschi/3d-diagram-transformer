'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { ApiGatewayModel } from '@/components/three/Models/ApiGatewayModel';
import { ServerRackModel } from '@/components/three/Models/ServerRackModel';
import { DatabaseModel } from '@/components/three/Models/DatabaseModel';
import { FlowParticles } from '@/components/three/Connections/FlowParticles';
import { CAD_COLORS } from '@/lib/tokens';

export function FloatingNodes() {
  const groupRef = useRef<THREE.Group>(null);

  // Splines tridimensionais conectando os componentes de arquitetura
  const { curveGatewayToCompute, curveComputeToDatabase, curveFeedback } = useMemo(() => {
    // Gateway -> Compute Blade Rack
    const c1 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-3.2, 0.5, 0),
      new THREE.Vector3(-1.8, 1.2, 0.8),
      new THREE.Vector3(-1.2, -0.4, 0.6),
      new THREE.Vector3(0, -0.1, 0.2)
    );

    // Compute Blade Rack -> Database Platters
    const c2 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, -0.1, 0.2),
      new THREE.Vector3(1.2, 0.4, 0.6),
      new THREE.Vector3(1.8, -1.0, 0.8),
      new THREE.Vector3(3.2, -0.6, 0)
    );

    // Database -> Gateway (Retorno de telemetria curvada por baixo)
    const c3 = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(3.2, -0.6, 0),
      new THREE.Vector3(0, -1.8, -1.0),
      new THREE.Vector3(-3.2, 0.5, 0)
    );

    return {
      curveGatewayToCompute: c1,
      curveComputeToDatabase: c2,
      curveFeedback: c3,
    };
  }, []);

  useFrame(({ clock, pointer }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime() * 0.2;
      const targetRotY = Math.sin(t) * 0.08 + pointer.x * 0.15;
      const targetRotX = 0.06 - pointer.y * 0.1;

      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotY,
        0.04
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotX,
        0.04
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      {/* NÓ 1: Gateway Node (Ingress / Edge Controller) */}
      <Float speed={2} rotationIntensity={0.15} floatIntensity={0.35}>
        <group position={[-3.2, 0.5, 0]} scale={0.92}>
          <ApiGatewayModel color={CAD_COLORS.cyan} isHovered />
          {/* Halo de status volumétrico */}
          <mesh position={[0, -0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 0.95, 32]} />
            <meshBasicMaterial
              color={CAD_COLORS.cyan}
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </Float>

      {/* Spline 1: Gateway -> Compute */}
      <mesh>
        <tubeGeometry args={[curveGatewayToCompute, 48, 0.038, 8, false]} />
        <meshBasicMaterial color={CAD_COLORS.cyan} transparent opacity={0.65} />
      </mesh>
      <FlowParticles
        curve={curveGatewayToCompute}
        color={CAD_COLORS.sky}
        speed={0.45}
        count={5}
      />

      {/* NÓ 2: Compute Blade Rack (Microservices Cluster) */}
      <Float speed={1.8} rotationIntensity={0.12} floatIntensity={0.3}>
        <group position={[0, -0.1, 0.2]} scale={0.95}>
          <ServerRackModel color={CAD_COLORS.emerald} isHovered />
          {/* Anel de status do cluster */}
          <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.05, 1.2, 32]} />
            <meshBasicMaterial
              color={CAD_COLORS.emerald}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </Float>

      {/* Spline 2: Compute -> Database */}
      <mesh>
        <tubeGeometry args={[curveComputeToDatabase, 48, 0.038, 8, false]} />
        <meshBasicMaterial color={CAD_COLORS.amber} transparent opacity={0.65} />
      </mesh>
      <FlowParticles
        curve={curveComputeToDatabase}
        color={CAD_COLORS.amberBright}
        speed={0.5}
        count={5}
      />

      {/* NÓ 3: Database Platters (Persistence Cluster) */}
      <Float speed={2.2} rotationIntensity={0.18} floatIntensity={0.38}>
        <group position={[3.2, -0.6, 0]} scale={0.9}>
          <DatabaseModel color={CAD_COLORS.amber} isHovered />
          {/* Anel de status de persistência */}
          <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.95, 1.1, 32]} />
            <meshBasicMaterial
              color={CAD_COLORS.amber}
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </Float>

      {/* Spline 3: Feedback Loop Database -> Gateway */}
      <mesh>
        <tubeGeometry args={[curveFeedback, 48, 0.02, 8, false]} />
        <meshBasicMaterial color={CAD_COLORS.sky} transparent opacity={0.25} />
      </mesh>
      <FlowParticles
        curve={curveFeedback}
        color={CAD_COLORS.cyan}
        speed={0.3}
        count={3}
      />
    </group>
  );
}
