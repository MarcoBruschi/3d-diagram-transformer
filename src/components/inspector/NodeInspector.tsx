'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useCameraStore } from '@/store/useCameraStore';
import { useAuthStore } from '@/store/useAuthStore';
import { NODE_VISUALS, STATUS_VISUALS } from '@/lib/mappings/nodeTypes';
import { diagramService } from '@/lib/services/diagramService';
import { useThemeStore } from '@/store/useThemeStore';
import {
  X,
  Cpu,
  HardDrive,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  Zap,
  Sliders,
  Layers,
  Sparkles,
  Eye,
  Edit2,
  Activity,
  Box,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export function NodeInspector() {
  const selectedNodeId = useDiagramStore((s) => s.selectedNodeId);
  const selectNode = useDiagramStore((s) => s.selectNode);
  const setViewMode = useDiagramStore((s) => s.setViewMode);
  const diagram = useDiagramStore((s) => s.diagram);
  const focusOnNode = useCameraStore((s) => s.focusOnNode);
  const openModal = useSaaSModalsStore((s) => s.openModal);
  const theme = useThemeStore((s) => s.theme);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'connections' | 'json'>('overview');
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedNode = useMemo(() => {
    return diagram.nodes.find((n) => n.id === selectedNodeId);
  }, [diagram.nodes, selectedNodeId]);

  const telemetryData = useMemo(() => {
    if (!selectedNode) return null;
    return diagramService.generateMockTelemetry(selectedNode);
  }, [selectedNode]);

  if (!selectedNode) return null;

  const visual = NODE_VISUALS[selectedNode.type] || NODE_VISUALS.generic;
  const statusConfig = STATUS_VISUALS[selectedNode.status] || STATUS_VISUALS.active;
  const pos3D = selectedNode.position3D || { x: 0, y: 0, z: 0 };

  // Inbound and Outbound connections
  const inConnections = diagram.connections.filter((c) => c.target === selectedNode.id);
  const outConnections = diagram.connections.filter((c) => c.source === selectedNode.id);

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(selectedNode, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={isMobile ? { y: '100%', opacity: 0 } : { x: 420, opacity: 0 }}
        animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
        exit={isMobile ? { y: '100%', opacity: 0 } : { x: 420, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 bottom-0 z-40 md:absolute md:top-16 md:right-4 md:bottom-4 md:inset-x-auto md:w-96 flex flex-col rounded-t-2xl md:rounded-2xl border-t md:border border-slate-200 dark:border-[#1E273A] bg-white/95 dark:bg-[#0B0E14]/95 shadow-2xl backdrop-blur-2xl overflow-hidden font-sans transition-all duration-300 ${
          isMobile && isMobileCollapsed ? 'h-16' : 'max-h-[80vh] h-[65vh] md:h-auto md:max-h-none'
        }`}
      >
        {/* Mobile Pull Handle / Collapse Bar */}
        <div
          onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
          className="md:hidden w-full flex flex-col items-center pt-2 pb-1 cursor-pointer select-none bg-slate-100/60 dark:bg-[#101520] hover:bg-slate-200/50 transition-colors shrink-0"
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mb-1" />
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
            {isMobileCollapsed ? (
              <>
                <ChevronUp className="h-3 w-3" />
                <span>Expandir Inspeção ({selectedNode.name})</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                <span>Recolher para Visualização 3D</span>
              </>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-[#1E273A] p-3 sm:p-4 shrink-0 bg-slate-50/50 dark:bg-[#101520]/40">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: statusConfig.color }}
              />
              <span className="font-mono text-[10px] tracking-wider font-semibold uppercase" style={{ color: visual.color }}>
                {visual.badgeLabel}
              </span>
              {selectedNode.properties?.stereotype && (
                <span className="font-mono text-[9px] text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/40 rounded px-1">
                  «{String(selectedNode.properties.stereotype)}»
                </span>
              )}
              <span className="font-mono text-[9px] text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/70 border border-sky-300 dark:border-sky-800/50 rounded px-1.5 py-0.2">
                VISUALIZAÇÃO
              </span>
            </div>
            <h2 className="mt-1 text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">{selectedNode.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{selectedNode.description || 'System node'}</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => selectNode(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              title="Fechar (Esc)"
              aria-label="Fechar"
            >
              <X className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation - Hidden when collapsed on mobile */}
        {(!isMobile || !isMobileCollapsed) && (
          <div className="flex border-b border-slate-200 dark:border-[#1E273A] bg-slate-100/60 dark:bg-[#101520] px-2 pt-1 font-mono text-xs shrink-0">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Eye },
              { id: 'telemetry', label: 'Telemetria', icon: Activity },
              { id: 'connections', label: 'Links', icon: ArrowUpRight },
              { id: 'json', label: 'JSON', icon: Copy },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 py-2 sm:py-2 text-center flex items-center justify-center gap-1 transition-colors border-b-2 min-h-[44px] sm:min-h-0 ${
                    activeTab === tab.id
                      ? 'border-sky-600 dark:border-sky-400 font-semibold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800/40 shadow-xs'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab Content Body - Hidden when collapsed on mobile */}
        {(!isMobile || !isMobileCollapsed) && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Action & Status Strip (Tactile CAD style without card nesting) */}
                <div className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#101520] p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                      <Box className="h-3.5 w-3.5" />
                      <span>{isAuthenticated ? 'Status do Inspetor' : 'Modo Visitante'}</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#161C2A] text-slate-600 dark:text-slate-300">
                      {isAuthenticated ? 'Somente Leitura' : '3D Viewer'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {!isAuthenticated
                      ? 'Faça login para desbloquear o Builder, reposicionar nós no espaço 3D e salvar alterações na nuvem.'
                      : isMobile
                      ? 'Para reposicionar nós ou desenhar novas conexões, abra o estúdio em um tablet ou desktop.'
                      : 'Nó bloqueado contra arrastos acidentais. Use o Builder para alterar topologia ou posições espaciais.'}
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                    {isAuthenticated && !isMobile && (
                      <button
                        onClick={() => setViewMode('editor')}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 font-bold text-white shadow hover:bg-sky-500 transition-colors text-[11px]"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Abrir no Builder</span>
                      </button>
                    )}
                    {!isAuthenticated && (
                      <Link
                        href="/login"
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 font-bold text-white shadow hover:bg-sky-500 transition-colors text-[11px]"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Fazer Login</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        if (selectedNode.position3D) {
                          focusOnNode(selectedNode.position3D);
                        }
                      }}
                      className={`${isMobile ? 'flex-1' : ''} flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-[#1E273A] bg-white dark:bg-[#161C2A] px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E273A] transition-colors text-[11px] min-h-[38px]`}
                      title="Centralizar Câmera 3D"
                    >
                      <Sliders className="h-3.5 w-3.5 text-sky-400" />
                      <span>Focar Câmera</span>
                    </button>
                    {isAuthenticated && (
                      <button
                        onClick={() => openModal('comments', { nodeId: selectedNode.id })}
                        className={`${isMobile ? 'flex-1' : ''} flex items-center justify-center gap-1.5 rounded-lg border border-pink-300/60 dark:border-pink-500/30 bg-pink-50/50 dark:bg-pink-950/20 px-3 py-2 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-950/40 transition-colors text-[11px] min-h-[38px]`}
                        title="Ver ou Adicionar Comentários Técnicos neste Nó"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-pink-400" />
                        <span>Comentários</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Telemetry Quick Gauges (High Craft Linear CAD Specs) */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50/60 dark:bg-[#101520]/80 p-2.5">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock className="h-3 w-3 text-sky-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Latência P95</span>
                    </div>
                    <div className="mt-1 text-base font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                      {selectedNode.metrics?.latency !== undefined ? (
                        <>
                          {selectedNode.metrics.latency}
                          <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400"> ms</span>
                        </>
                      ) : (
                        <span className="text-xs font-normal text-slate-400">--</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50/60 dark:bg-[#101520]/80 p-2.5">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Zap className="h-3 w-3 text-amber-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Throughput</span>
                    </div>
                    <div className="mt-1 text-base font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                      {selectedNode.metrics?.requestsPerSec !== undefined ? (
                        <>
                          {selectedNode.metrics.requestsPerSec}
                          <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400"> rps</span>
                        </>
                      ) : (
                        <span className="text-xs font-normal text-slate-400">--</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50/60 dark:bg-[#101520]/80 p-2.5">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="h-3 w-3 text-emerald-400" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Carga CPU</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-200 font-bold tabular-nums">
                        {selectedNode.metrics?.cpu !== undefined ? `${selectedNode.metrics.cpu}%` : '--'}
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${selectedNode.metrics?.cpu || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50/60 dark:bg-[#101520]/80 p-2.5">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="h-3 w-3 text-violet-400" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Memória</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-200 font-bold tabular-nums">
                        {selectedNode.metrics?.memory !== undefined ? `${selectedNode.metrics.memory}%` : '--'}
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all duration-300"
                        style={{ width: `${selectedNode.metrics?.memory || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Architectural Specifications List (Hairline dividers, no card-nesting) */}
                <div className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14] p-3 space-y-2">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-[#1E273A]">
                    <Layers className="h-3 w-3 text-emerald-400" />
                    <span>Especificação Técnica</span>
                  </div>
                  <div className="space-y-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-500">Modelo 3D:</span>
                      <span className="font-semibold text-sky-600 dark:text-sky-300">{visual.badgeLabel}</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 border-t border-slate-100 dark:border-[#1E273A]/60">
                      <span className="text-slate-500">Estereótipo UML:</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-300">
                        «{selectedNode.properties?.stereotype || selectedNode.type}»
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 border-t border-slate-100 dark:border-[#1E273A]/60">
                      <span className="text-slate-500">Coordenadas 3D:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        [{pos3D.x.toFixed(1)}, {pos3D.y.toFixed(1)}, {pos3D.z.toFixed(1)}]
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 border-t border-slate-100 dark:border-[#1E273A]/60">
                      <span className="text-slate-500">Nível Crítico:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Tier {selectedNode.importance || 3}</span>
                    </div>
                    <div className="flex items-center justify-between py-0.5 border-t border-slate-100 dark:border-[#1E273A]/60">
                      <span className="text-slate-500">Saúde do Sistema:</span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] uppercase font-bold"
                        style={{ color: statusConfig.color, backgroundColor: `${statusConfig.color}22` }}
                      >
                        {selectedNode.status}
                      </span>
                    </div>
                    {selectedNode.layer && (
                      <div className="flex items-center justify-between py-0.5 border-t border-slate-100 dark:border-[#1E273A]/60">
                        <span className="text-slate-500">Camada Lógica:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{selectedNode.layer}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata Properties Table */}
                {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                  <div className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14] p-3 space-y-2">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 pb-1 border-b border-slate-100 dark:border-[#1E273A]">
                      Metadados & Atributos
                    </div>
                    <div className="space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                      {Object.entries(selectedNode.properties).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between py-0.5">
                          <span className="text-slate-500">{k}:</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* TAB 2: TELEMETRY CHART */}
          {activeTab === 'telemetry' && (
            telemetryData && telemetryData.points && telemetryData.points.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span>Throughput History (RPS)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{telemetryData.peakRps} Peak</span>
                  </div>
                  <div className="h-44 w-full rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 p-2 shadow-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={telemetryData.points}>
                        <defs>
                          <linearGradient id="rpsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} />
                        <XAxis dataKey="time" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={9} tickLine={false} />
                        <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={9} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                            borderColor: isDark ? '#334155' : '#CBD5E1',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            fontSize: '11px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                        />
                        <Area type="monotone" dataKey="rps" stroke="#38BDF8" fillOpacity={1} fill="url(#rpsGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                    <span>Latency Response (ms)</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{telemetryData.avgLatency}ms Avg</span>
                  </div>
                  <div className="h-44 w-full rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 p-2 shadow-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={telemetryData.points}>
                        <defs>
                          <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} />
                        <XAxis dataKey="time" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={9} tickLine={false} />
                        <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={9} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                            borderColor: isDark ? '#334155' : '#CBD5E1',
                            color: isDark ? '#F8FAFC' : '#0F172A',
                            fontSize: '11px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                        />
                        <Area type="monotone" dataKey="latency" stroke="#F59E0B" fillOpacity={1} fill="url(#latencyGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
                <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nenhuma Telemetria Conectada
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4 max-w-xs mx-auto">
                  Este nó não possui métricas de telemetria ativas. Conecte um agente (Datadog, Prometheus, CloudWatch) ou configure via API Gateway.
                </p>
                <button
                  onClick={() => openModal('gateway')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold transition-colors shadow-xs"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Configurar Ingestão de Métricas</span>
                </button>
              </div>
            )
          )}

          {/* TAB 3: CONNECTIONS */}
          {activeTab === 'connections' && (
            <div className="space-y-4">
              <div>
                <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5 mb-2">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Inbound Connections ({inConnections.length})
                </span>
                <div className="space-y-2">
                  {inConnections.map((conn) => {
                    const src = diagram.nodes.find((n) => n.id === conn.source);
                    return (
                      <div
                        key={conn.id}
                        onClick={() => selectNode(conn.source)}
                        className="cursor-pointer rounded-xl border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#101520] p-3 hover:border-sky-500/50 hover:bg-sky-50/50 dark:hover:bg-[#161C2A] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{src?.name || conn.source}</span>
                          <span className="rounded bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.5 text-[9px] uppercase font-bold text-sky-700 dark:text-sky-300">
                            {conn.type || 'SYNC'}
                          </span>
                        </div>
                        {conn.label && <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{conn.label}</div>}
                      </div>
                    );
                  })}
                  {inConnections.length === 0 && <div className="text-slate-400 text-xs py-2">Nenhum link de entrada.</div>}
                </div>
              </div>

              <div>
                <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5 mb-2">
                  <ArrowUpRight className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  Conexões de Saída ({outConnections.length})
                </span>
                <div className="space-y-2">
                  {outConnections.map((conn) => {
                    const tgt = diagram.nodes.find((n) => n.id === conn.target);
                    return (
                      <div
                        key={conn.id}
                        onClick={() => selectNode(conn.target)}
                        className="cursor-pointer rounded-xl border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#101520] p-3 hover:border-sky-500/50 hover:bg-sky-50/50 dark:hover:bg-[#161C2A] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{tgt?.name || conn.target}</span>
                          <span className="rounded bg-sky-100 dark:bg-sky-950/60 px-1.5 py-0.5 text-[9px] uppercase font-bold text-sky-700 dark:text-sky-300">
                            {conn.type || 'SYNC'}
                          </span>
                        </div>
                        {conn.label && <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{conn.label}</div>}
                      </div>
                    );
                  })}
                  {outConnections.length === 0 && <div className="text-slate-400 text-xs py-2">Nenhum link de saída.</div>}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RAW JSON SPEC */}
          {activeTab === 'json' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Normalized Schema JSON</span>
                <button
                  onClick={copyJson}
                  className="flex items-center gap-1 rounded-lg border border-slate-300 dark:border-[#1E273A] bg-slate-100 dark:bg-[#101520] px-2.5 py-1 text-[10px] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#161C2A] transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <pre className="max-h-96 overflow-auto rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#07080B] p-3 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono leading-tight">
                {JSON.stringify(selectedNode, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      </motion.aside>
    </AnimatePresence>
  );
}
