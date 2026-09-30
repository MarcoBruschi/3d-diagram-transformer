'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { HeroExperience } from './HeroExperience';

interface CanvasRootProps {
  heroElementId?: string;
}

export function CanvasRoot({ heroElementId }: CanvasRootProps) {
  const [dpr, setDpr] = useState(1);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detecção segura de suporte a WebGL 2.0 / WebGL
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!gl) {
        setHasWebGL(false);
      }
    } catch {
      setHasWebGL(false);
    }

    // DPR limitado dinamicamente para garantir 60 FPS estáveis sem gargalo de GPU
    setDpr(Math.min(window.devicePixelRatio || 1, 1.5));
  }, []);

  if (!hasWebGL) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#05070B] cad-grid-pattern opacity-60"
        aria-hidden="true"
      >
        <svg className="w-full h-full stroke-[#1E273A] stroke-1" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50%" cy="40%" r="220" fill="none" strokeDasharray="4 8" className="animate-spin-slow" />
          <circle cx="50%" cy="40%" r="380" fill="none" strokeDasharray="2 12" />
          <line x1="10%" y1="40%" x2="90%" y2="40%" strokeOpacity="0.3" />
          <line x1="50%" y1="10%" x2="50%" y2="80%" strokeOpacity="0.3" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 1.2, 7.5], fov: 42 }}
        dpr={dpr}
        frameloop="always"
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          alpha: true,
          stencil: false,
          depth: true,
        }}
        className="w-full h-full pointer-events-none"
      >
        <Suspense fallback={null}>
          <HeroExperience />
        </Suspense>
      </Canvas>
    </div>
  );
}
