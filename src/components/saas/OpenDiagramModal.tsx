'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { api } from '@/lib/services/apiClient';
import { useFeatureGating } from '@/hooks/useFeatureGating';
import { useAuthStore } from '@/store/useAuthStore';
import { useCollaborationStore } from '@/store/useCollaborationStore';
import {
  X,
  FolderOpen,
  Search,
  Plus,
  Trash2,
  Copy,
  Clock,
  Layers,
  ArrowRight,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Share2,
  User,
  Building2,
  Users,
} from 'lucide-react';

export interface ActiveViewer {
  id: string;
  name: string;
  avatarUrl?: string;
  color?: string;
}

interface DiagramItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  updatedAt: string;
  nodeCount: number;
  connectionCount: number;
  data: any;
  createdBy?: string;
  creator?: { id: string; name?: string; email?: string };
  isPersonal?: boolean;
  activeViewers?: ActiveViewer[];
}

export function OpenDiagramModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const openModal = useSaaSModalsStore((s) => s.openModal);
  const setDiagram = useDiagramStore((s) => s.setDiagram);
  const currentDiagramId = useDiagramStore((s) => s.diagram.id);
  const { isFree, maxCloudDiagrams } = useFeatureGating();
  const user = useAuthStore((s) => s.user);
  const peers = useCollaborationStore((s) => s.peers);

  const [filterTab, setFilterTab] = useState<'all' | 'personal' | 'workspace'>('all');
  const [search, setSearch] = useState('');
  const [diagrams, setDiagrams] = useState<DiagramItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCreateNewDiagram = () => {
    if (isFree && diagrams.length >= maxCloudDiagrams) {
      closeModal();
      openModal('billing');
      return;
    }
    const newId = `diag-${Date.now()}`;
    const newDiagram = {
      id: newId,
      name: 'Novo Diagrama de Arquitetura',
      description: 'Diagrama em branco criado no Studio',
      type: 'cloud',
      nodes: [],
      connections: [],
    };
    setDiagram(newDiagram as any, null);
    closeModal();
  };

  const fetchDiagrams = async () => {
    setIsLoading(true);
    try {
      const res = await api.diagrams.list({ search });
      if (res && res.data && res.data.length > 0) {
        const mapped: DiagramItem[] = res.data.map((d: any) => {
          let rawViewers: any[] = d.activeViewers || [];
          let viewers: ActiveViewer[] = rawViewers.map((v: any, idx: number) => ({
            id: v.id || v.userId || `viewer-${d.id}-${idx}`,
            name: v.name || 'Usuário',
            color: v.color || '#10b981',
          }));

          if (currentDiagramId === d.id && peers.length > 0) {
            const peerViewers: ActiveViewer[] = peers.map((p, idx) => ({
              id: p.id || `peer-${idx}`,
              name: p.name,
              color: p.color,
            }));
            const existingIds = new Set(viewers.map((v) => v.id));
            const merged = [...viewers];
            for (const pv of peerViewers) {
              if (!existingIds.has(pv.id)) {
                merged.push(pv);
              }
            }
            viewers = merged;
          }

          return {
            id: d.id,
            name: d.name || 'Diagrama Sem Título',
            description: d.description || 'Arquitetura na nuvem',
            type: d.type || 'cloud',
            updatedAt: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('pt-BR') : 'Recentemente',
            nodeCount: d.nodeCount ?? (d.data?.nodes?.length || 0),
            connectionCount: d.connectionCount ?? (d.data?.connections?.length || 0),
            data: d.data || d,
            createdBy: d.createdBy,
            creator: d.creator,
            isPersonal: d.isPersonal ?? (d.type === 'personal'),
            activeViewers: viewers,
          };
        });
        setDiagrams(mapped);
      } else {
        setDiagrams([]);
      }
    } catch {
      setDiagrams([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === 'openDiagram') {
      fetchDiagrams();
    }
  }, [activeModal, search]);

  if (activeModal !== 'openDiagram') return null;

  const handleOpenDiagram = async (item: DiagramItem) => {
    try {
      setIsLoading(true);
      const res = await api.diagrams.getById(item.id);
      if (res && res.diagram) {
        setDiagram(res.diagram.data || res.diagram, res.diagram.id);
      } else {
        setDiagram(item.data, item.id);
      }
    } catch {
      setDiagram(item.data, item.id);
    } finally {
      setIsLoading(false);
      closeModal();
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, item: DiagramItem) => {
    e.stopPropagation();
    try {
      await api.diagrams.duplicate(item.id);
      setStatusMessage(`"${item.name}" duplicado com sucesso!`);
      fetchDiagrams();
    } catch {
      // Local duplicate
      const duplicated: DiagramItem = {
        ...item,
        id: `diag-dup-${Date.now()}`,
        name: `${item.name} (Cópia)`,
        updatedAt: 'Agora',
      };
      setDiagrams([duplicated, ...diagrams]);
      setStatusMessage(`"${duplicated.name}" duplicado localmente.`);
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.diagrams.delete(id);
    } catch {
      // Handled locally
    }
    setDiagrams((prev) => prev.filter((d) => d.id !== id));
    setStatusMessage('Diagrama removido.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const isPersonalDiagram = (d: DiagramItem) => {
    if (d.isPersonal || d.type === 'personal') return true;
    if (user?.id && (d.createdBy === user.id || d.creator?.id === user.id)) return true;
    return false;
  };

  const isWorkspaceDiagram = (d: DiagramItem) => {
    if (d.type === 'personal' || d.isPersonal) return false;
    return true;
  };

  const filtered = diagrams.filter((d) => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      d.name.toLowerCase().includes(query) ||
      d.type.toLowerCase().includes(query) ||
      (d.description && d.description.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (filterTab === 'personal') {
      return isPersonalDiagram(d);
    }
    if (filterTab === 'workspace') {
      return isWorkspaceDiagram(d);
    }
    return true;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-[95vw] sm:w-[90vw] md:max-w-2xl lg:max-w-4xl max-h-[92vh] sm:max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 sm:p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-500">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                  <span>Abrir Diagrama do Workspace</span>
                  <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] text-sky-400 font-semibold">
                    Cloud Storage
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  Gerencie e carregue topologias salvas na nuvem com isolamento multi-tenant
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          </div>

          {/* Search bar & Refresh */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 sm:top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, tipo ou descrição do diagrama..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 sm:py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchDiagrams}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-sky-400 transition-colors"
                title="Atualizar lista"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
                <span>Atualizar</span>
              </button>

              <button
                onClick={handleCreateNewDiagram}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition-colors shrink-0"
                title="Criar novo diagrama na nuvem (Valida quota do plano)"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Novo Diagrama</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-3 shrink-0 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Todos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700/60 font-bold">
                {diagrams.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('personal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'personal'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Pessoais</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700/60 font-bold">
                {diagrams.filter(isPersonalDiagram).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('workspace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTab === 'workspace'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Workspace / Equipe</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700/60 font-bold">
                {diagrams.filter(isWorkspaceDiagram).length}
              </span>
            </button>
          </div>

          {/* Status Toast Banner */}
          {statusMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-400 mb-3 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Diagrams Grid */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 sm:p-10 text-center text-slate-400">
                <Cloud className="h-10 w-10 text-slate-500 mb-2 opacity-60" />
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {search
                    ? 'Nenhum diagrama encontrado para a busca especificada.'
                    : filterTab === 'personal'
                    ? 'Nenhum diagrama pessoal criado por você ainda.'
                    : filterTab === 'workspace'
                    ? 'Nenhum diagrama de equipe/workspace disponível.'
                    : 'Nenhum diagrama salvo no seu workspace ainda.'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                  {search
                    ? 'Tente buscar por outro termo ou selecione a aba Todos.'
                    : 'Crie um diagrama do zero, importe um arquivo ou carregue um template de arquitetura oficial.'}
                </p>
                {!search && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      onClick={handleCreateNewDiagram}
                      className="min-h-[44px] w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Novo Diagrama</span>
                    </button>
                    <button
                      onClick={() => {
                        closeModal();
                        openModal('templates');
                      }}
                      className="min-h-[44px] w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                    >
                      <Layers className="h-3.5 w-3.5 text-sky-400" />
                      <span>Explorar Templates Oficiais</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filtered.map((item) => {
                const isCurrent = currentDiagramId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenDiagram(item)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all gap-3 ${
                      isCurrent
                        ? 'border-sky-500 bg-sky-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                          <span className="truncate">{item.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-sky-500 text-white font-bold shrink-0">
                              Aberto no Studio
                            </span>
                          )}
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                            {item.type}
                          </span>
                          {/* Real-time Active Viewers Badge */}
                          {item.activeViewers && item.activeViewers.length > 0 && (
                            <div
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold"
                              title={`Membros visualizando: ${item.activeViewers.map((v) => v.name).join(', ')}`}
                            >
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                              </span>
                              <span className="truncate max-w-[210px]">
                                {item.activeViewers.length === 1
                                  ? `${item.activeViewers[0].name} está visualizando agora`
                                  : `${item.activeViewers[0].name} e +${item.activeViewers.length - 1} visualizando agora`}
                              </span>
                              <div className="flex -space-x-1 overflow-hidden shrink-0 ml-0.5">
                                {item.activeViewers.slice(0, 3).map((v, vIdx) => (
                                  <div
                                    key={v.id || `viewer-${item.id}-${vIdx}`}
                                    className="h-4 w-4 rounded-full border border-white dark:border-slate-900 flex items-center justify-center font-bold text-[8px] text-white shrink-0"
                                    style={{ backgroundColor: v.color || '#10b981' }}
                                    title={v.name}
                                  >
                                    {v.name.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md mt-0.5">
                          {item.description}
                        </p>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.updatedAt}
                          </span>
                          <span>•</span>
                          <span>{item.nodeCount} nós</span>
                          <span>•</span>
                          <span>{item.connectionCount} conexões</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal('share', { diagramId: item.id });
                        }}
                        className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                        title="Gerar link de compartilhamento"
                        aria-label="Compartilhar"
                      >
                        <Share2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(e, item)}
                        className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                        title="Duplicar diagrama"
                        aria-label="Duplicar"
                      >
                        <Copy className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-2 sm:p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 flex items-center justify-center transition-colors"
                        title="Excluir da nuvem"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDiagram(item)}
                        className="min-h-[44px] sm:min-h-0 flex items-center justify-center gap-1.5 px-4 py-2 sm:px-3 sm:py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm transition-colors ml-1"
                      >
                        <span>Abrir</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export const DiagramsManagerModal = OpenDiagramModal;
