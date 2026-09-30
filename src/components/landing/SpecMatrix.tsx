'use client';

import React, { useState } from 'react';
import {
  Terminal,
  ArrowRight,
  Cpu,
  Zap,
  Activity,
  Maximize2,
  RefreshCw,
  GitBranch,
  ShieldCheck,
  Check,
} from 'lucide-react';
import Link from 'next/link';

interface SpecRow {
  code: string;
  tag: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  status: string;
  technicalParams: { label: string; value: string }[];
}

const SPEC_LEDGER: SpecRow[] = [
  {
    code: 'SEC.02.01',
    tag: 'SPATIAL TELEMETRY',
    title: 'Traveling Particle Kinematics',
    description:
      'Directional particle physics surge along 3D volumetric Bezier splines, visualizing real throughput rates, API latencies, and network bottlenecks.',
    metric: '4,200 pkt/s',
    metricLabel: 'Peak simulation throughput',
    status: 'ACTIVE_PIPELINE',
    technicalParams: [
      { label: 'Spline Math', value: 'Cubic Bezier 3D' },
      { label: 'Particle Batching', value: 'InstancedMesh GPU' },
      { label: 'Physics Loop', value: 'Runge-Kutta 4th Order' },
    ],
  },
  {
    code: 'SEC.02.02',
    tag: 'INGESTION ENGINE',
    title: 'Multi-Format Blueprint Parsing',
    description:
      'Converts raw Mermaid, PlantUML, AWS Architecture diagrams, structural JSON, and ASCII arrow pipelines into validated spatial entity graphs.',
    metric: '100% Lossless',
    metricLabel: 'Declarative graph fidelity',
    status: 'AST_SYNTHESIS',
    technicalParams: [
      { label: 'Parser Depth', value: 'Recursive Descent AST' },
      { label: 'Layout Relaxer', value: 'Force-Directed 3D' },
      { label: 'Entity Schema', value: 'Zod-Validated Schema' },
    ],
  },
  {
    code: 'SEC.02.03',
    tag: 'DUAL VIEWPORT',
    title: 'Bi-Directional 2D / 3D Synchronization',
    description:
      'Side-by-side split screen inspection with synchronous camera pinning and live cursor tracking across schematic layers and physical meshes.',
    metric: '1:1 Spatial Parity',
    metricLabel: 'Zero coordinate drift',
    status: 'CAMERA_SYNC_LOCKED',
    technicalParams: [
      { label: 'Raycasting', value: 'BVH Accelerated' },
      { label: 'Projection', value: 'Dual Matrix Sync' },
      { label: 'Event Dispatch', value: 'PointerEvent Pipeline' },
    ],
  },
  {
    code: 'SEC.02.04',
    tag: 'OBSERVABILITY',
    title: 'Real-Time Hardware Mesh Telemetry',
    description:
      'Direct runtime inspection of CPU load, memory utilization, and time-series telemetry mapped directly onto hardware meshes and platter platters.',
    metric: '< 16ms Latency',
    metricLabel: 'Frame-rate runtime budget',
    status: 'TELEMETRY_STREAMING',
    technicalParams: [
      { label: 'Transport', value: 'WebSocket Binary' },
      { label: 'Shader Uniform', value: 'Float32 Telemetry Array' },
      { label: 'Refresh Rate', value: '60 Hz Synchronous' },
    ],
  },
];

