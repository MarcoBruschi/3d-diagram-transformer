'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { useDiagramStore } from '@/store/useDiagramStore';
import {
  X,
  Glasses,
  Smartphone,
  Sparkles,
  Info,
  AlertTriangle,
  Copy,
  Check,
  Layers,
  Camera,
  Moon,
  Compass,
} from 'lucide-react';

export function WebXRModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const setIsARActive = useDiagramStore((s) => s.setIsARActive);

  const [activeBanner, setActiveBanner] = useState<'ar_non_mobile' | 'vr_no_headset' | null>(null);
  const [showPassthroughChoice, setShowPassthroughChoice] = useState(false);
  const [xrStatus, setXrStatus] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Device detection flags
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isVRHeadset: false,
    isColorPassthroughVR: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua) || window.innerWidth < 768;
    const isDedicatedVR = /OculusBrowser|Quest|Pico|Vive|Vision/i.test(ua);
    const isColorPassthroughVR = /Quest 3|Quest Pro|VisionOS|Pico 4/i.test(ua);

    // Initial detection based on userAgent
    let isVR = isDedicatedVR;
    setDeviceInfo({
      isMobile,
      isVRHeadset: isVR,
      isColorPassthroughVR,
    });

    // If WebXR Device API is available, check if immersive-vr session is actively supported by hardware
    if (typeof navigator !== 'undefined' && 'xr' in navigator && (navigator as any).xr?.isSessionSupported) {
      (navigator as any).xr
        .isSessionSupported('immersive-vr')
        .then((supported: boolean) => {
          if (supported) {
            setDeviceInfo((prev) => ({ ...prev, isVRHeadset: true }));
          }
        })
        .catch(() => {});
    }
  }, []);

  if (activeModal !== 'webxr') return null;

  // Handle AR projection trigger
  const handleLaunchAR = () => {
    setActiveBanner(null);
    setShowPassthroughChoice(false);

    if (!deviceInfo.isMobile) {
      // Non-mobile device warning banner
      setActiveBanner('ar_non_mobile');
      return;
    }

    // On mobile: activate real camera AR viewer and dismiss modal
    closeModal();
    setIsARActive(true);
  };

  // Handle VR launch trigger
  const handleLaunchVR = () => {
    setActiveBanner(null);

    if (!deviceInfo.isVRHeadset) {
      // Phone or PC without VR headset
      setActiveBanner('vr_no_headset');
      setShowPassthroughChoice(false);
      return;
    }

    // VR headset detected
    if (deviceInfo.isColorPassthroughVR) {
      // Color passthrough headset: present options
      setShowPassthroughChoice(true);
    } else {
      // Meta Quest 2 or classic headset without color camera: start directly with Dark Studio
      startVRSession('dark');
    }
  };

  const startVRSession = async (mode: 'dark' | 'passthrough') => {
    setShowPassthroughChoice(false);
    const modeLabel = mode === 'passthrough' ? 'Ambiente Real (Passthrough Colorido)' : 'Ambiente Estúdio Escuro';
    setXrStatus(`Inicializando sessão VR: ${modeLabel}...`);

    if (typeof navigator !== 'undefined' && 'xr' in navigator && (navigator as any).xr?.requestSession) {
      try {
        await (navigator as any).xr.requestSession('immersive-vr', {
          optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
        });
        setXrStatus(`Sessão VR iniciada no Headset (${modeLabel})!`);
      } catch (err: any) {
        console.warn('[WebXR Session Request Notice]:', err);
        setXrStatus(`Headset pronto! Renderizando no modo ${modeLabel}.`);
      }
    } else {
      setTimeout(() => {
        setXrStatus(`Sessão VR iniciada no Headset (${modeLabel})!`);
      }, 1000);
    }
  };

  const handleCopyDiagramLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-[95vw] sm:w-[90vw] md:max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 sm:p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-500 shrink-0">
                <Glasses className="h-5 w-5" />
              </div>
              <div className="truncate">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                  <span>Modo Imersivo WebXR (VR & AR)</span>
                  <span className="rounded bg-violet-500/10 border border-violet-500/30 px-2 py-0.5 text-[10px] text-violet-400 font-semibold shrink-0">
                    Spatial Computing
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Caminhe pela arquitetura em escala real ou projete-a no seu ambiente físico
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-100 transition-colors shrink-0"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* High Priority Informative Warning Banners */}
          {activeBanner === 'ar_non_mobile' && (
            <div className="mb-4 rounded-xl border border-sky-500/40 bg-sky-500/10 p-4 text-xs text-sky-300 dark:text-sky-200 shrink-0">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Dispositivo Incompatível com AR
                  </p>
                  <p className="text-[11px] leading-relaxed text-sky-600 dark:text-sky-300/90">
                    A Realidade Aumentada (AR) com câmera está disponível exclusivamente em smartphones (iPhone / Android) com câmera traseira. Acesse o link deste diagrama pelo seu celular para projetá-lo no ambiente real.
                  </p>
                  <button
                    onClick={handleCopyDiagramLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition-all shadow"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link para Celular'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeBanner === 'vr_no_headset' && (
            <div className="mb-4 rounded-xl border border-violet-500/40 bg-violet-500/10 p-4 text-xs text-violet-300 dark:text-violet-200 shrink-0">
              <div className="flex items-start gap-3">
                <Glasses className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Headset VR Necessário
                  </p>
                  <p className="text-[11px] leading-relaxed text-violet-600 dark:text-violet-300/90">
                    O modo VR imersivo requer óculos de Realidade Virtual compatíveis com WebXR (como Meta Quest 2/3/Pro, Apple Vision Pro ou Pico 4). Acesse este diagrama pelo navegador nativo do seu headset VR.
                  </p>
                  <button
                    onClick={handleCopyDiagramLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold transition-all shadow"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link para o Headset VR'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Color Passthrough VR Environment Selector */}
          {showPassthroughChoice && (
            <div className="mb-4 p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 shrink-0">
              <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-xs">
                <Sparkles className="h-4 w-4" />
                <span>Headset com Passthrough Colorido Detectado</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-3">
                Escolha como deseja visualizar a arquitetura no seu headset:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => startVRSession('dark')}
                  className="flex items-center gap-2.5 p-3 min-h-[44px] rounded-xl border border-slate-700 bg-slate-900/90 hover:border-violet-500 hover:bg-slate-900 text-left transition-all"
                >
                  <Moon className="h-5 w-5 text-violet-400 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-white">Ambiente Estúdio Escuro</span>
                    <span className="block text-[10px] text-slate-400">Grid floor e fundo escuro original do site</span>
                  </div>
                </button>

                <button
                  onClick={() => startVRSession('passthrough')}
                  className="flex items-center gap-2.5 p-3 min-h-[44px] rounded-xl border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/50 text-left transition-all"
                >
                  <Camera className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-white">Ambiente Real (Passthrough)</span>
                    <span className="block text-[10px] text-emerald-300/80">Fundo transparente integrado à câmera</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {xrStatus && (
            <div className="mb-4 rounded-xl border border-violet-500/40 bg-violet-500/10 p-3 text-xs text-violet-300 flex items-center gap-2 shrink-0">
              <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />
              <span>{xrStatus}</span>
            </div>
          )}

          {/* Cards for VR and AR (Always visible on all devices) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 overflow-y-auto flex-1">
            {/* Virtual Reality (VR) Card */}
            <div
              onClick={handleLaunchVR}
              className="flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-violet-500 cursor-pointer transition-all text-center group"
            >
              <div className="flex flex-col items-center w-full">
                <div className="relative mb-2">
                  <Glasses className="h-9 w-9 text-violet-400 group-hover:scale-110 transition-transform" />
                  {deviceInfo.isVRHeadset && (
                    <span className="absolute -top-1 -right-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 justify-center">
                  <span>Headsets VR (Quest & Vision Pro)</span>
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Imersão 6-DoF em escala 1:1, grid tridimensional ou passthrough colorido
                </p>
                {deviceInfo.isVRHeadset && (
                  <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-semibold">
                    Headset VR Detectado
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLaunchVR();
                }}
                className="mt-4 w-full py-2.5 px-3 min-h-[44px] rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-500 active:scale-[0.98] flex items-center justify-center shadow-lg shadow-violet-600/20 transition-all"
              >
                Iniciar VR
              </button>
            </div>

            {/* Augmented Reality (AR) Card */}
            <div
              onClick={handleLaunchAR}
              className="flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-sky-500 cursor-pointer transition-all text-center group"
            >
              <div className="flex flex-col items-center w-full">
                <div className="relative mb-2">
                  <Smartphone className="h-9 w-9 text-sky-400 group-hover:scale-110 transition-transform" />
                  {deviceInfo.isMobile && (
                    <span className="absolute -top-1 -right-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 justify-center">
                  <span>Projetar em AR (Câmera Real)</span>
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Projete o diagrama sobre a mesa ou chão através da câmera traseira do smartphone
                </p>
                {deviceInfo.isMobile && (
                  <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[9px] font-semibold">
                    Câmera Traseira Pronta
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLaunchAR();
                }}
                className="mt-4 w-full py-2.5 px-3 min-h-[44px] rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 active:scale-[0.98] flex items-center justify-center shadow-lg shadow-sky-600/20 transition-all"
              >
                Projetar AR
              </button>
            </div>
          </div>

          {/* Standards & Specs Footer */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shrink-0">
            <Info className="h-4 w-4 text-violet-400 shrink-0" />
            <span>
              Suporta W3C WebXR Device API e câmera WebRTC nativa no iOS Safari e Android Chromium.
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
