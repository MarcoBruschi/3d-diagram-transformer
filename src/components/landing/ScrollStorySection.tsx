'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Layers,
  Terminal,
  Activity,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface StageData {
  step: number;
  badge: string;
  phaseId: string;
  title: string;
  description: string;
  code: string;
  metric: string;
  gpuBudget: string;
  telemetryPass: string;
}

const STORY_STAGES: StageData[] = [
  {
    step: 1,
    badge: 'STAGE 01 // SCHEMATIC SPECIFICATION',
    phaseId: 'AST_INGEST',
    title: 'Your architecture starts here.',
    description:
      'A flat, two-dimensional UML diagram or text description. Components exist merely as abstract shapes and lines on a 2D surface.',
    code: `[Client] -> [Web Server] -> [PostgreSQL DB]`,
    metric: 'AST PARSED: 100% NOMINAL',
    gpuBudget: '0 DRAW CALLS (CPU ONLY)',
    telemetryPass: 'LEXICAL_TOKEN_TREE',
  },
  {
    step: 2,
    badge: 'STAGE 02 // SPATIAL DECONSTRUCTION',
    phaseId: 'KINEMATIC_SPLIT',
    title: 'The diagram begins to deconstruct.',
    description:
      'Rigid 2D lines detach from the flat blueprint surface, converting into dynamic 3D spline curves. Components begin elevating into 3D space.',
    code: `Z-Index Extrusion: +120px\nSpline Tension: 0.85\nDegrees of Freedom: 6DOF`,
    metric: 'TOPOLOGY DRIFT: 0.00ms',
    gpuBudget: '6 DRAW CALLS // 12 MESHES',
    telemetryPass: 'FORCE_DIRECTED_RELAX',
  },
  {
    step: 3,
    badge: 'STAGE 03 // VOLUMETRIC EXTRUSION',
    phaseId: 'SOLID_SYNTHESIS',
    title: 'Components gain physical volume.',
    description:
      'Abstract bounding boxes transform into volumetric isometric solids with real mass, chamfers, and spatial coordinates.',
    code: `MeshGeometry: BoxGeometry(w, h, d)\nVolume: Extruded Depth\nPhysics Bounds: Active`,
    metric: 'RAYCASTER: CALIBRATED',
    gpuBudget: '18 DRAW CALLS (INSTANCED)',
    telemetryPass: 'SURFACE_TESSELLATION',
  },
  {
    step: 4,
    badge: 'STAGE 04 // SEMANTIC RECOGNITION',
    phaseId: 'MODEL_MAPPING',
    title: 'Physical semantic morphing.',
    description:
      '"Server" becomes a real server rack with drive bays and blinking LEDs. "Database" becomes a tiered storage platter with flux rings. "Client" becomes a modern workstation laptop.',
    code: `Type(Server)   -> ServerRackModel\nType(Database) -> DatabaseModel\nType(Client)   -> WorkstationModel`,
    metric: 'SEMANTIC MESHES: ACTIVE',
    gpuBudget: '32 DRAW CALLS (PBR_LOD0)',
    telemetryPass: 'PBR_STANDARD_MATERIAL',
  },
  {
    step: 5,
    badge: 'STAGE 05 // TOPOLOGICAL COGNITION',
    phaseId: 'DATA_STREAMING',
    title: 'The complete system comes alive.',
    description:
      'The camera recedes to reveal the interconnected architecture. Live data flow particles surge across channels, communicating real telemetry and dependencies.',
    code: `TrafficRate: 4,200 pkt/s\nLatency: 8ms\nHealth: 100% Nominal`,
    metric: 'CONDUITS: 120,000 PTS/S',
    gpuBudget: '48 DRAW CALLS // 60 FPS',
    telemetryPass: 'BEZIER_PARTICLE_FLUX',
  },
  {
    step: 6,
    badge: 'STAGE 06 // SPATIAL INTELLIGENCE',
    phaseId: 'RUNTIME_TWIN',
    title: 'YOUR ARCHITECTURE IS NOW 3D.',
    description:
      'Explore, inspect, simulate stress tests, and communicate engineering architectures with unparalleled clarity.',
    code: `Ready to explore your own system architectures in 3D.`,
    metric: 'RUNTIME: 60 FPS WEBGL 2.0',
    gpuBudget: '100% HARDWARE ACCELERATED',
    telemetryPass: 'INTERACTIVE_CAD_VIEWPORT',
  },
];