const HUD_LOGS = {
  telemetry: [
    { time: '00:00:01.042', tag: 'INGEST', msg: 'Reading Mermaid graph AST tokens (42 nodes, 68 links)...' },
    { time: '00:00:01.120', tag: 'LAYOUT', msg: 'Spatial force-directed 3D relaxation converged in 18ms.' },
    { time: '00:00:01.215', tag: 'MESH', msg: 'Allocating WebGL 2.0 instanced buffers for compute blades.' },
    { time: '00:00:01.304', tag: 'SPLINE', msg: 'Synthesizing cubic Bezier energy flow conduits.' },
    { time: '00:00:01.400', tag: 'READY', msg: 'Full topology twin ready. 60 FPS verified.' },
  ],
  geometry: [
    { prop: 'GEOMETRY_INSTANCES', val: '1,420 meshes', budget: 70 },
    { prop: 'DRAW_CALL_BUDGET', val: '14 calls (batched)', budget: 23 },
    { prop: 'VERTEX_DENSITY', val: '48.2k primitives', budget: 48 },
    { prop: 'VRAM_ALLOCATION', val: '18.4 MB / 128 MB', budget: 14 },
    { prop: 'SHADOW_RESOLUTION', val: '1024x1024 contact', budget: 50 },
  ],
  topology: [
    { node: 'edge-gateway-01', role: 'API Proxy', state: 'ONLINE', p99: '18ms', load: '32%' },
    { node: 'auth-service-k8s', role: 'Compute Blade', state: 'HEALTHY', p99: '24ms', load: '45%' },
    { node: 'order-processing-v2', role: 'Worker Array', state: 'HEALTHY', p99: '31ms', load: '61%' },
    { node: 'aurora-cluster-primary', role: 'DB Platter', state: 'REPLICATED', p99: '12ms', load: '28%' },
  ],
};

