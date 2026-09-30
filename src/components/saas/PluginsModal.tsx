'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import {
  X,
  Puzzle,
  Check,
  Download,
  ExternalLink,
  Code,
  Layers,
  Sparkles,
} from 'lucide-react';

interface PluginItem {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
}

const INITIAL_PLUGINS: PluginItem[] = [
  {
    id: 'plug-c4',
    name: 'C4 Model Architecture Engine',
    category: 'Modelagem Formal',
    description: 'Navegação hierárquica por níveis Context, Container, Component e Code com zoom semântico.',
    version: 'v2.4.0',
    author: 'Simon Brown Community',
    enabled: true,
  },
  {
    id: 'plug-archimate',
    name: 'ArchiMate 3.2 Open Standards',
    category: 'Standards',
    description: 'Suporte a notações oficiais ArchiMate (Business, Application e Technology Layers).',
    version: 'v1.8.1',
    author: 'The Open Group',
    enabled: false,
  },
  {
    id: 'plug-custom-mesh',
    name: 'Three.js Custom 3D Mesh SDK',
    category: 'Render Engine',
    description: 'Permite carregar arquivos .GLB customizados de hardware, servlets e equipamentos industriais.',
    version: 'v3.0.0',
    author: 'Core 3D Team',
    enabled: true,
  },
  {
    id: 'plug-structurizr',
    name: 'Structurizr DSL Importer',
    category: 'Importador',
    description: 'Importação direta de arquivos workspace.dsl para geração instantânea da cena 3D.',
    version: 'v1.2.0',
    author: 'Dev Community',
    enabled: false,
  },
];

export function PluginsModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);

  const [plugins, setPlugins] = useState<PluginItem[]>(INITIAL_PLUGINS);

  if (activeModal !== 'plugins') return null;

  const togglePlugin = (id: string) => {
    setPlugins(
      plugins.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-500">
                <Puzzle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Plugins, Extensões & SDK 3D</span>
                  <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] text-sky-500 font-semibold">
                    Extensibilidade
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Amplie o estúdio com padrões C4 Model, ArchiMate, importadores DSL e modelos 3D proprietários
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

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {plugins.map((plug) => (
              <div
                key={plug.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{plug.name}</span>
                    <span className="text-[9px] rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 text-slate-600 dark:text-slate-400 uppercase">
                      {plug.category}
                    </span>
                    <span className="text-[9px] text-slate-400">{plug.version}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{plug.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePlugin(plug.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      plug.enabled
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                    }`}
                  >
                    {plug.enabled ? 'Ativo' : 'Instalar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
