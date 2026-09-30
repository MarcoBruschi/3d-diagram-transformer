'use client';

import React, { useState, useEffect } from 'react';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useCameraStore } from '@/store/useCameraStore';
import { useLayersStore } from '@/store/useLayersStore';
import { PRESET_DIAGRAMS } from '@/data/presets';
import { useRouter } from 'next/navigation';
import {
  Search,
  Box,
  FileCode,
  Columns,
  Maximize2,
  Video,
  Layers,
  ArrowRight,
  Database,
  Server,
  Cloud,
  X,
  BookOpen,
} from 'lucide-react';

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const diagram = useDiagramStore((s) => s.diagram);
  const selectNode = useDiagramStore((s) => s.selectNode);
  const setViewMode = useDiagramStore((s) => s.setViewMode);
  const loadPreset = useDiagramStore((s) => s.loadPreset);

  const resetCamera = useCameraStore((s) => s.resetCamera);
  const focusOnNode = useCameraStore((s) => s.focusOnNode);
  const toggleCinematic = useCameraStore((s) => s.toggleCinematic);

  const toggleLayer = useLayersStore((s) => s.toggleLayer);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!open) return null;

  const filteredNodes = diagram.nodes.filter(
    (n) =>
      n.name.toLowerCase().includes(query.toLowerCase()) ||
      n.type.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4 font-mono"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300">
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes, actions, or load architecture..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
            autoFocus
          />
          <kbd className="rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500 dark:text-slate-400">ESC</kbd>
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors"
            title="Fechar (Esc ou clique fora)"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Actions */}
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 px-2">Quick Actions</span>
            <div className="mt-1 space-y-0.5">
              <button
                onClick={() => {
                  setViewMode('3d');
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Box className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Switch to 3D View</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
              </button>

              <button
                onClick={() => {
                  setViewMode('2d');
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileCode className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Switch to 2D Schematic View</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
              </button>

              <button
                onClick={() => {
                  setViewMode('split');
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Columns className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Switch to Split Comparison Mode</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
              </button>

              <button
                onClick={() => {
                  resetCamera();
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Maximize2 className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Reset Camera to Overview</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
              </button>

              <button
                onClick={() => {
                  toggleCinematic();
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Video className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                  <span>Toggle Cinematic Camera Rotation</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
              </button>

              <button
                onClick={() => {
                  router.push('/tutorial');
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                  <span>Abrir Tutorial & Guia da Ferramenta</span>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
          </div>

          {/* Architecture Presets */}
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 px-2">Load Architecture</span>
            <div className="mt-1 space-y-0.5">
              {PRESET_DIAGRAMS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    loadPreset(preset.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Cloud className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span>{preset.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{preset.nodes.length} nodes</span>
                </button>
              ))}
            </div>
          </div>

          {/* Matching System Nodes */}
          {filteredNodes.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 px-2">Nodes in Diagram</span>
              <div className="mt-1 space-y-0.5">
                {filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => {
                      selectNode(node.id);
                      if (node.position3D) focusOnNode(node.position3D);
                      setOpen(false);
                    }}
                    className="w-full flex items-center justify-between rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-500 dark:bg-sky-400" />
                      <span className="font-semibold">{node.name}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px]">({node.type})</span>
                    </div>
                    <span className="text-[10px] text-sky-600 dark:text-sky-400">Focus →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
