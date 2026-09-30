'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronRight,
  Layers,
  Terminal,
  Activity,
  Cpu,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const STORY_STAGES = [
  {
    step: 1,
    badge: 'SPEC // STAGE 01: SCHEMATIC SPECIFICATION',
    title: 'Your architecture starts here.',
    description:
      'A flat, two-dimensional UML diagram or text description. Components exist merely as abstract shapes and lines on a 2D surface.',
    code: `[Client] -> [Web Server] -> [PostgreSQL DB]`,
    metric: 'AST PARSED: 100% NOMINAL',
  },
  {
    step: 2,
    badge: 'SPEC // STAGE 02: SPATIAL DECONSTRUCTION',
    title: 'The diagram begins to deconstruct.',
    description:
      'Rigid 2D lines detach from the flat blueprint surface, converting into dynamic 3D spline curves. Components begin elevating into 3D space.',
    code: `Z-Index Extrusion: +120px\nSpline Tension: 0.85\nDegrees of Freedom: 6DOF`,
    metric: 'TOPOLOGY DRIFT: 0.00ms',
  },
  {
    step: 3,
    badge: 'SPEC // STAGE 03: VOLUMETRIC EXTRUSION',
    title: 'Components gain physical volume.',
    description:
      'Abstract bounding boxes transform into volumetric isometric solids with real mass, chamfers, and spatial coordinates.',
    code: `MeshGeometry: BoxGeometry(w, h, d)\nVolume: Extruded Depth\nPhysics Bounds: Active`,
    metric: 'RAYCASTER: CALIBRATED',
  },
  {
    step: 4,
    badge: 'SPEC // STAGE 04: SEMANTIC RECOGNITION',
    title: 'Physical semantic morphing.',
    description:
      '"Server" becomes a real server rack with drive bays and blinking LEDs. "Database" becomes a tiered storage platter with flux rings. "Client" becomes a modern workstation laptop.',
    code: `Type(Server) -> ServerRackModel\nType(Database) -> DatabaseModel\nType(Client) -> WorkstationModel`,
    metric: 'SEMANTIC MESHES: ACTIVE',
  },
  {
    step: 5,
    badge: 'SPEC // STAGE 05: TOPOLOGICAL COGNITION',
    title: 'The complete system comes alive.',
    description:
      'The camera recedes to reveal the interconnected architecture. Live data flow particles surge across channels, communicating real telemetry and dependencies.',
    code: `TrafficRate: 4,200 pkt/s\nLatency: 8ms\nHealth: 100% Nominal`,
    metric: 'DATA CONDUITS: 120,000 PTS/S',
  },
  {
    step: 6,
    badge: 'SPEC // STAGE 06: SPATIAL INTELLIGENCE',
    title: 'YOUR ARCHITECTURE IS NOW 3D.',
    description:
      'Explore, inspect, simulate stress tests, and communicate engineering architectures with unparalleled clarity.',
    code: `Ready to explore your own system architectures in 3D.`,
    metric: 'RUNTIME: 60 FPS WEBGL 2.0',
  },
];

export function ScrollStorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerInstanceRef = useRef<ScrollTrigger | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // GSAP ScrollTrigger Integration para controlar as fases com base no scroll
  useGSAP(
    () => {
      if (!containerRef.current) return;

      const trigger = ScrollTrigger.create({
        id: 'scroll-story-trigger',
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: prefersReducedMotion ? false : 0.5,
        onUpdate: (self) => {
          const progress = self.progress;
          const stepIdx = Math.min(6, Math.max(1, Math.floor(progress * 6) + 1));
          setCurrentStep((prev) => (prev !== stepIdx ? stepIdx : prev));
        },
      });

      triggerInstanceRef.current = trigger;

      return () => {
        trigger.kill();
        triggerInstanceRef.current = null;
      };
    },
    { dependencies: [prefersReducedMotion], scope: containerRef }
  );

  const scrollToStage = (stageStep: number) => {
    const trigger = triggerInstanceRef.current;
    if (trigger) {
      const stageProgress = (stageStep - 1) / 5;
      const targetScrollY = trigger.start + stageProgress * (trigger.end - trigger.start);
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth',
      });
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const containerTop = window.scrollY + rect.top;
      const scrollableDistance = rect.height - window.innerHeight;
      const stageProgress = (stageStep - 1) / 5;
      const targetScrollY = containerTop + stageProgress * scrollableDistance;
      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth',
      });
    }
  };

  const currentStage = STORY_STAGES[currentStep - 1] || STORY_STAGES[0];

  return (
    <section
      ref={containerRef}
      className="relative min-h-[360vh] bg-transparent text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200 transition-colors duration-200"
    >
      {/* Sticky Viewport flutuando sobre o WebGL 3D (Sem Fundo Fosco) */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-between px-6 sm:px-12 lg:px-20 pointer-events-none overflow-hidden">
        {/* Lado Esquerdo: Área livre onde o 3D WebGL (câmera aproximando-se do rack e platters) é contemplado */}
        <div className="hidden lg:block lg:w-1/2 pointer-events-none" />

        {/* Lado Direito: Componente que descreve as fases dos diagramas (Completamente adaptativo a claro e escuro) */}
        <div className="w-full lg:w-1/2 max-w-xl mx-auto lg:mx-0 pointer-events-auto z-10">
          <div className="p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-cyan-500/20 bg-white/95 dark:bg-[#05070B]/85 shadow-[0_10px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-5 transition-colors duration-200">
            {/* Cabeçalho da Fase */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1E273A] font-mono text-xs">
              <span className="text-cyan-600 dark:text-cyan-400 font-bold tracking-wider uppercase text-[11px]">
                {currentStage.badge}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                PHASE 0{currentStep} / 06
              </span>
            </div>

            {/* Título da Fase */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
              {currentStage.title}
            </h2>

            {/* Descrição da Fase */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {currentStage.description}
            </p>

            {/* Bloco de Código / Especificação AST */}
            <div className="rounded border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#07080B] p-3.5 text-xs text-slate-700 dark:text-slate-200 font-mono shadow-inner transition-colors duration-200">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-1.5 mb-2 border-b border-slate-200 dark:border-[#1E273A] flex items-center justify-between font-bold">
                <span>SYNTACTIC SPECIFICATION</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  {currentStage.metric}
                </span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed text-cyan-800 dark:text-cyan-300 font-semibold dark:font-normal">
                {currentStage.code}
              </pre>
            </div>

            {/* Barra de Progresso e Controle de Fases (Stepper) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-[#1E273A]">
              {/* Botões das 6 Fases */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((st) => (
                  <button
                    key={st}
                    onClick={() => scrollToStage(st)}
                    className={`h-7 w-8 rounded font-mono text-[11px] font-bold transition-all ${
                      currentStep === st
                        ? 'bg-cyan-500 dark:bg-cyan-400 text-white dark:text-slate-950 shadow-[0_0_12px_rgba(0,240,255,0.35)] scale-105'
                        : 'border border-slate-200 dark:border-[#1E273A] bg-slate-100 dark:bg-[#0B0E14] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-cyan-500/40'
                    }`}
                    aria-label={`Pular para fase ${st}`}
                  >
                    0{st}
                  </button>
                ))}
              </div>

              {/* Botão de Avanço Dinâmico ou CTA Studio */}
              <div>
                {currentStep === 6 ? (
                  <Link
                    href="/studio"
                    className="inline-flex items-center justify-center gap-2 rounded bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Launch Studio</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => scrollToStage(Math.min(6, currentStep + 1))}
                    className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors group"
                  >
                    <span>Advance Phase</span>
                    <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
