'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Layers, ArrowRight, UploadCloud } from 'lucide-react';
import { MagneticButton } from '@/components/animations/MagneticButton';
import { SplitTextReveal } from '@/components/animations/SplitTextReveal';

const ECOSYSTEM_ITEMS = [
  'KUBERNETES v1.31',
  'AWS CLOUD TOPOLOGY',
  'APACHE KAFKA CONDUITS',
  'DOCKER COMPOSE',
  'HASHICORP TERRAFORM',
  'WEBGL 2.0 SHADERS',
  'PLANTUML AST',
  'MERMAID.JS SPEC',
  'OPENTELEMETRY TRACES',
  'POSTGRESQL CLUSTERS',
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
      className="relative min-h-[96vh] pt-32 pb-16 flex flex-col justify-between px-6 lg:px-16 overflow-hidden pointer-events-auto outline-none"
    >
      {/* Cruzes de Calibração nos 4 Vértices CAD */}
      <div className="absolute top-20 left-6 font-mono text-sm text-slate-400 dark:text-[#1E273A] select-none pointer-events-none">
        +
      </div>
      <div className="absolute top-20 right-6 font-mono text-sm text-slate-400 dark:text-[#1E273A] select-none pointer-events-none">
        +
      </div>
      <div className="absolute bottom-6 left-6 font-mono text-sm text-slate-400 dark:text-[#1E273A] select-none pointer-events-none">
        +
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-sm text-slate-400 dark:text-[#1E273A] select-none pointer-events-none">
        +
      </div>

      {/* Container Central com Conteúdo Flutuando Diretamente sobre o Espaço 3D (Sem Fundos Foscos) */}
      <div className="mx-auto max-w-7xl w-full my-auto py-12 relative z-10">
        <div className="max-w-3xl space-y-8">
          {/* Tipografia Monumental com Máscara e Cores Nítidas em Ambos os Modos */}
          <div className="space-y-1">
            <SplitTextReveal
              delay={0.1}
              duration={1.0}
              className="font-black tracking-[-0.04em] leading-[0.92] text-slate-900 dark:text-white uppercase text-[clamp(2.75rem,7.2vw,6.5rem)] select-none"
            >
              <div>FROM FLAT SCHEMATICS</div>
              <div className="text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_35px_rgba(0,240,255,0.35)]">
                INTO LIVING 3D TWINS.
              </div>
            </SplitTextReveal>
          </div>

          {/* Parágrafo de Posicionamento Técnico com Alto Contraste */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-normal select-none">
            Upload technical flowcharts, PlantUML specs, or cloud diagrams. Eliminate cognitive fatigue
            and debug complex distributed topologies with interactive physical 3D twins.
          </p>

          {/* Grupo de Ações Primárias com Botões Magnéticos Adaptativos */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <MagneticButton
              onClick={() => router.push('/studio')}
              className="flex items-center justify-center gap-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 px-7 py-4 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all active:scale-98"
            >
              <Layers className="h-4 w-4" />
              <span>Launch Spatial Studio</span>
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>

            <MagneticButton
              onClick={onUploadClick}
              className="flex items-center justify-center gap-2.5 rounded-lg border border-slate-300 dark:border-cyan-400/40 text-slate-800 dark:text-cyan-300 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-white bg-white/80 dark:bg-transparent hover:bg-slate-50 dark:hover:bg-cyan-950/30 px-7 py-4 font-mono text-xs font-semibold transition-all active:scale-98 shadow-xs"
            >
              <UploadCloud className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span>Upload Blueprint</span>
            </MagneticButton>
          </div>

          {/* Strip de Telemetria de Engenharia Minimalista Flutuante */}
          <div className="pt-8 border-t border-slate-200 dark:border-cyan-500/20 font-mono text-xs grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl">
            <div className="space-y-0.5">
              <div className="text-lg font-bold text-slate-900 dark:text-white">12+</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Semantic Meshes
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">60 FPS</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                WebGL 2.0 Engine
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">1:1</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                2D / 3D Sync Parity
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-lg font-bold text-slate-900 dark:text-white">0.08 LERP</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Inertial Kinematics
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continuous Ecosystem Marquee Ticker */}
      <div className="mx-auto max-w-7xl w-full pt-6 border-t border-slate-200 dark:border-slate-800/60 overflow-hidden relative select-none">
        <div className="flex items-center gap-8 whitespace-nowrap animate-[marquee_35s_linear_infinite] font-mono text-xs text-slate-600 dark:text-slate-400">
          {ECOSYSTEM_ITEMS.concat(ECOSYSTEM_ITEMS).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
