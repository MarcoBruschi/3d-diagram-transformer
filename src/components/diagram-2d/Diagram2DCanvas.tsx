'use client';

import React, { useState, useRef } from 'react';
import { useDiagramStore } from '@/store/useDiagramStore';
import { NODE_VISUALS } from '@/lib/mappings/nodeTypes';
import { useLayersStore } from '@/store/useLayersStore';
import { useThemeStore } from '@/store/useThemeStore';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export function Diagram2DCanvas() {
  const diagram = useDiagramStore((s) => s.diagram);
  const selectedNodeId = useDiagramStore((s) => s.selectedNodeId);
  const hoveredNodeId = useDiagramStore((s) => s.hoveredNodeId);
  const selectNode = useDiagramStore((s) => s.selectNode);
  const hoverNode = useDiagramStore((s) => s.hoverNode);
  const layers = useLayersStore((s) => s.layers);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas directly
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'grid-bg') {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-slate-100 dark:bg-[#07080B] select-none transition-colors duration-200"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 2D Zoom / Pan Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-1 backdrop-blur-md shadow-lg">
        <button
          onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
          className="rounded p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
          className="rounded p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
        <button
          onClick={resetView}
          className="rounded p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          title="Reset View"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <span className="px-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
          {Math.round(scale * 100)}%
        </span>
      </div>

      <svg
        className="h-full w-full cursor-grab active:cursor-grabbing"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <defs>
          {/* Technical CAD Grid Pattern */}
          <pattern id="cad-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={isDark ? '#1E293B' : '#E2E8F0'}
              strokeWidth="0.8"
              opacity={isDark ? 0.6 : 0.8}
            />
            <path
              d="M 200 0 L 0 0 0 200"
              fill="none"
              stroke={isDark ? '#334155' : '#CBD5E1'}
              strokeWidth="1"
              opacity={isDark ? 0.4 : 0.6}
            />
          </pattern>

          {/* Connection Arrow Markers */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8" />
          </marker>

          <marker
            id="arrow-dim"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
          </marker>
        </defs>

        {/* CAD Grid Background */}
        <rect id="grid-bg" width="100%" height="100%" fill="url(#cad-grid)" />

        {/* Connections Layer */}
        {layers.connections &&
          diagram.connections.map((conn) => {
            const source = diagram.nodes.find((n) => n.id === conn.source);
            const target = diagram.nodes.find((n) => n.id === conn.target);
            if (!source || !target) return null;

            const { x: sx = 200, y: sy = 100 } = source.position2D || {};
            const { x: tx = 200, y: ty = 100 } = target.position2D || {};

            const x1 = sx + 80;
            const y1 = sy + 40;
            const x2 = tx + 80;
            const y2 = ty + 40;

            const isHighlighted =
              selectedNodeId === conn.source ||
              selectedNodeId === conn.target ||
              hoveredNodeId === conn.source ||
              hoveredNodeId === conn.target;

            // Orthogonal / cubic Bezier path
            const midY = (y1 + y2) / 2;
            const pathData = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

            return (
              <g key={conn.id}>
                {/* Glow underlay when highlighted */}
                {isHighlighted && (
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="6"
                    opacity="0.3"
                  />
                )}

                {/* Base connection wire */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isHighlighted ? '#38BDF8' : '#334155'}
                  strokeWidth={isHighlighted ? '2.5' : '1.5'}
                  strokeDasharray={isHighlighted ? '6 4' : 'none'}
                  markerEnd={isHighlighted ? 'url(#arrow)' : 'url(#arrow-dim)'}
                  className={isHighlighted ? 'animate-pulse' : ''}
                />

                {/* Connection Label */}
                {conn.label && (
                  <text
                    x={(x1 + x2) / 2}
                    y={midY - 8}
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {conn.label}
                  </text>
                )}
              </g>
            );
          })}

        {/* Nodes Layer */}
        {diagram.nodes.map((node) => {
          const visual = NODE_VISUALS[node.type] || NODE_VISUALS.generic;
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;

          const { x = 200, y = 100 } = node.position2D || {};
          const width = 160;
          const height = 80;

          return (
            <g
              key={node.id}
              transform={`translate(${x}, ${y})`}
              className="cursor-pointer transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                selectNode(node.id);
              }}
              onMouseEnter={() => hoverNode(node.id)}
              onMouseLeave={() => hoverNode(null)}
            >
              {/* Outer Glow Bracket */}
              {isSelected && (
                <rect
                  x="-4"
                  y="-4"
                  width={width + 8}
                  height={height + 8}
                  rx="10"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2"
                  className="animate-pulse"
                />
              )}

              {/* Node Body Card */}
              <rect
                x="0"
                y="0"
                width={width}
                height={height}
                rx="8"
                fill={isSelected ? (isDark ? '#0F172A' : '#F0F9FF') : isDark ? '#0B0F19' : '#FFFFFF'}
                stroke={isSelected ? '#0284C7' : isHovered ? (isDark ? '#64748B' : '#94A3B8') : isDark ? '#1E293B' : '#E2E8F0'}
                strokeWidth={isSelected ? '2' : '1.2'}
                className="transition-colors shadow-xs"
              />

              {/* Header Bar Accent */}
              <rect
                x="0"
                y="0"
                width={width}
                height="6"
                rx="3"
                fill={visual.color}
              />

              {/* Status Dot */}
              <circle
                cx="16"
                cy="24"
                r="4"
                fill={
                  node.status === 'active'
                    ? '#10B981'
                    : node.status === 'warning'
                    ? '#F59E0B'
                    : node.status === 'error'
                    ? '#F43F5E'
                    : '#64748B'
                }
              />

              {/* Node Title */}
              <text
                x="28"
                y="28"
                fill={isDark ? '#F8FAFC' : '#0F172A'}
                fontSize="12"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                {node.name.length > 16 ? node.name.slice(0, 15) + '…' : node.name}
              </text>

              {/* Type Badge */}
              <text
                x="14"
                y="48"
                fill={visual.color}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="500"
              >
                {visual.badgeLabel}
              </text>

              {/* Micro Metrics Line */}
              <text
                x="14"
                y="66"
                fill="#64748B"
                fontSize="9"
                fontFamily="monospace"
              >
                {node.metrics?.latency ? `${node.metrics.latency}ms` : '0ms'} •{' '}
                {node.metrics?.requestsPerSec ? `${node.metrics.requestsPerSec} RPS` : 'idle'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
