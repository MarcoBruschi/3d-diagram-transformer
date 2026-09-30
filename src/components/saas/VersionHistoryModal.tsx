'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { useFeatureGating } from '@/hooks/useFeatureGating';
import { api } from '@/lib/services/apiClient';
import {
  X,
  History,
  GitCommit,
  RotateCcw,
  Sparkles,
  GitCompare,
  Clock,
  Check,
  Tag,
  Loader2,
  Lock,
} from 'lucide-react';

interface DiagramVersion {
  id: string;
  versionNumber: string;
  name: string;
  author: string;
  timestamp: string;
  changesSummary: string;
  nodeCount: number;
  connectionCount: number;
  snapshotData?: any;
}

export function VersionHistoryModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const openModal = useSaaSModalsStore((s) => s.openModal);

  const { canUseVersionsDiff } = useFeatureGating();

  const diagram = useDiagramStore((s) => s.diagram);
  const setDiagram = useDiagramStore((s) => s.setDiagram);

  const [versions, setVersions] = useState<DiagramVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<DiagramVersion | null>(null);
  const [restoredId, setRestoredId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeModal === 'versions' && diagram?.id && canUseVersionsDiff) {
      setIsLoading(true);
      api.diagrams
        .getVersions(diagram.id)
        .then((res) => {
          if (res && res.versions && res.versions.length > 0) {
            const mapped: DiagramVersion[] = res.versions.map((v: any, idx: number) => ({
              id: v.id || `ver-${v.version || idx}`,
              versionNumber: `v${v.version || idx + 1}${idx === 0 ? ' (Atual)' : ''}`,
              name: v.message || v.name || `Snapshot #${v.version || idx + 1}`,
              author: v.creator?.name || v.creator?.email?.split('@')[0] || 'Autor',
              timestamp: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'Recente',
              changesSummary: `${v.nodeCount || diagram.nodes.length} nós registrados no snapshot.`,
              nodeCount: v.nodeCount || diagram.nodes.length,
              connectionCount: diagram.connections.length,
              snapshotData: v.data,
            }));
            setVersions(mapped);
            setSelectedVersion(mapped[0]);
          } else {
            setVersions([]);
            setSelectedVersion(null);
          }
        })
        .catch(() => {
          setVersions([]);
          setSelectedVersion(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [activeModal, diagram?.id, canUseVersionsDiff, diagram.nodes.length, diagram.connections.length]);

  if (activeModal !== 'versions') return null;

  const handleRestore = async (ver: DiagramVersion) => {
    setRestoredId(ver.id);

    try {
      if (ver.snapshotData) {
        setDiagram(ver.snapshotData);
      } else {
        const vNum = parseInt(ver.versionNumber.replace(/\D/g, '') || '1');
        const res = await api.diagrams.getVersionSnapshot(diagram.id, vNum);
        if (res && (res.snapshot?.data || res.snapshot)) {
          setDiagram(res.snapshot.data || res.snapshot);
        }
      }
    } catch {
      setDiagram(diagram);
    }

    setTimeout(() => {
      setRestoredId(null);
      closeModal();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-500">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Histórico de Versões & Snapshots</span>
                  <span className="rounded bg-violet-500/10 border border-violet-500/30 px-2 py-0.5 text-[10px] text-violet-400 font-semibold">
                    Cloud Storage
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compare alterações em 3D, reverta para pontos estáveis ou analise snapshots na nuvem
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

          {/* STRICT PLAN GATE FOR FREE PLAN */}
          {!canUseVersionsDiff ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-6">
              <div className="h-14 w-14 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-500 mb-4 shadow-sm">
                <Lock className="h-7 w-7" />
              </div>
              <span className="rounded-full bg-violet-500/20 text-violet-400 px-3 py-0.5 text-[10px] font-bold uppercase mb-2">
                Exclusivo Pro & Enterprise
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                Histórico de Versões com Visual Diff 3D
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed max-w-md">
                O plano Free armazena apenas a versão ativa. Faça upgrade para o plano Pro para salvar snapshots ilimitados, restaurar versões anteriores e comparar diffs visuais em 3D.
              </p>
              <button
                onClick={() => openModal('billing')}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-bold text-white text-xs shadow-lg shadow-violet-500/25 hover:bg-violet-500 transition-all active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>Desbloquear Histórico de Versões (Fazer Upgrade)</span>
              </button>
            </div>
          ) : (
            /* Main Layout: List + Preview */
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
              {/* Version List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">
                    Snapshots Registrados ({versions.length})
                  </span>
                  {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />}
                </div>

                {versions.length === 0 && !isLoading && (
                  <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                    Nenhum snapshot anterior gravado ainda para este diagrama. Novas versões são geradas automaticamente ao salvar alterações.
                  </div>
                )}

                {versions.map((ver) => {
                  const isSelected = selectedVersion?.id === ver.id;
                  return (
                    <div
                      key={ver.id}
                      onClick={() => setSelectedVersion(ver)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-violet-500 bg-violet-500/10 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <GitCommit className="h-3.5 w-3.5 text-violet-400" />
                          <span>{ver.versionNumber}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{ver.timestamp}</span>
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                        {ver.name}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                        <span>Por: {ver.author}</span>
                        <span>{ver.nodeCount} nós • {ver.connectionCount} links</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Version Details & Actions */}
              {selectedVersion ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-violet-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Detalhes de {selectedVersion.versionNumber}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                      {selectedVersion.name}
                    </h4>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 mb-4">
                      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">
                          Changelog Visual
                        </span>
                        <p>{selectedVersion.changesSummary}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 block">Total de Nós:</span>
                          <strong className="text-slate-800 dark:text-slate-100">{selectedVersion.nodeCount}</strong>
                        </div>
                        <div className="p-2 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400 block">Total de Conexões:</span>
                          <strong className="text-slate-800 dark:text-slate-100">{selectedVersion.connectionCount}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => openModal('diff', { compareVersion: selectedVersion })}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow hover:bg-violet-500 transition-colors"
                    >
                      <GitCompare className="h-3.5 w-3.5" />
                      <span>Comparar Visualmente em 3D (Diff)</span>
                    </button>

                    <button
                      onClick={() => handleRestore(selectedVersion)}
                      disabled={restoredId === selectedVersion.id}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-white transition-colors"
                    >
                      {restoredId === selectedVersion.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Versão Restaurada!</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restaurar Esta Versão</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 flex items-center justify-center text-xs text-slate-400">
                  Selecione uma versão na lista para inspecionar ou restaurar
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
