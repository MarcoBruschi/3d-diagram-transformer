'use client';

import React, { useState } from 'react';
import {
  Terminal,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import Link from 'next/link';

interface CapabilitySpec {
  code: string;
  tag: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  status: string;
}

const CAPABILITIES: CapabilitySpec[] = [
  {
    code: 'SEC.02.01 //',
    tag: 'SPATIAL TELEMETRY',
    title: 'Traveling Particle Dynamics',
    description:
      'Directional particle physics surge along 3D volumetric Bezier splines, visualizing real throughput rates, API latencies, and network bottlenecks.',
    metric: '4,200 pkt/s',
    metricLabel: 'Peak simulation flow',
    status: 'ACTIVE_PIPELINE',
  },
  {
    code: 'SEC.02.02 //',
    tag: 'INGESTION ENGINE',
    title: 'Multi-Format Blueprint Parsing',
    description:
      'Converts raw Mermaid, PlantUML, AWS Architecture diagrams, structural JSON, and ASCII arrow pipelines into validated spatial entity graphs.',
    metric: '100% Declarative',
    metricLabel: 'Lossless graph conversion',
    status: 'AST_SYNTHESIS',
  },
  {
    code: 'SEC.02.03 //',
    tag: 'DUAL VIEWPORT',
    title: 'Bi-Directional 2D / 3D Sync',
    description:
      'Side-by-side split screen inspection with synchronous camera pinning and live cursor tracking across schematic layers and physical meshes.',
    metric: '1:1 Spatial Parity',
    metricLabel: 'Zero layout desync',
    status: 'CAMERA_SYNC_LOCKED',
  },
  {
    code: 'SEC.02.04 //',
    tag: 'OBSERVABILITY',
    title: 'Real-Time Component Metrics',
    description:
      'Direct runtime inspection of CPU load, memory utilization, and time-series telemetry mapped directly onto hardware meshes.',
    metric: '< 16ms Latency',
    metricLabel: 'Frame-rate budget',
    status: 'TELEMETRY_STREAMING',
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
    { prop: 'GEOMETRY_INSTANCES', val: '1,420 meshes' },
    { prop: 'DRAW_CALL_BUDGET', val: '14 calls (batched)' },
    { prop: 'VERTEX_DENSITY', val: '48.2k primitives' },
    { prop: 'VRAM_ALLOCATION', val: '18.4 MB' },
    { prop: 'SHADOW_RESOLUTION', val: '1024x1024 contact' },
  ],
  topology: [
    { node: 'edge-gateway-01', role: 'API Proxy', state: 'ONLINE', p99: '18ms' },
    { node: 'auth-service-k8s', role: 'Compute Blade', state: 'HEALTHY', p99: '24ms' },
    { node: 'order-processing-v2', role: 'Worker Array', state: 'HEALTHY', p99: '31ms' },
    { node: 'aurora-cluster-primary', role: 'DB Platter', state: 'REPLICATED', p99: '12ms' },
  ],
};

export function SpecMatrix() {
  const [hudTab, setHudTab] = useState<'telemetry' | 'geometry' | 'topology'>('telemetry');

  return (
    <section className="relative border-t border-slate-200 dark:border-[#1E273A] bg-slate-50/70 dark:bg-[#07080B]/80 py-28 px-6 lg:px-16 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-hidden">
      {/* CAD Calibration Crossmarks */}
      <div className="absolute top-6 left-6 font-mono text-xs text-slate-300 dark:text-[#1E273A] pointer-events-none select-none">
        +
      </div>
      <div className="absolute top-6 right-6 font-mono text-xs text-slate-300 dark:text-[#1E273A] pointer-events-none select-none">
        +
      </div>
      <div className="absolute bottom-6 left-6 font-mono text-xs text-slate-300 dark:text-[#1E273A] pointer-events-none select-none">
        +
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-xs text-slate-300 dark:text-[#1E273A] pointer-events-none select-none">
        +
      </div>

      <div className="mx-auto max-w-7xl">
        {/* Section Heading Monolith */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-12 border-b border-slate-200 dark:border-[#1E273A]">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 font-mono text-xs text-cyan-600 dark:text-cyan-400 font-semibold tracking-wider uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>[ SEC.02 // ARCHITECTURAL SPECIFICATION MATRIX ]</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
              ENGINEERED FOR COMPLEX SYSTEMS AT SCALE.
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            Eliminate diagram rot and cognitive fragmentation. Transform flat 2D schemas into living
            spatial twins for architecture reviews, incident forensics, and topology inspection.
          </p>
        </div>

        {/* Primary Feature & Interactive HUD Grid */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Interactive Technical Console HUD */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14] p-6 sm:p-7 shadow-sm flex flex-col justify-between relative">
            <div>
              {/* HUD Console Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E273A] pb-4">
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold">
                  <Terminal className="h-4 w-4" />
                  <span>SEC.02.00 // DIAGRAM3D RUNTIME CONSOLE</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>SYSTEM_HEALTHY</span>
                </div>
              </div>

              {/* HUD Mode Tabs */}
              <div className="flex items-center gap-2 pt-4 pb-3 font-mono text-[11px]">
                <button
                  onClick={() => setHudTab('telemetry')}
                  data-cursor="pointer"
                  className={`px-3 py-1.5 rounded border transition-colors ${
                    hudTab === 'telemetry'
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  TELEMETRY_LOG
                </button>
                <button
                  onClick={() => setHudTab('geometry')}
                  data-cursor="pointer"
                  className={`px-3 py-1.5 rounded border transition-colors ${
                    hudTab === 'geometry'
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  GEOMETRY_BUFFER
                </button>
                <button
                  onClick={() => setHudTab('topology')}
                  data-cursor="pointer"
                  className={`px-3 py-1.5 rounded border transition-colors ${
                    hudTab === 'topology'
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  TOPOLOGY_MAP
                </button>
              </div>

              {/* Console Screen Body */}
              <div className="rounded-lg border border-slate-200 dark:border-[#1E273A] bg-slate-100/80 dark:bg-[#05070B] p-4 font-mono text-xs min-h-[220px]">
                {hudTab === 'telemetry' && (
                  <div className="space-y-2">
                    {HUD_LOGS.telemetry.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 leading-relaxed text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 select-none">{log.time}</span>
                        <span className="text-cyan-700 dark:text-cyan-400 font-semibold select-none">
                          [{log.tag}]
                        </span>
                        <span className="text-slate-800 dark:text-slate-300">{log.msg}</span>
                      </div>
                    ))}
                  </div>
                )}

                {hudTab === 'geometry' && (
                  <div className="space-y-2.5">
                    {HUD_LOGS.geometry.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-200 dark:border-[#1E273A]/60"
                      >
                        <span className="text-slate-600 dark:text-slate-400">{item.prop}:</span>
                        <span className="font-bold text-cyan-700 dark:text-cyan-300">{item.val}</span>
                      </div>
                    ))}
                  </div>
                )}

                {hudTab === 'topology' && (
                  <div className="space-y-2">
                    {HUD_LOGS.topology.map((node, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11px] p-1.5 rounded bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-[#1E273A]"
                      >
                        <div className="flex items-center gap-2">
                          <Cpu className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {node.node}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="text-slate-600 dark:text-slate-400">{node.role}</span>
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

            <div className="pt-6 border-t border-slate-100 dark:border-[#1E273A] mt-6 flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                ACTIVE PIPELINE // THREE.JS R174 // SHADERMATERIAL
              </span>
              <Link
                href="/studio"
                data-cursor="pointer"
                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors"
              >
                <span>OPEN_INSPECTOR</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: 4-Quadrant Capability Matrix */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.code}
                className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14]/90 p-5 sm:p-6 shadow-xs hover:border-cyan-500/40 transition-colors flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                      {cap.code}
                    </span>
                    <span className="font-mono text-[9px] tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#101520] px-2 py-0.5 rounded border border-slate-200 dark:border-[#1E273A]">
                      {cap.tag}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                    {cap.title}
                  </h4>

                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {cap.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-[#1E273A] flex items-baseline justify-between font-mono">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {cap.metric}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {cap.metricLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
