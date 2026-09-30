'use client';

import React from 'react';
import { Html } from '@react-three/drei';
import { DiagramNode } from '@/types/diagram';
import { NODE_VISUALS } from '@/lib/mappings/nodeTypes';
import { useLayersStore } from '@/store/useLayersStore';

interface NodeLabelProps {
  node: DiagramNode;
  isHovered: boolean;
  isSelected: boolean;
}

export function NodeLabel({ node, isHovered, isSelected }: NodeLabelProps) {
  const labelsVisible = useLayersStore((s) => s.layers.labels);
  if (!labelsVisible) return null;

  const visual = NODE_VISUALS[node.type] || NODE_VISUALS.generic;

  const statusColors = {
    active: 'bg-emerald-400',
    idle: 'bg-slate-400',
    warning: 'bg-amber-400 animate-pulse',
    error: 'bg-rose-500 animate-ping',
    offline: 'bg-slate-600',
    loading: 'bg-violet-400',
    selected: 'bg-sky-400',
  };

  // Anti-collision altitude offset based on node id
  const altitudeOffset = 1.25 + ((node.id.charCodeAt(0) % 3) * 0.22);

  return (
    <Html
      position={[0, altitudeOffset, 0]}
      center
      distanceFactor={14}
      zIndexRange={[10, 0]}
      style={{
        transition: 'all 0.15s ease-out',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div
        className={`flex flex-col items-center whitespace-nowrap rounded-xl px-2 py-1 text-center font-mono shadow-2xl backdrop-blur-xl transition-all max-w-[220px] ${
          isSelected
            ? 'border border-sky-400 bg-white/95 dark:bg-[#0B0E14]/98 shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-2 ring-sky-500/40'
            : isHovered
            ? 'border border-sky-500/50 bg-white/95 dark:bg-[#101520]/95 scale-105'
            : 'border border-slate-200/80 dark:border-[#1E273A] bg-white/90 dark:bg-[#0B0E14]/90'
        }`}
      >
        <div className="flex items-center gap-1.5 max-w-full">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColors[node.status] || 'bg-emerald-400'}`} />
          <span className="text-[11px] font-semibold tracking-wide text-slate-800 dark:text-slate-100 truncate">{node.name}</span>
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-[9px] text-slate-500 dark:text-slate-400 truncate">
          <span style={{ color: visual.color }} className="font-semibold">{visual.badgeLabel}</span>
          {node.metrics?.latency && (
            <>
              <span>•</span>
              <span className="text-slate-600 dark:text-slate-300 font-mono">{node.metrics.latency}ms</span>
            </>
          )}
        </div>
      </div>
    </Html>
  );
}

