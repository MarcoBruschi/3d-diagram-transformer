'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useCameraStore } from '@/store/useCameraStore';
import { useLayersStore } from '@/store/useLayersStore';
import { ViewMode, CameraPreset } from '@/types/diagram';
import Link from 'next/link';
import {
  Box,
  FileCode,
  Columns,
  Maximize2,
  Orbit,
  Layers,
  Video,
  Grid,
  RotateCcw,
  Check,
  Compass,
  Unlock,
  BookOpen,
  Radio,
  GitCompare,
  Code2,
  Glasses,
  FileCheck2,
  Lock,
  X,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import { useLiveMonitoringStore } from '@/store/useLiveMonitoringStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { useFeatureGating } from '@/hooks/useFeatureGating';

const LAYER_ITEMS = [
  { key: 'infrastructure', label: 'Infrastructure', desc: 'Servidores, clusters e instâncias' },
  { key: 'software', label: 'Software / Services', desc: 'Microsserviços, APIs e containers' },
  { key: 'database', label: 'Databases & SAN', desc: 'Bancos relacionais, NoSQL e storages' },
  { key: 'user', label: 'Clients & Users', desc: 'Usuários, browsers e clientes finais' },
  { key: 'network', label: 'Network & WAF', desc: 'Gateways, balanceadores e VPCs' },
  { key: 'particles', label: 'Data Flow Pulses', desc: 'Partículas de tráfego em tempo real' },
  { key: 'grid', label: 'CAD Floor Grid', desc: 'Grade tridimensional de solo' },
  { key: 'labels', label: '3D HUD Labels', desc: 'Badges de texto espacial dos nós' },
  { key: 'connections', label: 'Cables & Splines', desc: 'Tubos e cabos volumétricos 3D' },
] as const;

export function FloatingToolbar() {
  const viewMode = useDiagramStore((s) => s.viewMode);
  const setViewMode = useDiagramStore((s) => s.setViewMode);
  const filterStatus = useDiagramStore((s) => s.filterStatus);
  const setFilterStatus = useDiagramStore((s) => s.setFilterStatus);

  const cameraPreset = useCameraStore((s) => s.preset);
  const setCameraPreset = useCameraStore((s) => s.setCameraPreset);
  const resetCamera = useCameraStore((s) => s.resetCamera);
  const isCinematic = useCameraStore((s) => s.isCinematicActive);
  const toggleCinematic = useCameraStore((s) => s.toggleCinematic);
  const isFreeCamera = useCameraStore((s) => s.isFreeCamera);
  const toggleFreeCamera = useCameraStore((s) => s.toggleFreeCamera);

  const isMonitoringActive = useLiveMonitoringStore((s) => s.isMonitoringActive);
  const toggleMonitoring = useLiveMonitoringStore((s) => s.toggleMonitoring);
  const openModal = useSaaSModalsStore((s) => s.openModal);

  const layers = useLayersStore((s) => s.layers);
  const toggleLayer = useLayersStore((s) => s.toggleLayer);
  const isLayersSheetOpen = useLayersStore((s) => s.isLayersSheetOpen);
  const setIsLayersSheetOpen = useLayersStore((s) => s.setIsLayersSheetOpen);

  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [permissionBanner, setPermissionBanner] = useState<string | null>(null);
  const { canEdit, canUseTelemetry, isAuthenticated } = useFeatureGating();

  const activeLayersCount = Object.values(layers).filter(Boolean).length;

  return (
    <>
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 max-w-[96vw] select-none font-mono text-xs">
        {/* Permission Toast Banner */}
        {permissionBanner && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-amber-500/95 text-white dark:bg-amber-600/95 px-3 py-1.5 text-[11px] font-semibold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-1.5 z-40 border border-amber-400/50">
            <Lock className="h-3 w-3" />
            <span>{permissionBanner}</span>
          </div>
        )}

        {/* Unified Tactile Dock */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-slate-300/80 dark:border-[#1E273A] bg-white/95 dark:bg-[#0B0E14]/95 shadow-2xl backdrop-blur-2xl text-slate-800 dark:text-slate-200">
          
          {/* Segment 1: View Modes (3D, 2D, Split, Builder) */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-[#101520] border border-slate-200 dark:border-[#1E273A]">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                viewMode === '3d'
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
              title="3D WebGL Spatial View"
            >
              <Box className="h-3.5 w-3.5" />
              <span>3D</span>
            </button>

            {isAuthenticated && (
              <>
                <button
                  onClick={() => setViewMode('2d')}
                  className={`hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    viewMode === '2d'
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                  title="2D Vector Schematic View"
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>2D</span>
                </button>

                <button
                  onClick={() => setViewMode('split')}
                  className={`hidden md:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    viewMode === 'split'
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                  title="Side-by-Side Comparison Mode"
                >
                  <Columns className="h-3.5 w-3.5" />
                  <span>Split</span>
                </button>

                <button
                  onClick={() => {
                    if (!canEdit) {
                      setPermissionBanner('O modo Builder requer permissão de edição (Papel Editor ou Administrador).');
                      setTimeout(() => setPermissionBanner(null), 3500);
                      return;
                    }
                    setViewMode('editor');
                  }}
                  className={`hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    viewMode === 'editor'
                      ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                      : canEdit
                      ? 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                      : 'text-slate-400 dark:text-slate-600 opacity-60 cursor-not-allowed'
                  }`}
                  title={canEdit ? 'Visual Diagram Builder & Editor' : 'Modo Somente Leitura (Requer papel de Editor)'}
                >
                  {canEdit ? <Layers className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  <span>Builder</span>
                </button>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-200 dark:bg-[#1E273A] shrink-0" />

          {/* Segment 2: Camera Controls (Active in 3D / Split) */}
          {viewMode !== '2d' && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setCameraPreset('overview')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors ${
                  cameraPreset === 'overview'
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Ajustar Câmera (Overview)"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden lg:inline text-[11px]">Fit</span>
              </button>

              <button
                onClick={() => setCameraPreset('topology')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors ${
                  cameraPreset === 'topology'
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Visão Topológica CAD (Top-Down)"
              >
                <Compass className="h-3.5 w-3.5" />
                <span className="hidden lg:inline text-[11px]">CAD</span>
              </button>

              <button
                onClick={toggleCinematic}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors ${
                  isCinematic
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title="Órbita Cinemática Contínua"
              >
                <Video className="h-3.5 w-3.5" />
                <span className="hidden lg:inline text-[11px]">Cinematic</span>
              </button>

              <button
                onClick={toggleFreeCamera}
                className={`flex items-center gap-1 rounded-lg px-2 py-1.5 transition-all ${
                  isFreeCamera
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title={
                  isFreeCamera
                    ? 'Câmera Livre Ativa: Foco automático desativado'
                    : 'Ativar Câmera Livre: Permite órbita e zoom sem salto de foco'
                }
              >
                <Unlock className={`h-3.5 w-3.5 ${isFreeCamera ? 'text-emerald-400' : ''}`} />
                <span className="hidden lg:inline text-[11px]">Livre</span>
              </button>

              <button
                onClick={resetCamera}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                title="Resetar Câmera"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="h-5 w-px bg-slate-200 dark:bg-[#1E273A] shrink-0" />

          {/* Segment 3: Layers & Health Filter */}
          <div className="relative shrink-0 flex items-center gap-1">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setIsLayersSheetOpen(true);
                } else {
                  setShowLayersMenu(!showLayersMenu);
                  setShowToolsMenu(false);
                }
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors ${
                showLayersMenu || isLayersSheetOpen
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-semibold border border-sky-500/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
              title="Alternar Camadas Espaciais da Cena"
            >
              <Layers className="h-3.5 w-3.5 text-sky-500" />
              <span className="text-[11px] font-semibold">Camadas</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {activeLayersCount}
              </span>
            </button>

            {/* Desktop Layers Popover */}
            {showLayersMenu && (
              <div className="hidden md:block absolute bottom-12 left-0 z-40 w-56 rounded-2xl border border-slate-200 dark:border-[#1E273A] bg-white/95 dark:bg-[#0B0E14]/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 mb-1">
                  <span>Camadas da Cena</span>
                  <span className="text-sky-400 font-mono">{activeLayersCount}/{LAYER_ITEMS.length}</span>
                </div>
                <div className="space-y-0.5">
                  {LAYER_ITEMS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleLayer(key)}
                      className="w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161C2A] transition-colors"
                    >
                      <span>{label}</span>
                      {layers[key] && <Check className="h-3.5 w-3.5 text-sky-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Health Filter Pills */}
            <div className="hidden xl:flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-[#101520] border border-slate-200 dark:border-[#1E273A] text-[10px]">
              {(['all', 'healthy', 'warning', 'error'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterStatus(filter)}
                  className={`rounded px-2 py-1 capitalize transition-colors ${
                    filterStatus === filter
                      ? 'bg-white dark:bg-[#1E273A] font-bold text-sky-600 dark:text-sky-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          {isAuthenticated && <div className="h-5 w-px bg-slate-200 dark:bg-[#1E273A] shrink-0" />}

          {/* Segment 4: Consolidated Enterprise SaaS Tools */}
          {isAuthenticated && (
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowToolsMenu(!showToolsMenu);
                  setShowLayersMenu(false);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all ${
                  showToolsMenu
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 font-semibold border border-sky-500/30'
                    : isMonitoringActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
                title="Ferramentas Enterprise & Análise"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                <span className="text-[11px] font-semibold">Ferramentas</span>
                {isMonitoringActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />}
                <ChevronUp className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${showToolsMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Tools Popover Menu */}
              {showToolsMenu && (
                <div className="absolute bottom-12 right-0 z-40 w-64 rounded-2xl border border-slate-200 dark:border-[#1E273A] bg-white/95 dark:bg-[#0B0E14]/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/80 mb-1.5">
                    Operações & Arquitetura
                  </div>

                  <div className="space-y-1">
                    {/* Live Ops Telemetry */}
                    <button
                      onClick={() => {
                        setShowToolsMenu(false);
                        if (!canUseTelemetry) {
                          openModal('billing');
                          return;
                        }
                        toggleMonitoring();
                      }}
                      className="w-full flex items-center justify-between rounded-xl p-2 text-left hover:bg-slate-100 dark:hover:bg-[#161C2A] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400">
                          <Radio className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>Live Ops Telemetry</span>
                            {isMonitoringActive && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                Ativo
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">Streaming Datadog / Prometheus</div>
                        </div>
                      </div>
                      {!canUseTelemetry && <Lock className="h-3 w-3 text-amber-500" />}
                    </button>

                    {/* Architecture 3D Diff */}
                    <button
                      onClick={() => {
                        setShowToolsMenu(false);
                        openModal('diff');
                      }}
                      className="w-full flex items-center justify-between rounded-xl p-2 text-left hover:bg-slate-100 dark:hover:bg-[#161C2A] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-sky-500/10 text-sky-400">
                          <GitCompare className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Architecture Diff</div>
                          <div className="text-[10px] text-slate-500">Comparar versões em cena 3D</div>
                        </div>
                      </div>
                    </button>

                    {/* IaC Terraform & Pulumi Sync */}
                    <button
                      onClick={() => {
                        setShowToolsMenu(false);
                        openModal('iac');
                      }}
                      className="w-full flex items-center justify-between rounded-xl p-2 text-left hover:bg-slate-100 dark:hover:bg-[#161C2A] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-400">
                          <Code2 className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Sincronização IaC</div>
                          <div className="text-[10px] text-slate-500">Terraform, Pulumi & OpenTofu</div>
                        </div>
                      </div>
                    </button>

                    {/* WebXR VR/AR Immersive */}
                    <button
                      onClick={() => {
                        setShowToolsMenu(false);
                        openModal('webxr');
                      }}
                      className="w-full flex items-center justify-between rounded-xl p-2 text-left hover:bg-slate-100 dark:hover:bg-[#161C2A] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-violet-500/10 text-violet-400">
                          <Glasses className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Modo WebXR Imersivo</div>
                          <div className="text-[10px] text-slate-500">Apple Vision Pro & Meta Quest</div>
                        </div>
                      </div>
                    </button>

                    {/* Architecture Decision Records (ADR) */}
                    <button
                      onClick={() => {
                        setShowToolsMenu(false);
                        openModal('adr');
                      }}
                      className="w-full flex items-center justify-between rounded-xl p-2 text-left hover:bg-slate-100 dark:hover:bg-[#161C2A] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-400">
                          <FileCheck2 className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Gerador de ADR</div>
                          <div className="text-[10px] text-slate-500">Architecture Decision Records</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Tutorial Icon Link */}
          <div className="h-5 w-px bg-slate-200 dark:bg-[#1E273A] shrink-0" />
          <Link
            href="/tutorial"
            className="flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            title="Abrir Tutorial e Guia"
          >
            <BookOpen className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

    {/* Mobile Responsive Layers Bottom Sheet (< 768px) */}
    <AnimatePresence>
      {isLayersSheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/70 backdrop-blur-sm font-mono select-none">
          <div
            className="absolute inset-0"
            onClick={() => setIsLayersSheetOpen(false)}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full rounded-t-2xl border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl max-h-[75vh] flex flex-col text-slate-800 dark:text-slate-100 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
          >
            {/* Tactile drag handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 shrink-0" />

            {/* Bottom Sheet Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Camadas da Cena 3D
                  </h3>
                  <p className="text-[10px] text-slate-500">Ative ou oculte elementos espaciais</p>
                </div>
              </div>
              <button
                onClick={() => setIsLayersSheetOpen(false)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:text-slate-200"
                aria-label="Fechar Camadas"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Toggles list with 44px min-h touch targets */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {LAYER_ITEMS.map(({ key, label, desc }) => {
                const isActive = layers[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleLayer(key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left min-h-[44px] transition-all ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-400/40 dark:border-sky-800/50 text-sky-900 dark:text-sky-200 font-semibold'
                        : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/70 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold text-xs truncate">{label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{desc}</div>
                    </div>
                    <div
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 shrink-0 ${
                        isActive ? 'bg-sky-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
  );
}
