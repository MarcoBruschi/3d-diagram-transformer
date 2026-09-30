'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveMonitoringStore, TelemetryAlert } from '@/store/useLiveMonitoringStore';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { useFeatureGating } from '@/hooks/useFeatureGating';
import {
  Activity,
  AlertTriangle,
  Radio,
  CheckCircle2,
  X,
  PlusCircle,
  Clock,
  Zap,
  ChevronRight,
  TrendingUp,
  Cpu,
  Server,
  Layers,
} from 'lucide-react';

export function LiveMonitoringHUD() {
  const { canUseTelemetry } = useFeatureGating();
  const isMonitoringActive = useLiveMonitoringStore((s) => s.isMonitoringActive);
  const toggleMonitoring = useLiveMonitoringStore((s) => s.toggleMonitoring);
  const provider = useLiveMonitoringStore((s) => s.provider);
  const setProvider = useLiveMonitoringStore((s) => s.setProvider);
  const metrics = useLiveMonitoringStore((s) => s.metricsOverview);
  const alerts = useLiveMonitoringStore((s) => s.alerts);
  const dismissAlert = useLiveMonitoringStore((s) => s.dismissAlert);
  const nodes = useDiagramStore((s) => s.diagram.nodes);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAlertNode, setSelectedAlertNode] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isMonitoringActive || !canUseTelemetry) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-20 max-w-[94vw] rounded-2xl border border-emerald-500/30 bg-[#0B0E14]/95 shadow-2xl backdrop-blur-2xl px-3 sm:px-4 py-1.5 font-mono text-xs flex items-center justify-between gap-3 sm:gap-6 select-none"
        >
          {/* Left Indicator & Provider */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="font-bold text-emerald-400 uppercase text-[11px] tracking-wider flex items-center gap-1">
                <Radio className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">LIVE OPS STREAMING</span>
                <span className="sm:hidden">LIVE</span>
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* Provider Select */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 sm:py-0.5 rounded-lg border border-slate-800 text-[11px]">
              <span className="text-slate-400 hidden sm:inline">Stream:</span>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="bg-transparent text-emerald-300 font-bold outline-none capitalize cursor-pointer min-h-[32px]"
              >
                <option value="datadog" className="bg-slate-950 text-slate-200">Datadog</option>
                <option value="prometheus" className="bg-slate-950 text-slate-200">Prometheus</option>
                <option value="grafana" className="bg-slate-950 text-slate-200">Grafana</option>
                <option value="cloudwatch" className="bg-slate-950 text-slate-200">CloudWatch</option>
              </select>
            </div>
          </div>

          {/* Center Live Metrics */}
          <div className="hidden lg:flex items-center gap-6 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-slate-400">Global P95:</span>
              <strong className="text-sky-300">{metrics.globalLatency}ms</strong>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-slate-400">Taxa de Erro:</span>
              <strong className="text-emerald-400">{metrics.errorRate}%</strong>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <Activity className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-slate-400">Total RPS:</span>
              <strong className="text-slate-100">{metrics.totalRps.toLocaleString()} rps</strong>
            </div>

            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-slate-400">Incidentes:</span>
              <span className="rounded bg-rose-500/20 text-rose-300 px-1.5 py-0.2 font-bold">
                {alerts.length}
              </span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="flex items-center gap-1 px-3 py-2 sm:py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold transition-colors min-h-[44px] sm:min-h-0"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>{isDrawerOpen ? 'Fechar' : 'Métricas'}</span>
            </button>

            <button
              onClick={toggleMonitoring}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Encerrar Monitoramento"
              aria-label="Encerrar Monitoramento"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Retractable Lateral Drawer on Desktop / Bottom Sheet on Mobile */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={isMobile ? { y: '100%', opacity: 0 } : { x: 380, opacity: 0 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={isMobile ? { y: '100%', opacity: 0 } : { x: 380, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 md:top-28 md:right-4 md:bottom-6 md:inset-x-auto md:w-96 max-h-[75vh] md:max-h-none h-[65vh] md:h-auto rounded-t-2xl md:rounded-2xl border-t md:border border-slate-800 bg-slate-950/95 backdrop-blur-2xl p-4 sm:p-5 shadow-2xl z-40 font-mono text-xs flex flex-col text-slate-200 select-none overflow-hidden"
          >
            {/* Mobile Pull Handle */}
            <div
              onClick={() => setIsDrawerOpen(false)}
              className="md:hidden w-full flex flex-col items-center pt-1 pb-2 cursor-pointer shrink-0"
            >
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-1" />
              <span className="text-[10px] text-slate-400">Toque para fechar painel</span>
            </div>

            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-slate-100">Painel de Telemetria 3D</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                aria-label="Fechar Painel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Telemetry Throughput */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Throughput ao Vivo</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{metrics.totalRps.toLocaleString()} RPS</span>
                </div>
                {/* SVG Live Sparkline */}
                <svg className="w-full h-16 stroke-emerald-400 fill-emerald-500/10" viewBox="0 0 100 40">
                  <path
                    d={metrics.totalRps > 0 ? "M0 30 Q 15 10, 30 24 T 60 14 T 80 28 T 100 8 L 100 40 L 0 40 Z" : "M0 38 L 100 38 L 100 40 L 0 40 Z"}
                    strokeWidth="1.5"
                  />
                  <path
                    d={metrics.totalRps > 0 ? "M0 30 Q 15 10, 30 24 T 60 14 T 80 28 T 100 8" : "M0 38 L 100 38"}
                    fill="none"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              {/* Latency Distribution */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/40">
                  <span className="text-slate-400 block text-[10px]">P50 Latência</span>
                  <strong className="text-sky-400 text-sm">{metrics.globalLatency} ms</strong>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/40">
                  <span className="text-slate-400 block text-[10px]">P99 Latência</span>
                  <strong className="text-rose-400 text-sm">{metrics.globalLatency ? Math.round(metrics.globalLatency * 1.5) : 0} ms</strong>
                </div>
              </div>

              {/* Active Incident List */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">
                  Alertas em Tempo Real ({alerts.length})
                </span>

                {alerts.length === 0 ? (
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-center">
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-emerald-400" />
                    <span>Todos os nós 3D operando na faixa nominal.</span>
                  </div>
                ) : (
                  alerts.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAlertNode(a.nodeName)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        a.severity === 'critical'
                          ? 'border-rose-500/40 bg-rose-500/10'
                          : 'border-amber-500/40 bg-amber-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-100 flex items-center gap-1.5">
                          <AlertTriangle
                            className={`h-3.5 w-3.5 ${
                              a.severity === 'critical' ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                            }`}
                          />
                          <span>{a.nodeName}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissAlert(a.id);
                          }}
                          className="hover:text-white text-slate-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-300">
                        {a.metric}: <strong className="text-rose-300">{a.value}</strong> (limite: {a.threshold})
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{a.timestamp}</span>
                        <span className="text-sky-400">Ver no Canvas 3D →</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