export function SpecMatrix() {
  const [hudTab, setHudTab] = useState<'telemetry' | 'geometry' | 'topology'>('telemetry');
  const [activeSpecIndex, setActiveSpecIndex] = useState<number>(0);
  const [simulatedStress, setSimulatedStress] = useState<boolean>(false);

  const activeSpec = SPEC_LEDGER[activeSpecIndex] || SPEC_LEDGER[0];

  return (
    <section className="relative border-t border-slate-200 dark:border-[#1E273A] bg-slate-50/60 dark:bg-[#06080D]/90 py-28 px-6 lg:px-16 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden">
      {/* CAD Precision Calibration Markers */}
      <div className="absolute top-8 left-8 font-mono text-[10px] text-slate-400 dark:text-[#2A374F] select-none pointer-events-none">
        SPEC.LOC // [REF_GRID_X02]
      </div>
      <div className="absolute top-8 right-8 font-mono text-[10px] text-slate-400 dark:text-[#2A374F] select-none pointer-events-none">
        SCALE // 1:1 [MM_STANDARDS]
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Section Heading Monolith */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-12 border-b border-slate-200 dark:border-[#1E273A]">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-cyan-600 dark:text-cyan-400 font-semibold tracking-wider uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>[ SEC.02 // ARCHITECTURAL SPECIFICATION MATRIX ]</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08] uppercase">
              ENGINEERED FOR COMPLEX SYSTEMS AT SCALE.
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            Eliminate diagram rot and cognitive fragmentation. Transform flat 2D schemas into living
            spatial twins for architecture reviews, incident forensics, and topology inspection.
          </p>
        </div>

        {/* Asymmetric Engineering Cockpit */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Interactive Technical Console HUD */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#090C12] p-6 sm:p-7 shadow-sm flex flex-col justify-between relative">
            <div>
              {/* HUD Console Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E273A] pb-4">
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold">
                  <Terminal className="h-4 w-4" />
                  <span>RUNTIME CONSOLE // WEBGL 2.0</span>
                </div>
                <button
                  onClick={() => setSimulatedStress(!simulatedStress)}
                  className={`flex items-center gap-1.5 font-mono text-[10px] px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                    simulatedStress
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}
                  title="Clique para alternar simulação de estresse"
                >
                  <Activity className={`h-3 w-3 ${simulatedStress ? 'animate-bounce' : 'animate-pulse'}`} />
                  <span>{simulatedStress ? 'SIMULATING_BURST' : 'SYSTEM_NOMINAL'}</span>
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center gap-2 pt-4 pb-3 font-mono text-[11px]" role="tablist">
                {(['telemetry', 'geometry', 'topology'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setHudTab(tab)}
                    role="tab"
                    aria-selected={hudTab === tab}
                    className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer uppercase ${
                      hudTab === tab
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#121824]'
                    }`}
                  >
                    {tab === 'telemetry' && 'TELEMETRY_LOG'}
                    {tab === 'geometry' && 'GEOMETRY_BUFFER'}
                    {tab === 'topology' && 'TOPOLOGY_MAP'}
                  </button>
                ))}
              </div>

              {/* Console Screen Body */}
              <div className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-100/70 dark:bg-[#04060A] p-4 font-mono text-xs min-h-[260px] overflow-hidden">
                {hudTab === 'telemetry' && (
                  <div className="space-y-2.5">
                    {HUD_LOGS.telemetry.map((log, i) => (
                      <div key={i} className="flex items-start gap-2.5 leading-relaxed text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 select-none">{log.time}</span>
                        <span className="text-cyan-700 dark:text-cyan-400 font-semibold select-none">
                          [{log.tag}]
                        </span>
                        <span className="text-slate-800 dark:text-slate-300">
                          {simulatedStress && i === 2
                            ? 'Burst packet flow: 12,800 pkt/s routed across channels.'
                            : log.msg}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {hudTab === 'geometry' && (
                  <div className="space-y-3">
                    {HUD_LOGS.geometry.map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 dark:text-slate-400">{item.prop}</span>
                          <span className="font-bold text-cyan-700 dark:text-cyan-300 font-mono">
                            {item.val}
                          </span>
                        </div>
                        <div className="h-1 w-full bg-slate-200 dark:bg-[#161F30] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 dark:bg-cyan-400 rounded-full"
                            style={{ width: `${item.budget}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {hudTab === 'topology' && (
                  <div className="space-y-2">
                    {HUD_LOGS.topology.map((node, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-[#1E273A]"
                      >
                        <div className="flex items-center gap-2">
                          <Cpu className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {node.node}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-slate-500">{node.role}</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{node.load}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {node.p99}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Console Footer */}
            <div className="pt-6 border-t border-slate-100 dark:border-[#1E273A] mt-6 flex items-center justify-between">
              <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>SHADER_MATERIAL // HIGH_PERFORMANCE</span>
              </div>
              <Link
                href="/studio"
                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors cursor-pointer"
              >
                <span>OPEN_INSPECTOR</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Monolithic Engineering Specification Ledger */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#090C12] p-6 sm:p-7 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              {/* Ledger Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E273A] pb-4">
                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  ARCHITECTURAL SUBSYSTEMS [4 OF 4]
                </div>
                <div className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                  ACTIVE: {activeSpec.code}
                </div>
              </div>

              {/* Subsystem Selector Rows (Monolithic list replacing generic 2x2 cards) */}
              <div className="space-y-2.5">
                {SPEC_LEDGER.map((spec, idx) => {
                  const isSelected = activeSpecIndex === idx;
                  return (
                    <button
                      key={spec.code}
                      onClick={() => setActiveSpecIndex(idx)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-cyan-500/50 bg-cyan-50/50 dark:bg-cyan-950/20 shadow-xs'
                          : 'border-slate-200 dark:border-[#1E273A] bg-slate-50/50 dark:bg-[#05070A]/50 hover:border-cyan-500/30 hover:bg-slate-50 dark:hover:bg-[#0B0E14]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                            {spec.code}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {spec.title}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          {spec.tag}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-xs sm:self-center">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {spec.metric}
                        </span>
                        <div
                          className={`h-2 w-2 rounded-full ${
                            isSelected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-300 dark:bg-[#1E273A]'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Subsystem Technical Deep Dive */}
              <div className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50/80 dark:bg-[#04060A] p-4 space-y-3 font-mono">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-[#1E273A]">
                  <span className="text-cyan-700 dark:text-cyan-400 font-bold uppercase">
                    SUBSYSTEM PARAMETERS // {activeSpec.status}
                  </span>
                  <span className="text-[10px] text-slate-500">{activeSpec.metricLabel}</span>
                </div>

                <p className="font-sans text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {activeSpec.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  {activeSpec.technicalParams.map((param, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-2 rounded-lg bg-white dark:bg-[#090C12] border border-slate-200 dark:border-[#1E273A] space-y-0.5"
                    >
                      <div className="text-[9px] text-slate-500 uppercase">{param.label}</div>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        {param.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Status Row */}
            <div className="pt-6 border-t border-slate-100 dark:border-[#1E273A] mt-6 flex items-center justify-between font-mono text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>SPECIFICATION_AUDITED // ISO_SPATIAL_V2</span>
              </div>
              <div>REVISION // 2026.09</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
