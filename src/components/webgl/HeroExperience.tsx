'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FloorGridShader } from './FloorGridShader';
import { FloatingNodes } from './FloatingNodes';
import { PostProcessing } from './PostProcessing';
import { useThemeStore } from '@/store/useThemeStore';

// Trajetória cinemática com 4 waypoints acoplados à jornada da página inteira
const WAYPOINTS = [
  { progress: 0.0, pos: new THREE.Vector3(0, 1.2, 7.5), target: new THREE.Vector3(0, 0, 0) },
  { progress: 0.35, pos: new THREE.Vector3(-0.8, 0.4, 3.2), target: new THREE.Vector3(0, 0.1, 0) },
  { progress: 0.7, pos: new THREE.Vector3(2.2, -0.2, 3.0), target: new THREE.Vector3(2.8, -0.4, 0) },
  { progress: 1.0, pos: new THREE.Vector3(0, 3.8, 6.5), target: new THREE.Vector3(0, 0, 0) },
];

export function HeroExperience() {
  const scrollProgress = useRef(0);
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const destPos = useRef(new THREE.Vector3(0, 1.2, 7.5));
  const destTarget = useRef(new THREE.Vector3(0, 0, 0));

  // Escuta contínua e ultra-leve do scroll da janela inteira
  useEffect(() => {
    const updateScroll = () => {
      if (typeof window === 'undefined') return;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      scrollProgress.current = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, []);

  useFrame(({ camera, pointer }) => {
    const p = scrollProgress.current;

    // Interpolação por trechos de waypoints
    if (p <= 0.35) {
      const t = p / 0.35;
      destPos.current.lerpVectors(WAYPOINTS[0].pos, WAYPOINTS[1].pos, t);
      destTarget.current.lerpVectors(WAYPOINTS[0].target, WAYPOINTS[1].target, t);
    } else if (p <= 0.7) {
      const t = (p - 0.35) / 0.35;
      destPos.current.lerpVectors(WAYPOINTS[1].pos, WAYPOINTS[2].pos, t);
      destTarget.current.lerpVectors(WAYPOINTS[1].target, WAYPOINTS[2].target, t);
    } else {
      const t = (p - 0.7) / 0.3;
      destPos.current.lerpVectors(WAYPOINTS[2].pos, WAYPOINTS[3].pos, t);
      destTarget.current.lerpVectors(WAYPOINTS[2].target, WAYPOINTS[3].target, t);
    }

    // Parallax tático sutil por influência do mouse no pointer
    const mouseInfluenceX = pointer.x * 0.25;
    const mouseInfluenceY = pointer.y * 0.15;

    const targetCamX = destPos.current.x + mouseInfluenceX;
    const targetCamY = destPos.current.y + mouseInfluenceY;
    const targetCamZ = destPos.current.z;

    // Suavização contínua inercial via lerp (0.05) para movimento sem trancos
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.05);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.05);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.05);

    currentTarget.current.x = THREE.MathUtils.lerp(
      currentTarget.current.x,
      destTarget.current.x,
      0.05
    );
    currentTarget.current.y = THREE.MathUtils.lerp(
      currentTarget.current.y,
      destTarget.current.y,
      0.05
    );
    currentTarget.current.z = THREE.MathUtils.lerp(
      currentTarget.current.z,
      destTarget.current.z,
      0.05
    );

    camera.lookAt(currentTarget.current);
  });

  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <>
      {/* Cenografia de Iluminação Técnica */}
      <ambientLight intensity={isDark ? 0.4 : 0.85} color={isDark ? '#0A1120' : '#FFFFFF'} />
      <directionalLight position={[6, 10, 6]} intensity={isDark ? 1.2 : 1.5} color="#FFFFFF" castShadow />
      <pointLight position={[-4, 3, 2]} intensity={isDark ? 2.5 : 2.0} distance={10} color="#00F0FF" />
      <pointLight position={[4, -1, 3]} intensity={isDark ? 2.0 : 1.6} distance={10} color="#F59E0B" />
      <pointLight position={[0, 2, -2]} intensity={isDark ? 1.8 : 1.5} distance={8} color="#10B981" />

      {/* Grade de Piso Shader com Deformação de Onda e Névoa Linear */}
      <FloorGridShader />

      {/* Constelação Espacial Interativa com Nodos e Splines */}
      <FloatingNodes />

      {/* Pós-processamento GLSL (Aberração Cromática + Noise Filmic) */}
      <PostProcessing />
    </>
  );
}
