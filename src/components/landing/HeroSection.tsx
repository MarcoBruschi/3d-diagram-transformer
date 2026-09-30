'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Layers, ArrowRight, UploadCloud } from 'lucide-react';
import { MagneticButton } from '@/components/animations/MagneticButton';
import { SplitTextReveal } from '@/components/animations/SplitTextReveal';

const COMPATIBILITY_PROTOCOLS = [
  { name: 'PlantUML AST', status: 'SYNTHESIS' },
  { name: 'Mermaid.js Engine', status: 'PARSED' },
  { name: 'AWS Topology JSON', status: 'MAPPED' },
  { name: 'Kubernetes v1.31', status: 'INGESTED' },
  { name: 'HashiCorp Terraform', status: 'DISPATCH' },
  { name: 'Docker Compose Spec', status: 'RESOLVED' },
  { name: 'WebGL 2.0 Kinematics', status: '60_FPS' },
];

interface HeroSectionProps {
  onUploadClick: () => void;
}

export function HeroSection({ onUploadClick }: HeroSectionProps) {
  const router = useRouter();

  return (
    <section
      id="main-content"
      tabIndex={-1}
      className="relative min-h-[96vh] pt-32 pb-14 flex flex-col justify-between px-6 lg:px-16 overflow-hidden pointer-events-auto outline-none"
    >
      {/* Precision CAD Calibration Callouts */}
      <div className="absolute top-20 left-8 font-mono text-[10px] text-slate-400 dark:text-[#2A374F] select-none pointer-events-none tracking-widest">
        SYS.LOC // [41°24'12.2"N 2°10'26.5"E]
      </div>
      <div className="absolute top-20 right-8 font-mono text-[10px] text-slate-400 dark:text-[#2A374F] select-none pointer-events-none tracking-widest">
        VIEWPORT // [6DOF_SPATIAL_SYNC]
      </div>

      {/* Center Monumental Content Flow */}
      <div className="mx-auto max-w-7xl w-full my-auto py-10 relative z-10">
        <div className="max-w-3xl space-y-8">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-[#1E273A] bg-white/90 dark:bg-[#0B0E17]/90 px-3.5 py-1.5 font-mono text-[11px] text-cyan-600 dark:text-cyan-400 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00F0FF]" />
            <span className="font-semibold tracking-wider uppercase">SPATIAL INFRASTRUCTURE RUNTIME</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-slate-500">v2.4 ACTIVE</span>
          </div>

          {/* Monumental Headline */}
          <div className="space-y-1">
            <SplitTextReveal
              delay={0.05}
              duration={0.9}
              className="font-black tracking-[-0.04em] leading-[0.92] text-slate-900 dark:text-white uppercase text-[clamp(2.85rem,7.4vw,6.6rem)] select-none"
            >
              <div>FROM FLAT SCHEMATICS</div>
              <div className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-sky-500 to-violet-600 dark:from-cyan-400 dark:via-sky-300 dark:to-violet-400 drop-shadow-[0_0_35px_rgba(0,240,255,0.3)]">
                INTO LIVING 3D TWINS.
              </div>
            </SplitTextReveal>
          </div>

          {/* High-Contrast Technical Positioning */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-normal select-none">
            Transform abstract architecture schematics into interactive 3D spatial twins with live telemetry,
            multi-tenant cursors, and physics-driven particle conduits. Eliminate diagram rot forever.
          </p>

          {/* Primary Action Group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <MagneticButton
              onClick={() => router.push('/studio')}
              className="flex items-center justify-center gap-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white dark:text-slate-950 px-8 py-4 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all active:scale-98"
            >
              <Layers className="h-4 w-4" />
              <span>Launch Spatial Studio</span>
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>

            <MagneticButton
              onClick={onUploadClick}
              className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-300 dark:border-[#1E273A] text-slate-700 dark:text-slate-200 hover:border-cyan-400/50 hover:text-cyan-600 dark:hover:text-cyan-400 bg-white/80 dark:bg-[#0B0E17]/80 px-7 py-4 font-mono text-xs font-semibold transition-all active:scale-98 shadow-xs"
            >
              <UploadCloud className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span>Upload Blueprint</span>
            </MagneticButton>
          </div>

          {/* Technical Telemetry Strip */}
          <div className="pt-8 border-t border-slate-200 dark:border-[#1E273A]/80 font-mono text-xs grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl">
            <div className="space-y-0.5">
              <div className="text-lg font-bold text-slate-900 dark:text-white">18+</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Semantic Meshes
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">60 FPS</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                WebGL 2.0 Engine
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">1:1</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Spatial Parity
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-bold text-slate-900 dark:text-white">0.08 LERP</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Inertial Damping
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive CAD Compatibility Docking Strip (Replaces Generic Marquee) */}
      <div className="mx-auto max-w-7xl w-full pt-6 border-t border-slate-200 dark:border-[#1E273A] select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-[11px]">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="uppercase tracking-wider font-semibold">SUPPORTED SCHEMATIC PROTOCOLS:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {COMPATIBILITY_PROTOCOLS.map((proto) => (
              <div
                key={proto.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1E273A] bg-white/70 dark:bg-[#0B0E17]/70 text-slate-700 dark:text-slate-300 font-mono text-[10px] transition-colors hover:border-cyan-400/40"
              >
                <span className="text-cyan-500 dark:text-cyan-400 font-bold">•</span>
                <span>{proto.name}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-[#161F30] text-slate-500 font-mono">
                  {proto.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
