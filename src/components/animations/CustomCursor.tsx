'use client';

import React, { useEffect, useRef, useState } from 'react';

type CursorMode = 'default' | 'pointer' | 'orbit';

export function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [visible, setVisible] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const targetPos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Desativação estrita em telas sensíveis ao toque (dispositivos touch)
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Detecta intenção sob o ponteiro
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorTarget = target.closest('[data-cursor]');
      if (cursorTarget) {
        const customType = cursorTarget.getAttribute('data-cursor');
        if (customType === 'orbit') {
          setMode('orbit');
          return;
        }
        if (customType === 'pointer') {
          setMode('pointer');
          return;
        }
      }

      const isInteractive = target.closest('button, a, input, select, textarea, [role="button"]');
      if (isInteractive) {
        setMode('pointer');
      } else {
        setMode('default');
      }
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleMouseEnter = () => {
      setVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Loop inercial amortecido (lerp = 0.15)
    const animate = () => {
      const lerpFactor = 0.15;
      ringPos.current.x += (targetPos.current.x - ringPos.current.x) * lerpFactor;
      ringPos.current.y += (targetPos.current.y - ringPos.current.y) * lerpFactor;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${targetPos.current.x}px, ${targetPos.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Mira técnica central fina (retículo preciso de alta definição) */}
      <div
        ref={dotRef}
        className="absolute top-0 left-0 -ml-[5px] -mt-[5px] h-[10px] w-[10px] flex items-center justify-center will-change-transform"
      >
        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
        {/* Retículo em cruz fina CAD */}
        <div className="absolute h-[14px] w-[1px] bg-cyan-400/40" />
        <div className="absolute h-[1px] w-[14px] bg-cyan-400/40" />
      </div>

      {/* Anel inercial amortecido (lerp = 0.15) */}
      <div
        ref={ringRef}
        className={`absolute top-0 left-0 -ml-5 -mt-5 h-10 w-10 rounded-full border will-change-transform transition-[width,height,margin,border-color,background-color] duration-200 flex items-center justify-center ${
          mode === 'orbit'
            ? 'h-14 w-14 -ml-7 -mt-7 border-cyan-400/80 bg-cyan-500/10 border-dashed animate-[spin_10s_linear_infinite]'
            : mode === 'pointer'
            ? 'h-12 w-12 -ml-6 -mt-6 border-sky-400/80 bg-sky-500/10'
            : 'border-cyan-400/40'
        }`}
      >
        {/* Ticks CAD nos 4 cantos do anel */}
        <div className="absolute -top-1 left-1/2 -ml-[1px] h-1 w-[2px] bg-cyan-400/60" />
        <div className="absolute -bottom-1 left-1/2 -ml-[1px] h-1 w-[2px] bg-cyan-400/60" />
        <div className="absolute -left-1 top-1/2 -mt-[1px] w-1 h-[2px] bg-cyan-400/60" />
        <div className="absolute -right-1 top-1/2 -mt-[1px] w-1 h-[2px] bg-cyan-400/60" />
      </div>
    </div>
  );
}
