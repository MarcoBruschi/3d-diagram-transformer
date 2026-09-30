'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gridVertexShader, gridFragmentShader } from '@/shaders/gridShaders';
import { CAD_COLORS } from '@/lib/tokens';
import { useThemeStore } from '@/store/useThemeStore';

export function FloorGridShader() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColorGridPrimary: {
        value: new THREE.Color(isDark ? CAD_COLORS.laserGrid : '#0284C7'),
      },
      uColorGridSecondary: {
        value: new THREE.Color(isDark ? CAD_COLORS.laserSubGrid : '#CBD5E1'),
      },
      uColorBg: {
        value: new THREE.Color(isDark ? CAD_COLORS.bgDark : '#FAFAFA'),
      },
      uFogNear: { value: 4.0 },
      uFogFar: { value: 36.0 },
      uCameraPos: { value: new THREE.Vector3() },
    }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (materialRef.current) {
      if (isDark) {
        materialRef.current.uniforms.uColorBg.value.set(CAD_COLORS.bgDark);
        materialRef.current.uniforms.uColorGridPrimary.value.set(CAD_COLORS.laserGrid);
        materialRef.current.uniforms.uColorGridSecondary.value.set(CAD_COLORS.laserSubGrid);
      } else {
        materialRef.current.uniforms.uColorBg.value.set('#FAFAFA');
        materialRef.current.uniforms.uColorGridPrimary.value.set('#0284C7');
        materialRef.current.uniforms.uColorGridSecondary.value.set('#CBD5E1');
      }
    }
  }, [isDark]);

  useFrame(({ clock, pointer, camera }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      materialRef.current.uniforms.uMouse.value.lerp(pointer, 0.08);
      materialRef.current.uniforms.uCameraPos.value.copy(camera.position);
    }
  });

  return (
    <mesh position={[0, -2.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[70, 70, 90, 90]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={gridVertexShader}
        fragmentShader={gridFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
