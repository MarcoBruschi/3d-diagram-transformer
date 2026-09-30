'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { useFeatureGating } from '@/hooks/useFeatureGating';
import { api } from '@/lib/services/apiClient';
import {
  X,
  GitCompare,
  PlusCircle,
  MinusCircle,
  Edit,
  Sparkles,
  Lock,
  Loader2,
} from 'lucide-react';

interface DiffSummary {
  addedNodes: any[];
  removedNodes: any[];
  modifiedNodes: any[];
}

export function ArchitectureDiffModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const openModal = useSaaSModalsStore((s) => s.openModal);
  const modalPayload = useSaaSModalsStore((s) => s.modalPayload);

  const { canUseVersionsDiff } = useFeatureGating();
  const diagram = useDiagramStore((s) => s.diagram);

  const [isLoading, setIsLoading] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<number[]>([1]);
  const [v1, setV1] = useState<number>(1);
  const [v2, setV2] = useState<number>(1);
  const [diffData, setDiffData] = useState<DiffSummary>({
    addedNodes: [],
    removedNodes: [],
    modifiedNodes: [],
  });

  // 1. Initialize versions dynamically on open
  useEffect(() => {
    if (activeModal === 'diff' && diagram?.id && canUseVersionsDiff) {
      let targetV2: number | null = null;
      if (typeof modalPayload?.compareVersion === 'number') {
        targetV2 = modalPayload.compareVersion;
      } else if (modalPayload?.compareVersion?.version) {
        targetV2 = modalPayload.compareVersion.version;
      } else if (modalPayload?.compareVersion?.versionNumber) {
        const parsed = parseInt(String(modalPayload.compareVersion.versionNumber).replace(/\D/g, '') || '', 10);
        if (!isNaN(parsed)) targetV2 = parsed;
      }

      api.diagrams
        .getVersions(diagram.id)
        .then((res: any) => {
          if (res && res.versions && res.versions.length > 0) {
            const versionsList: number[] = res.versions
              .map((v: any) => v.version || 1)
              .sort((a: number, b: number) => a - b);
            setAvailableVersions(versionsList);

            if (versionsList.length <= 1) {
              // Diagrama possui apenas versão 1: não solicitar versão 2
              setV1(1);
              setV2(1);
              setDiffData({ addedNodes: [], removedNodes: [], modifiedNodes: [] });
              return;
            }

            // Usar a versão de comparação indicada contra a versão anterior ou versão 1
            const chosenV2 = targetV2 && versionsList.includes(targetV2)
              ? targetV2
              : versionsList[versionsList.length - 1] || 1;
            const chosenV1 = versionsList.filter((v) => v < chosenV2).pop() || 1;

            setV1(chosenV1);
            setV2(chosenV2);
          } else {
            setAvailableVersions([1]);
            setV1(1);
            setV2(1);
            setDiffData({ addedNodes: [], removedNodes: [], modifiedNodes: [] });
          }
        })
        .catch(() => {
          setAvailableVersions([1]);
          setV1(1);
          setV2(1);
          setDiffData({ addedNodes: [], removedNodes: [], modifiedNodes: [] });
        });
    }
  }, [activeModal, diagram?.id, canUseVersionsDiff, modalPayload?.compareVersion]);

  // 2. Fetch diff whenever v1 or v2 changes (guarded against single-version diagrams)
  useEffect(() => {
    if (activeModal === 'diff' && diagram?.id && canUseVersionsDiff) {
      // Não solicitar diff da versão 2 se o diagrama tiver apenas versão 1 ou se v1 === v2
      if (availableVersions.length <= 1 || v1 === v2) {
        setIsLoading(false);
        setDiffData({ addedNodes: [], removedNodes: [], modifiedNodes: [] });
        return;
      }

      setIsLoading(true);
      api.diagrams
        .getDiff(diagram.id, v1, v2)
        .then((res: any) => {
          if (res && res.diff) {
            setDiffData({
              addedNodes: res.diff.nodesAdded || [],
              removedNodes: res.diff.nodesRemoved || [],
              modifiedNodes: res.diff.nodesModified || [],
            });
          }
        })
        .catch(() => {
          // If v1 === v2 or fetch error, handle client-side
          if (v1 === v2) {
            setDiffData({ addedNodes: [], removedNodes: [], modifiedNodes: [] });
          } else if (modalPayload?.compareVersion?.snapshotData?.nodes) {
            const oldNodes: any[] = modalPayload.compareVersion.snapshotData.nodes;
            const currentNodes: any[] = diagram.nodes;
            const oldIds = new Set(oldNodes.map((n) => n.id));
            const currentIds = new Set(currentNodes.map((n) => n.id));

            setDiffData({
              addedNodes: currentNodes.filter((n) => !oldIds.has(n.id)),
              removedNodes: oldNodes.filter((n) => !currentIds.has(n.id)),
              modifiedNodes: [],
            });
          } else {
            setDiffData({ addedNodes: [], removedNodes: [], modifiedNodes: [] });
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [activeModal, diagram?.id, canUseVersionsDiff, v1, v2, availableVersions.length, diagram.nodes, modalPayload?.compareVersion]);

  if (activeModal !== 'diff') return null;

  const totalChanges =
    diffData.addedNodes.length + diffData.removedNodes.length + diffData.modifiedNodes.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-[95vw] sm:w-[90vw] md:max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 sm:p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-500 shrink-0">
                <GitCompare className="h-5 w-5" />
              </div>
              <div className="truncate">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                  <span>Visual Architecture Diff 3D</span>
                  <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] text-sky-500 font-semibold shrink-0">
                    Code Review 3D
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Compare alterações estruturais, novos microsserviços e deleções entre snapshots
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-100 transition-colors shrink-0"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Version Selector Bar */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 mb-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Base (v1):</span>
              <select
                value={v1}
                onChange={(e) => setV1(Number(e.target.value))}
                disabled={availableVersions.length <= 1}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-slate-100 font-bold outline-none cursor-pointer disabled:opacity-50"
              >
                {availableVersions.map((v) => (
                  <option key={`base-${v}`} value={v}>
                    v{v}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-400 font-bold">➔</span>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Comparar (v2):</span>
              <select
                value={v2}
                onChange={(e) => setV2(Number(e.target.value))}
                disabled={availableVersions.length <= 1}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-slate-100 font-bold outline-none cursor-pointer disabled:opacity-50"
              >
                {availableVersions.map((v) => (
                  <option key={`target-${v}`} value={v}>
                    v{v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {availableVersions.length <= 1 && (
            <div className="mb-4 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-500 dark:text-sky-400 flex items-center gap-2">
              <GitCompare className="h-4 w-4 shrink-0" />
              <span>O diagrama possui apenas a versão 1. Crie novas versões/snapshots para habilitar a comparação estrutural entre versões.</span>
            </div>
          )}

          {/* STRICT PLAN GATE FOR FREE PLAN */}
          {!canUseVersionsDiff ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-6">
              <div className="h-14 w-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 mb-4 shadow-sm">
                <Lock className="h-7 w-7" />
              </div>
              <span className="rounded-full bg-sky-500/20 text-sky-400 px-3 py-0.5 text-[10px] font-bold uppercase mb-2">
                Exclusivo Pro & Enterprise
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                Visual Architecture Diff em 3D
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed max-w-md">
                A visualização comparativa de alterações em 3D e changelog estrutural requer o plano Pro. Desbloqueie revisões de código de infraestrutura, auditoria de mudanças e rollbacks.
              </p>
              <button
                onClick={() => openModal('billing')}
                className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 font-bold text-white text-xs shadow-lg shadow-sky-500/25 hover:bg-sky-500 transition-all active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>Fazer Upgrade para Pro (R$ 69/mês)</span>
              </button>
            </div>
          ) : (
            <>
              {/* Diff Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                  <span className="text-[10px] uppercase text-emerald-400 block font-semibold">+ Adições</span>
                  <span className="text-xl font-black text-emerald-400">+{diffData.addedNodes.length}</span>
                </div>

                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center">
                  <span className="text-[10px] uppercase text-rose-400 block font-semibold">- Remoções</span>
                  <span className="text-xl font-black text-rose-400">-{diffData.removedNodes.length}</span>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
                  <span className="text-[10px] uppercase text-amber-400 block font-semibold">~ Modificações</span>
                  <span className="text-xl font-black text-amber-400">~{diffData.modifiedNodes.length}</span>
                </div>
              </div>

              {/* Detailed Changes List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">
                    Mudanças Estruturais ({totalChanges})
                  </span>
                  {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />}
                </div>

                {totalChanges === 0 && !isLoading && (
                  <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                    Nenhuma divergência estrutural detectada em relação ao snapshot comparado. A arquitetura está sincronizada.
                  </div>
                )}

                {diffData.addedNodes.map((item, idx) => (
                  <div
                    key={`add-${idx}`}
                    className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/5 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <PlusCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Nó 3D: {item.name || item.id}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.description || `Componente do tipo «${item.type || 'serviço'}» inserido na topologia.`}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                      + ADICIONADO
                    </span>
                  </div>
                ))}

                {diffData.removedNodes.map((item, idx) => (
                  <div
                    key={`rem-${idx}`}
                    className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/5 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <MinusCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Nó 3D: {item.name || item.id}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Componente removido da topologia na versão atual.
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 shrink-0">
                      - REMOVIDO
                    </span>
                  </div>
                ))}

                {diffData.modifiedNodes.map((item, idx) => (
                  <div
                    key={`mod-${idx}`}
                    className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/5 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <Edit className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Nó 3D: {item.to?.name || item.name || 'Componente'}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Propriedades ou metadados de rede atualizados.
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                      ~ MODIFICADO
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer Action */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Revisão visual 3D sincronizada
                </span>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition-colors shadow-md min-h-[44px] flex items-center justify-center"
                >
                  Fechar Revisão
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
