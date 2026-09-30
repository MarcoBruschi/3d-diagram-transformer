'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { PRESET_DIAGRAMS } from '@/data/presets';
import {
  X,
  LayoutTemplate,
  Search,
  ArrowRight,
  Sparkles,
  Cloud,
  Cpu,
  Radio,
  Layers,
  Check,
} from 'lucide-react';

import { api } from '@/lib/services/apiClient';

export function TemplatesModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const setDiagram = useDiagramStore((s) => s.setDiagram);
  const loadPreset = useDiagramStore((s) => s.loadPreset);
  const currentDiagram = useDiagramStore((s) => s.diagram);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>(PRESET_DIAGRAMS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeModal === 'templates') {
      setIsLoading(true);
      fetch(`/api/templates?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.templates && data.templates.length > 0) {
            setTemplates(data.templates);
          } else {
            setTemplates(PRESET_DIAGRAMS);
          }
        })
        .catch(() => {
          setTemplates(PRESET_DIAGRAMS);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [activeModal, selectedCategory, searchQuery]);

  if (activeModal !== 'templates') return null;

  const CATEGORIES = [
    { id: 'all', label: 'Todos' },
    { id: 'cloud', label: 'Cloud & Web' },
    { id: 'ai', label: 'Inteligência Artificial' },
    { id: 'iot', label: 'IoT & Hardware' },
    { id: 'enterprise', label: 'Microsserviços' },
  ];

  const filteredPresets = templates.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleApplyTemplate = (item: any) => {
    setLoadedId(item.id);
    if (item.data) {
      setDiagram(item.data);
    } else {
      loadPreset(item.id);
    }
    setTimeout(() => {
      setLoadedId(null);
      closeModal();
    }, 800);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200 max-h-[88vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-500">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Galeria de Templates & Marketplace</span>
                  <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] text-sky-500 font-semibold">
                    Prontos para Produção
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Arquiteturas de referência pré-modeladas com telemetria, conexões e topologias 3D comprovadas
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por AWS, Kubernetes, RAG, Kafka..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1">
            {filteredPresets.map((preset) => {
              const isCurrent = currentDiagram.id === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-sky-500 bg-sky-500/5'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-sky-400" />
                        <span>{preset.name}</span>
                      </span>
                      <span className="text-[10px] rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                        {preset.type}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {preset.description || 'Arquitetura tridimensional pré-configurada para produção.'}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                      <span>{(preset.nodes || preset.data?.nodes)?.length || 8} Componentes 3D</span>
                      <span>•</span>
                      <span>{(preset.connections || preset.data?.connections)?.length || 6} Conexões Ativas</span>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => handleApplyTemplate(preset)}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                        loadedId === preset.id
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'border border-sky-500 text-sky-400 bg-sky-500/10'
                          : 'bg-sky-600 text-white hover:bg-sky-500'
                      }`}
                    >
                      {loadedId === preset.id ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Template Carregado!</span>
                        </>
                      ) : isCurrent ? (
                        <span>Carregado no Studio</span>
                      ) : (
                        <>
                          <span>Usar Este Template</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
