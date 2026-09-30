'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { ScrollStorySection } from '@/components/landing/ScrollStorySection';
import { SpecMatrix } from '@/components/landing/SpecMatrix';
import { UploadModal } from '@/components/upload/UploadModal';
import { SmoothScrollProvider } from '@/components/animations/SmoothScrollProvider';
import { MagneticButton } from '@/components/animations/MagneticButton';
import { CanvasRoot } from '@/components/webgl/CanvasRoot';
import { CookiePreferencesTrigger } from '@/components/compliance/CookiePreferencesTrigger';
import {
  Terminal,
  Layers,
  ArrowRight,
  Shield,
  FileText,
  Cookie,
  CreditCard,
  Mail,
  ExternalLink,
  Box,
} from 'lucide-react';

export default function LandingPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const router = useRouter();

  return (
    <SmoothScrollProvider>
      <div className="relative min-h-screen w-full bg-[#FAFAFA] dark:bg-[#05070B] text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200 transition-colors duration-200">
        {/* Cenografia Espacial WebGL Full-Bleed Contínua por Todo o Scroll */}
        <CanvasRoot />

        {/* Top Navbar com Identidade PRISM */}
        <LandingNavbar />

        {/* HERO SECTION MONUMENTAL (Livre de Fundos Foscos, Tipografia com mix-blend-difference) */}
        <HeroSection onUploadClick={() => setShowUploadModal(true)} />

        {/* 6-STAGE GSAP SCROLL STORYTELLING */}
        <ScrollStorySection />

        {/* TECHNICAL SPECIFICATION MATRIX COM CONSOLE HUD INTERATIVO */}
        <SpecMatrix />

        {/* FINAL CALL TO ACTION // CAD MONOLITH (Sem Fundos Foscos, Geometrias 3D Visíveis) */}
        <section className="relative border-t border-slate-200 dark:border-[#1E273A] bg-white/40 dark:bg-[#05070B]/50 py-28 px-6 text-center transition-colors duration-200 overflow-hidden">
          <div className="absolute top-8 left-8 font-mono text-xs text-slate-300 dark:text-[#1E273A] select-none">
            +
          </div>
          <div className="absolute top-8 right-8 font-mono text-xs text-slate-300 dark:text-[#1E273A] select-none">
            +
          </div>

          <div className="mx-auto max-w-3xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 rounded border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14] px-3.5 py-1.5 font-mono text-xs text-cyan-700 dark:text-cyan-400">
              <Terminal className="h-3.5 w-3.5" />
              <span>ARCHITECTURE TRANSFORMATION RUNTIME</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-[1.05]">
              STOP EXPLAINING TOPOLOGY WITH FLAT BOXES.
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              Communicate infrastructure dependencies with absolute clarity. Generate physical spatial models
              that engineering leads and cloud architects can inspect simultaneously.
            </p>

            <div className="pt-4 flex justify-center">
              <MagneticButton
                onClick={() => router.push('/studio')}
                className="inline-flex items-center gap-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 px-8 py-4 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,240,255,0.25)] active:scale-98"
              >
                <Layers className="h-4 w-4" />
                <span>Launch Studio & Ingest Diagram</span>
                <ArrowRight className="h-4 w-4" />
              </MagneticButton>
            </div>
          </div>
        </section>

        {/* CAD Engineering Footer com Informações Corporativas e Links Legais Clicáveis com Ícones */}
        <footer className="relative z-30 pointer-events-auto border-t border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#05070B] py-12 px-6 font-mono text-xs text-slate-600 dark:text-slate-400 transition-colors duration-200">
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-200 dark:border-[#1E273A] pb-6">
              <div className="space-y-1.5">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-slate-900 dark:text-white font-bold hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  <Box className="h-4 w-4 text-cyan-500" aria-hidden="true" />
                  <span className="tracking-wider uppercase">PRISM Technologies Inc.</span>
                </Link>
                <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                  <span>Enterprise Cloud Architecture Spatial Twins</span>
                  <span>•</span>
                  <span>Suporte & Jurídico:</span>
                  <a
                    href="mailto:legal@prism.app"
                    className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
                  >
                    <Mail className="h-3 w-3" aria-hidden="true" />
                    <span>legal@prism.app</span>
                  </a>
                </p>
              </div>

              {/* Botões/Ícones das Páginas Legais (100% Clicáveis e Acessíveis) */}
              <nav aria-label="Navegação de Políticas Legais" className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px]">
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14] text-slate-700 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-500/10 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
                  title="Abrir Política de Privacidade"
                >
                  <Shield className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                  <span>Privacidade</span>
                </Link>

                <Link
                  href="/terms"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14] text-slate-700 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-500/10 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
                  title="Abrir Termos de Uso e Serviço"
                >
                  <FileText className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                  <span>Termos de Uso</span>
                </Link>

                <Link
                  href="/cookies"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14] text-slate-700 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-500/10 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
                  title="Abrir Política de Cookies e Armazenamento"
                >
                  <Cookie className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                  <span>Cookies</span>
                </Link>

                <Link
                  href="/refund"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14] text-slate-700 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-500/10 transition-all cursor-pointer shadow-2xs focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
                  title="Abrir Política de Reembolso e Cancelamento"
                >
                  <CreditCard className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                  <span>Reembolso</span>
                </Link>

                <div className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14] hover:border-cyan-500/60 transition-colors shadow-2xs">
                  <CookiePreferencesTrigger variant="link" />
                </div>
              </nav>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 dark:text-slate-400">
              <div>
                © {new Date().getFullYear()} PRISM Technologies Inc. Todos os direitos reservados.
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://www.khronos.org/webgl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>WebGL 2.0</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-60" aria-hidden="true" />
                </a>
                <span className="text-slate-300 dark:text-[#1E273A]">•</span>
                <a
                  href="https://lenis.darkroom.engineering/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Lenis Inertial</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-60" aria-hidden="true" />
                </a>
                <span className="text-slate-300 dark:text-[#1E273A]">•</span>
                <a
                  href="https://gsap.com/docs/v3/Plugins/ScrollTrigger/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>GSAP ScrollTrigger</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-60" aria-hidden="true" />
                </a>
                <span className="text-slate-300 dark:text-[#1E273A]">•</span>
                <a
                  href="https://nextjs.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Next.js 15</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-60" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* Modal de Upload de Blueprint */}
        <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />
      </div>
    </SmoothScrollProvider>
  );
}
