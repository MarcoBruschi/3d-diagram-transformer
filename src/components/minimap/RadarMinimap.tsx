'use client';

import React, { useState } from 'react';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useCameraStore } from '@/store/useCameraStore';
import { NODE_VISUALS } from '@/lib/mappings/nodeTypes';
import { Compass, Minimize2, Maximize2 } from 'lucide-react';

import { useThemeStore } from '@/store/useThemeStore';

export function RadarMinimap() {
  const diagram = useDiagramStore((s) => s.diagram);
  const selectedNodeId = useDiagramStore((s) => s.selectedNodeId);
  const selectNode = useDiagramStore((s) => s.selectNode);
  const focusOnNode = useCameraStore((s) => s.focusOnNode);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [minimized, setMinimized] = useState(false);

  // Normalization range: map world [-6, 6] to SVG viewBox [10, 130]
  const mapCoord = (val = 0, min = -6, max = 6, outMin = 15, outMax = 125) => {
    const clamped = Math.max(min, Math.min(max, val));
    return outMin + ((clamped - min) / (max - min)) * (outMax - outMin);
  };

  const gridStroke = isDark ? '#1E273A' : '#CBD5E1';

  return (
    <div className="hidden md:block absolute bottom-6 left-6 z-20 font-mono select-none">
      <div className="rounded-2xl border border-slate-300/80 dark:border-[#1E273A] bg-white/95 dark:bg-[#0B0E14]/95 p-2.5 shadow-2xl backdrop-blur-2xl transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-1 pb-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-sky-400" />
            <span className="font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">Radar 3D</span>
          </div>
          <button
            onClick={() => setMinimized(!minimized)}
            className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
          >
            {minimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </button>
        </div>

        {!minimized && (
          <div className="relative h-32 w-32 rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-100/90 dark:bg-[#07080B] overflow-hidden">
            <svg viewBox="0 0 140 140" className="h-full w-full">
              {/* Radar Concentric Rings */}
              <circle cx="70" cy="70" r="60" fill="none" stroke={gridStroke} strokeWidth="1" />
              <circle cx="70" cy="70" r="40" fill="none" stroke={gridStroke} strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="70" cy="70" r="20" fill="none" stroke={gridStroke} strokeWidth="1" />

              {/* Crosshairs */}
              <line x1="70" y1="10" x2="70" y2="130" stroke={gridStroke} strokeWidth="1" />
              <line x1="10" y1="70" x2="130" y2="70" stroke={gridStroke} strokeWidth="1" />

              {/* Connection Lines */}
              {diagram.connections.map((conn) => {
                const sNode = diagram.nodes.find((n) => n.id === conn.source);
                const tNode = diagram.nodes.find((n) => n.id === conn.target);
                if (!sNode || !tNode) return null;

                const sx = mapCoord(sNode.position3D?.x, -6, 6);
                const sz = mapCoord(sNode.position3D?.z, -6, 6);
                const tx = mapCoord(tNode.position3D?.x, -6, 6);
                const tz = mapCoord(tNode.position3D?.z, -6, 6);

                return (
                  <line
                    key={conn.id}
                    x1={sx}
                    y1={sz}
                    x2={tx}
                    y2={tz}
                    stroke="#334155"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                );
              })}

              {/* Node Blips */}
              {diagram.nodes.map((node) => {
                const x = mapCoord(node.position3D?.x, -6, 6);
                const z = mapCoord(node.position3D?.z, -6, 6);
                const isSelected = selectedNodeId === node.id;
                const visual = NODE_VISUALS[node.type] || NODE_VISUALS.generic;

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer"
                    onClick={() => {
                      selectNode(node.id);
                      if (node.position3D) focusOnNode(node.position3D);
                    }}
                  >
                    {isSelected && (
                      <circle cx={x} cy={z} r="7" fill="none" stroke="#38BDF8" strokeWidth="1.5" className="animate-ping" />
                    )}
                    <circle
                      cx={x}
                      cy={z}
                      r={isSelected ? '4' : '3'}
                      fill={visual.color}
                      stroke="#0F172A"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
