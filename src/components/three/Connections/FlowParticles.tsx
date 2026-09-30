'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLayersStore } from '@/store/useLayersStore';

interface FlowParticlesProps {
  curve: THREE.Curve<THREE.Vector3>;
  color?: string;
  speed?: number;
  count?: number;
}

interface ParticleTrailRef {
  head: THREE.Mesh | null;
  halo: THREE.Mesh | null;
  tail1: THREE.Mesh | null;
  tail2: THREE.Mesh | null;
}

export function FlowParticles({
  curve,
  color = '#38BDF8',
  speed = 0.35,
  count = 3,
}: FlowParticlesProps) {
  const particlesVisible = useLayersStore((s) => s.layers.particles);

  // Array of trail references for each photon packet
  const packetRefs = useRef<ParticleTrailRef[]>([]);

  const offsets = useMemo(() => {
    return Array.from({ length: count }, (_, i) => i / count);
  }, [count]);

  useFrame(({ clock }) => {
    if (!particlesVisible) return;
    const t = clock.getElapsedTime() * speed;

    offsets.forEach((offset, i) => {
      const refs = packetRefs.current[i];
      if (!refs) return;

      const progress = (t + offset) % 1;
      const headPt = curve.getPointAt(progress);

      // Head core position
      if (refs.head) {
        refs.head.position.set(headPt.x, headPt.y, headPt.z);
      }
      // Outer halo pulse
      if (refs.halo) {
        refs.halo.position.set(headPt.x, headPt.y, headPt.z);
        const pulse = 1 + 0.15 * Math.sin(t * 8 + i * 2);
        refs.halo.scale.set(pulse, pulse, pulse);
      }
      // Trail segments following behind
      if (refs.tail1) {
        const prog1 = (progress - 0.02 + 1) % 1;
        const pt1 = curve.getPointAt(prog1);
        refs.tail1.position.set(pt1.x, pt1.y, pt1.z);
      }
      if (refs.tail2) {
        const prog2 = (progress - 0.04 + 1) % 1;
        const pt2 = curve.getPointAt(prog2);
        refs.tail2.position.set(pt2.x, pt2.y, pt2.z);
      }
    });
  });

  if (!particlesVisible) return null;

  return (
    <group>
      {offsets.map((_, i) => {
        if (!packetRefs.current[i]) {
          packetRefs.current[i] = { head: null, halo: null, tail1: null, tail2: null };
        }
        return (
          <group key={i}>
            {/* Bright Lead Core */}
            <mesh
              ref={(el) => {
                if (packetRefs.current[i]) packetRefs.current[i].head = el;
              }}
            >
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>

            {/* Glowing Luminous Halo */}
            <mesh
              ref={(el) => {
                if (packetRefs.current[i]) packetRefs.current[i].halo = el;
              }}
            >
              <sphereGeometry args={[0.075, 12, 12]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.65}
                depthWrite={false}
              />
            </mesh>

            {/* Trail 1: Mid-intensity */}
            <mesh
              ref={(el) => {
                if (packetRefs.current[i]) packetRefs.current[i].tail1 = el;
              }}
            >
              <sphereGeometry args={[0.038, 8, 8]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.4}
                depthWrite={false}
              />
            </mesh>

            {/* Trail 2: Soft tail fade */}
            <mesh
              ref={(el) => {
                if (packetRefs.current[i]) packetRefs.current[i].tail2 = el;
              }}
            >
              <sphereGeometry args={[0.024, 8, 8]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.2}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