export function ScrollStorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerInstanceRef = useRef<ScrollTrigger | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // GSAP ScrollTrigger Integration
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
          setScrollProgress(progress);
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
      className="relative min-h-[380vh] bg-transparent text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200 transition-colors duration-200"
    >
      {/* Sticky Viewport flutuando sobre o WebGL 3D */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-between px-6 sm:px-12 lg:px-20 pointer-events-none overflow-hidden">
        {/* Lado Esquerdo: Área livre onde o 3D WebGL (câmera aproximando-se do rack e platters) é contemplado */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between h-[80vh] pointer-events-none select-none py-6">
          {/* Spatial CAD Crosshair & HUD Overlay */}
          <div className="space-y-1.5 font-mono text-[10px] text-slate-400 dark:text-[#2A374F]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>SPATIAL_CALIBRATION // STAGE_0{currentStep}_OF_06</span>
            </div>
            <div className="text-slate-400/80 dark:text-slate-600">
              PROJECTION // PERSPECTIVE_42° [FOV: 42.0]
            </div>
          </div>

          {/* Bottom Left WebGL Telemetry Pill */}
          <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-[#1E273A]/80 bg-white/60 dark:bg-[#07080B]/60 backdrop-blur-xs font-mono text-[10px] text-slate-600 dark:text-slate-400 w-fit">
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">{currentStage.phaseId}</span>
            <span>•</span>
            <span>{currentStage.gpuBudget}</span>
          </div>
        </div>

        {/* Lado Direito: Engineering Cockpit Console */}
        <div className="w-full lg:w-1/2 max-w-xl mx-auto lg:mx-0 pointer-events-auto z-10">
          <div className="rounded-2xl border border-slate-200/90 dark:border-[#1E273A] bg-white/95 dark:bg-[#07090E]/90 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_0_60px_rgba(0,0,0,0.85)] p-6 sm:p-8 space-y-6 transition-colors duration-200 relative overflow-hidden">
            {/* Top Micro-HUD Bar */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-[#1E273A] font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-xs bg-cyan-500 shadow-[0_0_8px_#00F0FF]" />
                <span className="text-cyan-700 dark:text-cyan-400 font-bold tracking-wider text-[11px] uppercase">
                  {currentStage.badge}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                <span>SCRUB</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {Math.round(scrollProgress * 100)}%
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                <span>PHASE 0{currentStep} // 06</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
                  {currentStage.telemetryPass}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-[#121824] rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${(currentStep / 6) * 100}%` }}
                />
              </div>
            </div>

            {/* Título Monumental da Fase */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase transition-all duration-200">
                {currentStage.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {currentStage.description}
              </p>
            </div>

            {/* Syntactic AST Spec Terminal Box */}
            <div className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50/90 dark:bg-[#040508] p-4 text-xs font-mono shadow-inner transition-colors duration-200">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 pb-2 mb-2.5 border-b border-slate-200 dark:border-[#1E273A] flex items-center justify-between font-bold">
                <div className="flex items-center gap-1.5">
                  <Terminal className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                  <span>SYNTACTIC SPECIFICATION</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  {currentStage.metric}
                </span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-cyan-300 font-mono text-[11px] selection:bg-cyan-500/30">
                {currentStage.code}
              </pre>
            </div>

            {/* Quick-Access Stage Navigator & Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-[#1E273A]">
              {/* Stepper Buttons 01 to 06 */}
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Navegador de fases">
                {[1, 2, 3, 4, 5, 6].map((st) => {
                  const isActive = currentStep === st;
                  const isDone = currentStep > st;
                  return (
                    <button
                      key={st}
                      onClick={() => scrollToStage(st)}
                      role="tab"
                      aria-selected={isActive}
                      className={`h-8 w-8 rounded-lg font-mono text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500 dark:bg-cyan-400 text-white dark:text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-105'
                          : isDone
                          ? 'border border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 hover:border-cyan-400'
                          : 'border border-slate-200 dark:border-[#1E273A] bg-slate-100 dark:bg-[#0B0E14] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-cyan-500/40'
                      }`}
                      aria-label={`Ir para estágio 0${st}`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <span>0{st}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next / Launch Buttons */}
              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <button
                    onClick={() => scrollToStage(currentStep - 1)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-[#1E273A] text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#121824] transition-colors cursor-pointer"
                    aria-label="Fase anterior"
                    title="Fase anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}

                {currentStep === 6 ? (
                  <Link
                    href="/studio"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Launch Studio</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => scrollToStage(currentStep + 1)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#121824] hover:bg-slate-200 dark:hover:bg-[#1A2334] font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400 transition-colors group cursor-pointer"
                  >
                    <span>Next Phase</span>
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
