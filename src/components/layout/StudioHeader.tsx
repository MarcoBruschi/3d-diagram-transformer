'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCollaborationStore } from '@/store/useCollaborationStore';
import { useCopilotStore } from '@/store/useCopilotStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/services/apiClient';
import { PRESET_DIAGRAMS } from '@/data/presets';
import { UploadModal } from '../upload/UploadModal';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  Box,
  ChevronDown,
  UploadCloud,
  Command,
  ArrowLeft,
  Layers,
  BookOpen,
  Share2,
  Download,
  Bot,
  Sparkles,
  Building2,
  Users,
  Video,
  Key,
  History,
  Puzzle,
  Building,
  CreditCard,
  LogOut,
  UserCheck,
  LayoutTemplate,
  Cloud,
  Check,
  Loader2,
  Eye,
  Lock,
  FolderOpen,
  UserPlus,
  Search,
  MoreVertical,
  Plus,
  X,
  User,
  Menu,
  Radio,
  GitCompare,
  Code2,
  Glasses,
  FileCheck2,
} from 'lucide-react';
import { useFeatureGating } from '@/hooks/useFeatureGating';
import { useLayersStore } from '@/store/useLayersStore';
import { useLiveMonitoringStore } from '@/store/useLiveMonitoringStore';

export function StudioHeader() {
  const diagram = useDiagramStore((s) => s.diagram);
  const loadPreset = useDiagramStore((s) => s.loadPreset);
  const saveStatus = useDiagramStore((s) => s.saveStatus);
  const lastSavedAt = useDiagramStore((s) => s.lastSavedAt);
  const saveToCloud = useDiagramStore((s) => s.saveToCloud);

  const user = useAuthStore((s) => s.user);
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace);
  const workspaces = useAuthStore((s) => s.workspaces);
  const switchWorkspace = useAuthStore((s) => s.switchWorkspace);
  const createWorkspace = useAuthStore((s) => s.createWorkspace);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const personalWorkspace = workspaces.find((w) => w.isPersonal) || workspaces[0];
  const teamWorkspaces = workspaces.filter((w) => !w.isPersonal && w.id !== personalWorkspace?.id);

  const peers = useCollaborationStore((s) => s.peers);
  const togglePresenterMode = useCollaborationStore((s) => s.togglePresenterMode);
  const isPresenterActive = useCollaborationStore((s) => s.isPresenterActive);

  const toggleCopilot = useCopilotStore((s) => s.toggleCopilot);
  const isCopilotOpen = useCopilotStore((s) => s.isOpen);

  const rawOpenModal = useSaaSModalsStore((s) => s.openModal);
  const openModal = (modal: any, payload?: any) => {
    closeAllDropdowns();
    rawOpenModal(modal, payload);
  };
  const { canEdit, isFree, plan, role, canUseMultiplayer, canUseTelemetry } = useFeatureGating();
  const isMonitoringActive = useLiveMonitoringStore((s) => s.isMonitoringActive);
  const toggleMonitoring = () => {
    closeAllDropdowns();
    useLiveMonitoringStore.getState().toggleMonitoring();
  };
  const setIsLayersSheetOpen = (isOpen: boolean) => {
    if (isOpen) closeAllDropdowns();
    useLayersStore.getState().setIsLayersSheetOpen(isOpen);
  };

  const setDiagram = useDiagramStore((s) => s.setDiagram);
  const backendDiagramId = useDiagramStore((s) => s.backendDiagramId);
  const activeModal = useSaaSModalsStore((s) => s.activeModal);

  const headerRef = React.useRef<HTMLElement>(null);
  const [openDropdown, setOpenDropdown] = useState<'presets' | 'workspace' | 'user' | 'peers' | null>(null);

  const showPresetsDropdown = openDropdown === 'presets';
  const showWorkspaceDropdown = openDropdown === 'workspace';
  const showUserDropdown = openDropdown === 'user';
  const showPeersDropdown = openDropdown === 'peers';

  const setShowPresetsDropdown = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(openDropdown === 'presets') : val;
    setOpenDropdown(next ? 'presets' : null);
  };
  const setShowWorkspaceDropdown = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(openDropdown === 'workspace') : val;
    setOpenDropdown(next ? 'workspace' : null);
  };
  const setShowUserDropdown = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(openDropdown === 'user') : val;
    setOpenDropdown(next ? 'user' : null);
  };
  const setShowPeersDropdown = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(openDropdown === 'peers') : val;
    setOpenDropdown(next ? 'peers' : null);
  };

  const closeAllDropdowns = () => {
    setOpenDropdown(null);
    setShowMobileActionsMenu(false);
  };

  // Close open dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        closeAllDropdowns();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllDropdowns();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // New Workspace creation state
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreatingWs, setIsCreatingWs] = useState(false);

  // Team & Workspace members
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);

  // Architecture filter state
  const [architectureFilter, setArchitectureFilter] = useState<'all' | 'personal' | 'workspace'>('all');

  // Dynamic real diagrams from cloud
  const [savedDiagrams, setSavedDiagrams] = useState<any[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [loadingDiagramId, setLoadingDiagramId] = useState<string | null>(null);
  const [diagramSearch, setDiagramSearch] = useState('');
  const [showMobileBottomSheet, setShowMobileBottomSheet] = useState(false);
  const [showMobileActionsMenu, setShowMobileActionsMenu] = useState(false);

  // Shared session detection to allow online members pill for guests / free users
  const isSharedSession =
    typeof window !== 'undefined' &&
    (new URLSearchParams(window.location.search).has('share') ||
      new URLSearchParams(window.location.search).has('token') ||
      window.location.pathname.includes('/share/'));
  const isMultiplayerVisible = canUseMultiplayer || isSharedSession || peers.length > 0;

  const loadCloudDiagrams = async () => {
    setIsLoadingSaved(true);
    try {
      const res = await api.diagrams.list({ limit: 40 });
      if (res && res.data && res.data.length > 0) {
        setSavedDiagrams(res.data);
      }
    } catch {} finally {
      setIsLoadingSaved(false);
    }
  };

  const loadWorkspaceMembers = async () => {
    try {
      const res = await api.workspaces.getMembers();
      if (res && res.members) {
        setWorkspaceMembers(res.members);
      }
    } catch {}
  };

  useEffect(() => {
    if (showPeersDropdown || showWorkspaceDropdown) {
      loadWorkspaceMembers();
    }
  }, [showPeersDropdown, showWorkspaceDropdown]);

  const handleCreateWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wsName = newWorkspaceName.trim();
    if (!wsName) return;
    setIsCreatingWs(true);
    try {
      await createWorkspace(wsName);
      setNewWorkspaceName('');
      setShowCreateWorkspaceModal(false);
      setShowWorkspaceDropdown(false);
      loadCloudDiagrams();
    } catch (err) {
      console.error('[StudioHeader] Erro ao criar novo workspace:', err);
    } finally {
      setIsCreatingWs(false);
    }
  };

  const isPersonalDiagram = (d: any) => {
    if (d.isPersonal || d.type === 'personal') return true;
    if (user?.id && (d.createdBy === user.id || d.creator?.id === user.id)) return true;
    return false;
  };

  const isWorkspaceDiagram = (d: any) => {
    if (d.type === 'personal' || d.isPersonal) return false;
    return true;
  };

  const getDiagramActiveViewers = (d: any) => {
    let viewers = d.activeViewers || [];
    if (d.id === (backendDiagramId || diagram.id) && peers.length > 0) {
      const peerViewers = peers.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
      }));
      const existingIds = new Set(viewers.map((v: any) => v.id));
      const merged = [...viewers];
      for (const pv of peerViewers) {
        if (!existingIds.has(pv.id)) merged.push(pv);
      }
      viewers = merged;
    }
    return viewers;
  };

  const filteredSavedDiagrams = savedDiagrams
    .filter((d: any) => {
      if (!diagramSearch) return true;
      const q = diagramSearch.toLowerCase();
      return (
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.type && d.type.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    })
    .filter((d: any) => {
      if (architectureFilter === 'personal') return isPersonalDiagram(d);
      if (architectureFilter === 'workspace') return isWorkspaceDiagram(d);
      return true;
    });

  const handleSelectSavedDiagram = async (d: any) => {
    setLoadingDiagramId(d.id);
    try {
      let diagramData = d.data;
      if (!diagramData || !Array.isArray(diagramData.nodes) || diagramData.nodes.length === 0) {
        const res = await api.diagrams.getById(d.id);
        const fullDiagram = res?.diagram || res;
        diagramData = fullDiagram?.data || fullDiagram;
      }
      if (typeof diagramData === 'string') {
        try {
          diagramData = JSON.parse(diagramData);
        } catch {}
      }
      const parsedDiagram = {
        id: d.id,
        name: d.name || diagramData?.name || 'Diagrama Sem Título',
        description: d.description || diagramData?.description || '',
        type: d.type || diagramData?.type || 'cloud',
        nodes: Array.isArray(diagramData?.nodes) ? diagramData.nodes : [],
        connections: Array.isArray(diagramData?.connections) ? diagramData.connections : [],
      };
      setDiagram(parsedDiagram as any, d.id);
    } catch (err) {
      console.warn('[StudioHeader] Erro ao carregar diagrama completo:', err);
      if (d.data || d.nodes) {
        setDiagram(d.data || d, d.id);
      }
    } finally {
      setLoadingDiagramId(null);
      setShowPresetsDropdown(false);
      setShowMobileBottomSheet(false);
    }
  };

  useEffect(() => {
    loadCloudDiagrams();
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (saveStatus === 'saved') {
      loadCloudDiagrams();
    }
  }, [saveStatus]);

  useEffect(() => {
    if (activeModal === 'openDiagram') {
      loadCloudDiagrams();
    }
  }, [activeModal]);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  return (
    <>
      <header ref={headerRef} className="h-14 w-full border-b border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#07080B] dark:bg-cad-bg px-3 sm:px-4 flex items-center justify-between backdrop-blur-2xl z-30 font-mono text-xs select-none transition-colors duration-200">
        {/* Left Brand & Navigation & Workspace */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-[#1E273A] bg-slate-100 dark:bg-[#101520] px-2.5 py-1 text-slate-700 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            title="Return to Cinematic Landing"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Landing</span>
          </Link>

          <div className="h-4 w-px bg-slate-300 dark:bg-[#1E273A]" />

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-sm">
              <Box className="h-4 w-4" />
            </div>
            <div className="hidden sm:block">
              <span className="font-black tracking-widest text-slate-900 dark:text-slate-100 uppercase text-xs">
                PRISM<span className="text-sky-500 dark:text-sky-400">.</span>
              </span>
              <span className="ml-1.5 rounded bg-slate-200 dark:bg-[#101520] px-1.5 py-0.2 text-[9px] text-slate-600 dark:text-slate-400 border border-slate-300/40 dark:border-[#1E273A]">
                PROD
              </span>
            </div>
          </div>

          <div className="hidden md:block h-4 w-px bg-slate-300 dark:bg-[#1E273A]" />

          {/* Workspace Switcher or Sandbox Pill */}
          {isAuthenticated && currentWorkspace ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300/80 dark:border-[#1E273A] bg-slate-100/90 dark:bg-[#101520] px-2.5 py-1 text-slate-800 dark:text-slate-200 hover:border-sky-500/40 transition-all text-xs"
                title="Alternar Workspace / Organização"
              >
                <Building2 className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[110px] sm:max-w-[140px]">
                  {currentWorkspace.name}
                </span>
                <span className="rounded bg-sky-500/20 text-sky-400 text-[8px] font-bold px-1 uppercase hidden md:inline">
                  {user?.role || 'admin'}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {showWorkspaceDropdown && (
                <div className="absolute top-11 left-0 w-80 rounded-2xl border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14] dark:bg-cad-surface p-3 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-1.5 py-1 text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 mb-2 pb-1.5">
                    <span>Workspaces & Equipes</span>
                    <span
                      className="text-sky-500 hover:text-sky-400 cursor-pointer font-bold"
                      onClick={() => {
                        openModal('team');
                        setShowWorkspaceDropdown(false);
                      }}
                    >
                      Gerenciar
                    </span>
                  </div>

                  {/* 1. Workspace Pessoal (Padrão) */}
                  <div className="mb-2">
                    <div className="px-1.5 py-0.5 text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-sky-500" />
                        <span>Workspace Pessoal (Padrão)</span>
                      </span>
                      <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded font-semibold">
                        PADRÃO
                      </span>
                    </div>

                    {personalWorkspace && (
                      <button
                        type="button"
                        onClick={() => {
                          if (currentWorkspace?.id !== personalWorkspace.id) {
                            switchWorkspace(personalWorkspace.id);
                          }
                          setShowWorkspaceDropdown(false);
                        }}
                        className={`w-full mt-1 flex items-center justify-between rounded-lg p-2 text-left transition-all ${
                          currentWorkspace?.id === personalWorkspace.id
                            ? 'bg-sky-50 dark:bg-sky-950/70 border border-sky-400/80 dark:border-sky-700/80 shadow-xs'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                              currentWorkspace?.id === personalWorkspace.id
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <User className="h-3.5 w-3.5" />
                          </div>
                          <div className="truncate">
                            <div className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                              {personalWorkspace.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {personalWorkspace.plan.toUpperCase()} • Espaço Pessoal
                            </div>
                          </div>
                        </div>

                        {currentWorkspace?.id === personalWorkspace.id ? (
                          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/30">
                            <Check className="h-3 w-3" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline px-1.5 py-0.5 rounded bg-sky-500/10">
                            Alternar (1-clique)
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* 2. Workspaces de Equipe Adicionados */}
                  <div className="mb-2">
                    <div className="px-1.5 py-0.5 text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-emerald-500" />
                        <span>Workspaces Adicionados ({teamWorkspaces.length})</span>
                      </span>
                    </div>

                    {teamWorkspaces.length === 0 ? (
                      <div className="mt-1 p-2 text-center text-[10px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                        Nenhum workspace de equipe adicionado ainda.
                      </div>
                    ) : (
                      <div className="mt-1 space-y-1 max-h-40 overflow-y-auto pr-0.5">
                        {teamWorkspaces.map((ws) => (
                          <button
                            key={ws.id}
                            type="button"
                            onClick={() => {
                              if (currentWorkspace?.id !== ws.id) {
                                switchWorkspace(ws.id);
                              }
                              setShowWorkspaceDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between rounded-lg p-2 text-left transition-all ${
                              currentWorkspace?.id === ws.id
                                ? 'bg-sky-50 dark:bg-sky-950/70 border border-sky-400/80 dark:border-sky-700/80 shadow-xs'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div
                                className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  currentWorkspace?.id === ws.id
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                <Building2 className="h-3.5 w-3.5" />
                              </div>
                              <div className="truncate">
                                <div className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {ws.name}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {ws.memberCount} membro{ws.memberCount > 1 ? 's' : ''} • {ws.plan}
                                </div>
                              </div>
                            </div>

                            {currentWorkspace?.id === ws.id ? (
                              <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/30">
                                <Check className="h-3 w-3" />
                                <span>Ativo</span>
                              </span>
                            ) : (
                              <span className="shrink-0 text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline px-1.5 py-0.5 rounded bg-sky-500/10">
                                Alternar (1-clique)
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateWorkspaceModal(true);
                        setShowWorkspaceDropdown(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 text-sky-500" />
                      <span>+ Criar Novo Workspace</span>
                    </button>
                    <button
                      onClick={() => {
                        openModal('team');
                        setShowWorkspaceDropdown(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 py-2 text-xs font-bold text-sky-600 dark:text-sky-400 transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Convidar Membros para Equipe</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-600 dark:text-sky-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
              <span>Visitante • Visualização 3D</span>
            </div>
          )}
        </div>

        {/* Center Diagram Name & Preset Switcher & Cloud Status */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Architecture Bottom Sheet Trigger */}
          <button
            onClick={() => {
              loadCloudDiagrams();
              setShowMobileBottomSheet(true);
            }}
            className="flex md:hidden items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/80 px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
            title="Trocar Arquitetura"
          >
            <Layers className="h-3.5 w-3.5 text-sky-500" />
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[110px] text-[11px]">
              {diagram.name}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* Desktop Real Diagrams Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                if (!showPresetsDropdown) loadCloudDiagrams();
                setShowPresetsDropdown(!showPresetsDropdown);
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-300/80 dark:border-[#1E273A] bg-slate-100/90 dark:bg-[#101520] px-3 py-1.5 text-slate-800 dark:text-slate-200 hover:border-sky-500/40 transition-all shadow-xs"
            >
              <Layers className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[160px] lg:max-w-xs">{diagram.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            </button>

            {showPresetsDropdown && (
              <div className="absolute top-11 left-1/2 -translate-x-1/2 w-[420px] max-w-[92vw] min-h-[340px] flex flex-col rounded-2xl border border-slate-200 dark:border-[#1E273A] dark:border-cad-border bg-white dark:bg-[#0B0E14] dark:bg-cad-surface p-4 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-[#1E273A]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      Trocar Arquitetura
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowPresetsDropdown(false);
                      openModal('templates');
                    }}
                    className="text-[11px] text-sky-500 hover:text-sky-400 font-semibold hover:underline flex items-center gap-1.5 whitespace-nowrap px-2 py-0.5 rounded-md hover:bg-sky-500/10 transition-colors"
                  >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    <span>Ver Templates</span>
                  </button>
                </div>

                <div className="relative mb-2.5">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={diagramSearch}
                    onChange={(e) => setDiagramSearch(e.target.value)}
                    placeholder="Buscar no workspace ou arquiteturas..."
                    className="w-full rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#101520] py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Quick filter tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#101520] rounded-xl mb-3 border border-slate-200 dark:border-[#1E273A]">
                  <button
                    type="button"
                    onClick={() => setArchitectureFilter('all')}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                      architectureFilter === 'all'
                        ? 'bg-white dark:bg-[#1E273A] text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchitectureFilter('personal')}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                      architectureFilter === 'personal'
                        ? 'bg-white dark:bg-[#1E273A] text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Pessoais
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchitectureFilter('workspace')}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                      architectureFilter === 'workspace'
                        ? 'bg-white dark:bg-[#1E273A] text-sky-600 dark:text-sky-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Workspace
                  </button>
                </div>

                {/* Diagrams List with stable min-height & sleek loading skeleton */}
                <div className="flex-1 space-y-1.5 max-h-64 min-h-[160px] overflow-y-auto pr-1">
                  {isLoadingSaved && (
                    <div className="space-y-2 py-2">
                      <div className="flex items-center justify-center gap-2 py-3 text-slate-400 text-xs">
                        <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                        <span className="font-mono text-[11px]">Carregando diagramas...</span>
                      </div>
                      {[1, 2, 3].map((skeletonIdx) => (
                        <div
                          key={skeletonIdx}
                          className="w-full rounded-xl p-2.5 bg-slate-100/60 dark:bg-[#101520] border border-slate-200/50 dark:border-[#1E273A] animate-pulse space-y-2"
                        >
                          <div className="h-3.5 bg-slate-200 dark:bg-[#1E273A] rounded-md w-3/4" />
                          <div className="h-2.5 bg-slate-200/70 dark:bg-[#1E273A] rounded-md w-1/3" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!isLoadingSaved && savedDiagrams.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-slate-400">
                      <span>Nenhum diagrama na nuvem ainda.</span>
                      <button
                        onClick={() => {
                          setShowPresetsDropdown(false);
                          openModal('templates');
                        }}
                        className="mt-2.5 inline-flex items-center gap-1 text-sky-400 font-bold hover:underline text-xs"
                      >
                        <LayoutTemplate className="h-3 w-3" />
                        Carregar um Template Oficial
                      </button>
                    </div>
                  )}

                  {!isLoadingSaved && savedDiagrams.length > 0 && filteredSavedDiagrams.length === 0 && (
                    <div className="flex items-center justify-center py-8 text-center text-xs text-slate-400">
                      <span>Nenhum diagrama encontrado neste filtro.</span>
                    </div>
                  )}

                  {!isLoadingSaved && filteredSavedDiagrams.map((d) => {
                    const viewers = getDiagramActiveViewers(d);
                    const hasActiveViewers = viewers && viewers.length > 0;
                    return (
                      <button
                        key={d.id}
                        disabled={loadingDiagramId !== null}
                        onClick={() => handleSelectSavedDiagram(d)}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all ${
                          diagram.id === d.id
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-300 font-semibold border border-sky-500/30'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#101520] border border-transparent hover:border-slate-200 dark:hover:border-[#1E273A]'
                        } ${loadingDiagramId === d.id ? 'opacity-70 cursor-wait' : ''}`}
                      >
                        <div className="truncate min-w-0 flex-1 pr-3">
                          <div className="truncate font-medium flex items-center gap-1.5 text-xs text-slate-900 dark:text-slate-100">
                            <span className="truncate">{d.name || 'Diagrama Sem Título'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                            <span>{d.data?.nodes?.length ?? d.nodeCount ?? 0} Nós</span>
                            <span>•</span>
                            <span className="capitalize">{d.type || 'cloud'}</span>
                          </div>
                          {/* Active Presence Indicator */}
                          {hasActiveViewers && (
                            <div className="flex items-center gap-1 mt-1 text-[9px] text-emerald-500 font-semibold" title={`Em visualização por: ${viewers.map((v: any) => v.name).join(', ')}`}>
                              <span className="relative flex h-1.5 w-1.5 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                              </span>
                              <span className="truncate max-w-[160px]">
                                {viewers.length === 1 ? `${viewers[0].name} online` : `${viewers[0].name} +${viewers.length - 1} online`}
                              </span>
                            </div>
                          )}
                        </div>
                        {loadingDiagramId === d.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-sky-500 shrink-0" />
                        ) : diagram.id === d.id ? (
                          <span className="h-2 w-2 rounded-full bg-sky-500 shrink-0 shadow-[0_0_8px_#38BDF8]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#1E273A] flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setShowPresetsDropdown(false);
                      openModal('openDiagram');
                    }}
                    className="text-sky-500 hover:text-sky-400 font-semibold flex items-center gap-1 hover:underline"
                  >
                    Gerenciar Todos
                  </button>
                  <button
                    onClick={() => {
                      setShowPresetsDropdown(false);
                      openModal('templates');
                    }}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors"
                  >
                    Presets & Templates →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cloud Auto-Save Status & Open Diagram (Authenticated Only) */}
          {isAuthenticated && (
            <>
              <button
                onClick={() => {
                  closeAllDropdowns();
                  saveToCloud();
                }}
                title={
                  saveStatus === 'saved'
                    ? `Todas as alterações sincronizadas com a nuvem (${lastSavedAt || 'Agora'}). Clique para salvar manualmente.`
                    : saveStatus === 'saving'
                    ? 'Gravando snapshots na nuvem...'
                    : 'Existem alterações não salvas. Clique para salvar agora.'
                }
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                  saveStatus === 'saving'
                    ? 'border-sky-500/40 bg-sky-500/10 text-sky-400'
                    : saveStatus === 'saved'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                }`}
              >
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-sky-400" />
                    <span className="font-semibold">Salvando...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="font-semibold">Salvo na Nuvem</span>
                  </>
                )}
                {saveStatus === 'unsaved' && (
                  <>
                    <Cloud className="h-3 w-3 text-amber-400" />
                    <span className="font-semibold">Modificações Locais</span>
                  </>
                )}
              </button>

              <button
                onClick={() => openModal('openDiagram')}
                className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Meus Diagramas Salvos na Nuvem"
              >
                <FolderOpen className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                <span className="hidden xl:inline">Meus Diagramas</span>
              </button>
            </>
          )}

          {/* Viewer Mode Badge */}
          {!canEdit && (
            <div
              className="hidden md:flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 shadow-sm"
              title="Modo somente leitura para seu perfil ou visitante"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Modo Visualizador (Somente Leitura)</span>
            </div>
          )}
        </div>

        {/* Right Actions, Multiplayer, Share, Export, AI, User */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Multiplayer Avatars Pill */}
          {isMultiplayerVisible ? (
            <div className="relative hidden md:flex items-center">
              <button
                onClick={() => setShowPeersDropdown(!showPeersDropdown)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 px-2 py-1 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-colors"
                title="Pessoas Online no Workspace / Diagrama"
              >
                <div className="flex -space-x-1.5 overflow-hidden items-center">
                  {/* Local User Avatar */}
                  <div
                    className="h-5 w-5 rounded-full border border-slate-900 bg-sky-600 flex items-center justify-center font-bold text-[9px] text-white shadow-sm ring-1 ring-emerald-400"
                    title={`Você (${user?.name || user?.email?.split('@')[0] || 'Convidado'})`}
                  >
                    {(user?.name || user?.email?.split('@')[0] || 'V').charAt(0).toUpperCase()}
                  </div>
                  {/* Remote Peers Avatars */}
                  {peers.map((p) => (
                    <div
                      key={p.id}
                      className="h-5 w-5 rounded-full border border-slate-900 flex items-center justify-center font-bold text-[9px] text-white"
                      style={{ backgroundColor: p.color }}
                      title={`${p.name} (${p.role})`}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hidden sm:inline">
                    {peers.length === 0 ? '1 Online (Você)' : `${peers.length + 1} Online`}
                  </span>
                </div>
              </button>

              {showPeersDropdown && (
                <div className="absolute top-10 right-0 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 shadow-2xl backdrop-blur-xl z-50">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Presença e Colaboração
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                      Tempo Real
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-3 pr-0.5">
                    {/* Section 1: No Diagrama Atual */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Layers className="h-3 w-3 text-sky-400" />
                          <span>No Diagrama Atual ({peers.length + 1})</span>
                        </span>
                      </div>
                      <div className="space-y-1">
                        {/* Local User Entry */}
                        <div className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[130px]">
                              {user?.name || user?.email?.split('@')[0] || 'Você'} (Você)
                            </span>
                          </div>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold">
                            {user?.role || (isSharedSession ? 'viewer' : 'membro')}
                          </span>
                        </div>

                        {/* Remote Peers Entries */}
                        {peers.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                              <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[130px]">{p.name}</span>
                            </div>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold">
                              {p.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 2: Ativos no Workspace */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-emerald-400" />
                          <span>Ativos no Workspace</span>
                        </span>
                      </div>
                      <div className="space-y-1">
                        {(() => {
                          const otherDiagramViewers: Array<{ id: string; name: string; color?: string; diagramName: string }> = [];
                          const peerNames = new Set([user?.name, ...peers.map((p) => p.name)]);
                          for (const sd of savedDiagrams) {
                            if (sd.id !== (backendDiagramId || diagram.id) && sd.activeViewers && Array.isArray(sd.activeViewers)) {
                              for (const v of sd.activeViewers) {
                                if (!peerNames.has(v.name)) {
                                  otherDiagramViewers.push({
                                    id: `${sd.id}-${v.id}`,
                                    name: v.name,
                                    color: v.color,
                                    diagramName: sd.name || 'Outro Diagrama',
                                  });
                                }
                              }
                            }
                          }

                          const otherMembers = workspaceMembers.filter(
                            (m) => m.email !== user?.email && !peers.some((p) => p.name === m.name) && !otherDiagramViewers.some((ov) => ov.name === m.name)
                          );

                          if (otherDiagramViewers.length === 0 && otherMembers.length === 0) {
                            return (
                              <div className="p-2 text-center text-[10px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                <span>Nenhum outro membro ativo agora.</span>
                              </div>
                            );
                          }

                          return (
                            <>
                              {otherDiagramViewers.map((ov) => (
                                <div key={ov.id} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                                    <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[120px]">{ov.name}</span>
                                  </div>
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium truncate max-w-[110px]" title={`Em ${ov.diagramName}`}>
                                    {ov.diagramName}
                                  </span>
                                </div>
                              ))}

                              {otherMembers.map((m) => (
                                <div key={m.id} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                  <div className="flex items-center gap-2 truncate">
                                    <div className="h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                                      {m.name?.charAt(0).toUpperCase() || 'M'}
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[130px]">{m.name || m.email}</span>
                                  </div>
                                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold">
                                    {m.role || 'membro'}
                                  </span>
                                </div>
                              ))}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                    <button
                      onClick={async () => {
                        const targetDiagramId = backendDiagramId || diagram.id;
                        if (isPresenterActive) {
                          if (targetDiagramId) {
                            try {
                              await api.collaborate.stopPresenterMode(targetDiagramId);
                            } catch (err) {
                              console.warn('[StudioHeader] Erro ao encerrar apresentação:', err);
                            }
                          }
                          togglePresenterMode();
                        } else {
                          togglePresenterMode(user?.name || user?.email?.split('@')[0] || 'Apresentador');
                          if (targetDiagramId) {
                            try {
                              await api.collaborate.broadcastCamera(targetDiagramId, [0, 6, 15], [0, 0, 0]);
                            } catch (err) {
                              console.warn('[StudioHeader] Erro ao iniciar apresentação:', err);
                            }
                          }
                        }
                        setShowPeersDropdown(false);
                      }}
                      className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                        isPresenterActive
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-violet-600 hover:bg-violet-500 text-white'
                      }`}
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>{isPresenterActive ? 'Encerrar Apresentação' : 'Iniciar Apresentação (Câmera ao Vivo)'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowPeersDropdown(false);
                        openModal('team');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-sky-600/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 text-[11px] font-bold transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Convidar Colegas</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openModal('billing')}
              className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 px-2 py-1 text-slate-500 hover:border-amber-500/50 hover:text-amber-500 transition-colors"
              title="Colaboração multiplayer em tempo real requer plano Pro ou Enterprise"
            >
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-semibold flex items-center gap-1 hidden sm:inline">
                Multiplayer <Lock className="h-2.5 w-2.5 text-amber-500" />
              </span>
            </button>
          )}

          {isAuthenticated && (
            <>
              {/* Templates Gallery Button (Desktop) */}
              <button
                onClick={() => openModal('templates')}
                className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-[#1E273A] bg-slate-100 dark:bg-[#101520] px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:border-sky-500/40 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Galeria de Templates de Arquitetura"
              >
                <LayoutTemplate className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden xl:inline">Templates</span>
              </button>

              {/* Export Button (Desktop) */}
              <button
                onClick={() => openModal('export')}
                className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-[#1E273A] bg-slate-100 dark:bg-[#101520] px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Exportar Cena 3D (.glTF), Draw.io, Mermaid e Imagens"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden xl:inline">Exportar</span>
              </button>

              {/* Share Button (Desktop) */}
              <button
                onClick={() => openModal('share')}
                className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-[#1E273A] bg-slate-100 dark:bg-[#101520] px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:border-sky-500/40 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Compartilhar Link ou Iframe"
              >
                <Share2 className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden sm:inline">Share</span>
              </button>

              {/* AI Copilot Toggle Button */}
              <button
                onClick={toggleCopilot}
                className={`hidden md:flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-bold transition-all text-xs ${
                  isCopilotOpen
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                    : 'border border-sky-400/40 dark:border-sky-500/30 bg-sky-50 dark:bg-[#101520] text-sky-700 dark:text-sky-300 hover:border-sky-400'
                }`}
                title="Abrir Chat com o Diagrama (AI Copilot)"
              >
                <Bot className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden sm:inline">AI Copilot</span>
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
              </button>

              {/* Mobile Hamburger Menu Trigger */}
              <button
                onClick={() => setShowMobileActionsMenu(true)}
                className="flex md:hidden items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-colors"
                title="Menu Principal"
                aria-label="Menu Principal"
              >
                <Menu className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Theme Toggle Button */}
          <div>
            <ThemeToggle />
          </div>

          {/* Import Button (Desktop) */}
          {isAuthenticated && canEdit && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="hidden md:flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 font-bold text-white shadow-sm hover:bg-sky-500 transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Import</span>
            </button>
          )}

          {/* User Profile or Login CTA */}
          <div>
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-[#1E273A] bg-slate-100 dark:bg-[#101520] px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-sky-500 hover:text-sky-500 transition-colors"
                >
                  <span>Entrar</span>
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-sky-500 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Criar Conta</span>
                </Link>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="min-h-[40px] flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-[#1E273A] bg-slate-100 dark:bg-[#101520] px-2 py-1 text-slate-700 dark:text-slate-300 hover:border-sky-500/40 transition-all"
                  title="Menu do Usuário & Configurações SaaS"
                  aria-label="Menu do Usuário"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white shadow-sm overflow-hidden shrink-0">
                    {user?.avatarUrl && !avatarError ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name || 'User'}
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarError(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {showUserDropdown && (
                  <div className="absolute top-12 right-0 w-64 rounded-2xl border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14] dark:bg-cad-surface p-2 shadow-2xl backdrop-blur-2xl z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User info */}
                    <div className="px-2.5 py-2 border-b border-slate-200 dark:border-slate-800/80 mb-1.5">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="rounded bg-sky-500/20 text-sky-400 px-1 text-[9px] font-bold uppercase">
                          {user?.role}
                        </span>
                        <span className="rounded bg-amber-500/20 text-amber-400 px-1 text-[9px] font-bold uppercase">
                          Plano {user?.plan}
                        </span>
                      </div>
                    </div>

                    {/* Highlighted Direct Button: Meu Perfil & Personalização */}
                    <div className="mb-1.5 pb-1.5 border-b border-slate-200 dark:border-slate-800/80">
                      <button
                        onClick={() => {
                          openModal('auth', { tab: 'profile' });
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-semibold transition-colors min-h-[44px]"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-sky-500" />
                          <span>Meu Perfil & Personalização</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 font-bold uppercase">
                          3D Avatar
                        </span>
                      </button>
                    </div>

                    {/* Workspaces Section: Workspace Pessoal & Workspaces Adicionados */}
                    <div className="mb-1.5 pb-1.5 border-b border-slate-200 dark:border-slate-800/80">
                      <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                        <span>Workspaces</span>
                        <span
                          className="text-sky-500 hover:text-sky-400 cursor-pointer font-bold text-[9px]"
                          onClick={() => {
                            openModal('team');
                            setShowUserDropdown(false);
                          }}
                        >
                          Gerenciar
                        </span>
                      </div>

                      {/* Workspace Pessoal (Padrão) */}
                      {personalWorkspace && (
                        <button
                          type="button"
                          onClick={() => {
                            if (currentWorkspace?.id !== personalWorkspace.id) {
                              switchWorkspace(personalWorkspace.id);
                            }
                            setShowUserDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition-colors text-[11px] ${
                            currentWorkspace?.id === personalWorkspace.id
                              ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-semibold border border-sky-300 dark:border-sky-800/50'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                            <span className="truncate">{personalWorkspace.name}</span>
                          </div>
                          {currentWorkspace?.id === personalWorkspace.id ? (
                            <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                              Ativo
                            </span>
                          ) : (
                            <span className="text-[9px] text-sky-600 dark:text-sky-400 hover:underline shrink-0">
                              Alternar
                            </span>
                          )}
                        </button>
                      )}

                      {/* Workspaces de Equipe Adicionados */}
                      {teamWorkspaces.map((ws) => (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => {
                            if (currentWorkspace?.id !== ws.id) {
                              switchWorkspace(ws.id);
                            }
                            setShowUserDropdown(false);
                          }}
                          className={`w-full mt-0.5 flex items-center justify-between p-1.5 rounded-lg text-left transition-colors text-[11px] ${
                            currentWorkspace?.id === ws.id
                              ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-semibold border border-sky-300 dark:border-sky-800/50'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{ws.name}</span>
                          </div>
                          {currentWorkspace?.id === ws.id ? (
                            <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                              Ativo
                            </span>
                          ) : (
                            <span className="text-[9px] text-sky-600 dark:text-sky-400 hover:underline shrink-0">
                              Alternar
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* SaaS Actions */}
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          openModal('billing');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[40px]"
                      >
                        <CreditCard className="h-3.5 w-3.5 text-amber-400" />
                        <span>Planos & Faturamento (Stripe)</span>
                      </button>

                      <button
                        onClick={() => {
                          openModal('versions');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left"
                      >
                        <History className="h-3.5 w-3.5 text-violet-400" />
                        <span>Histórico de Versões & Nuvem</span>
                      </button>

                      <button
                        onClick={() => {
                          openModal('gateway');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left"
                      >
                        <Key className="h-3.5 w-3.5 text-emerald-400" />
                        <span>API Key Gateway & Quotas</span>
                      </button>

                      <button
                        onClick={() => {
                          openModal('enterprise');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left"
                      >
                        <Building className="h-3.5 w-3.5 text-sky-400" />
                        <span>White-Label & SSO SAML</span>
                      </button>

                      <button
                        onClick={() => {
                          openModal('plugins');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left"
                      >
                        <Puzzle className="h-3.5 w-3.5 text-pink-400" />
                        <span>Plugins & Extensões C4</span>
                      </button>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />

                    <button
                      onClick={() => {
                        openModal('auth');
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>Gerenciar Conta & Roles</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 text-left font-semibold transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5 text-rose-500" />
                      <span>Encerrar Sessão</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Upload Modal */}
      <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} />

      {/* Mobile Main Menu Drawer */}
      <AnimatePresence>
        {showMobileActionsMenu && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/70 backdrop-blur-sm font-mono">
            {/* Backdrop click to dismiss */}
            <div
              className="absolute inset-0"
              onClick={() => setShowMobileActionsMenu(false)}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-h-[88vh] flex flex-col rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden"
            >
              {/* Drag indicator handle */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 shrink-0" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80 mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                    <Box className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Menu Studio 3D
                    </h3>
                    <p className="text-[10px] text-slate-500">Ações rápidas e configurações</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileActionsMenu(false)}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:text-slate-200"
                  aria-label="Fechar Menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
                {/* 1. User Profile or Auth Section */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  {isAuthenticated && user ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm overflow-hidden shrink-0">
                            {user.avatarUrl && !avatarError ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name || 'User'}
                                referrerPolicy="no-referrer"
                                onError={() => setAvatarError(true)}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              user.name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {user.name}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                          </div>
                        </div>
                        <span className="rounded bg-sky-500/20 text-sky-400 px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0">
                          {user.plan || 'Free'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setShowMobileActionsMenu(false);
                          openModal('auth', { tab: 'profile' });
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-xs font-semibold min-h-[44px]"
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>Meu Perfil & Configurações</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        href="/login"
                        onClick={() => setShowMobileActionsMenu(false)}
                        className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 min-h-[44px]"
                      >
                        Entrar
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setShowMobileActionsMenu(false)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-600 text-xs font-bold text-white shadow min-h-[44px]"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Criar Conta</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 2. Workspace Status (If Authenticated) */}
                {isAuthenticated && currentWorkspace && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="h-4 w-4 text-sky-500 shrink-0" />
                      <div className="truncate">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Workspace</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {currentWorkspace.name}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowMobileActionsMenu(false);
                        openModal('team');
                      }}
                      className="text-xs text-sky-500 hover:text-sky-400 font-bold px-2 py-1 shrink-0"
                    >
                      Gerenciar
                    </button>
                  </div>
                )}

                {/* 3. Cloud Auto-Save & Sync Action */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    {saveStatus === 'saving' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                    ) : saveStatus === 'saved' ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Cloud className="h-4 w-4 text-amber-400" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {saveStatus === 'saving'
                          ? 'Salvando na Nuvem...'
                          : saveStatus === 'saved'
                          ? 'Sincronizado na Nuvem'
                          : 'Alterações Pendentes'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {lastSavedAt ? `Último snapshot: ${lastSavedAt}` : 'Armazenamento em nuvem seguro'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      saveToCloud();
                    }}
                    disabled={saveStatus === 'saving'}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shrink-0 min-h-[40px]"
                  >
                    Salvar
                  </button>
                </div>

                {/* 4. AI Copilot & Theme Toggle Row */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      toggleCopilot();
                      setShowMobileActionsMenu(false);
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold min-h-[48px] ${
                      isCopilotOpen
                        ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                        : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-400/40'
                    }`}
                  >
                    <Bot className="h-4 w-4 text-sky-400" />
                    <span>AI Copilot</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                  </button>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 min-h-[48px]">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tema</span>
                    <ThemeToggle showLabel={false} />
                  </div>
                </div>

                {/* 5. Advanced 3D & Spatial SaaS Capabilities */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="px-1 mb-1 text-[10px] uppercase font-bold text-slate-400">
                    Ferramentas & Recursos 3D
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setShowMobileActionsMenu(false);
                        setIsLayersSheetOpen(true);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[44px]"
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="h-4 w-4 text-sky-500 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold">Camadas do Diagrama (Layers)</div>
                          <div className="text-[10px] text-slate-400">Ative/desative infra, software, bancos e HUD</div>
                        </div>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400 -rotate-90" />
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileActionsMenu(false);
                        if (!canUseTelemetry) {
                          openModal('billing');
                          return;
                        }
                        toggleMonitoring();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[44px]"
                    >
                      <div className="flex items-center gap-3">
                        <Radio className="h-4 w-4 text-emerald-500 shrink-0" />
                        <div>
                          <div className="text-xs font-semibold flex items-center gap-1.5">
                            <span>Live Ops & Telemetria</span>
                            {isMonitoringActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />}
                            {!canUseTelemetry && <Lock className="h-3 w-3 text-amber-500" />}
                          </div>
                          <div className="text-[10px] text-slate-400">Métricas em tempo real (Datadog/Prometheus)</div>
                        </div>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${isMonitoringActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                        {isMonitoringActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileActionsMenu(false);
                        openModal('diff');
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[44px]"
                    >
                      <GitCompare className="h-4 w-4 text-sky-500 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold">Visual Architecture Diff 3D</div>
                        <div className="text-[10px] text-slate-400">Comparar versões de arquitetura e histórico</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileActionsMenu(false);
                        openModal('iac');
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[44px]"
                    >
                      <Code2 className="h-4 w-4 text-indigo-500 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold">Sincronização IaC (Terraform / Pulumi)</div>
                        <div className="text-[10px] text-slate-400">Exportar código de infraestrutura e abrir PRs</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileActionsMenu(false);
                        openModal('webxr');
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[44px]"
                    >
                      <Glasses className="h-4 w-4 text-violet-500 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold">Modo Imersivo WebXR (VR/AR)</div>
                        <div className="text-[10px] text-slate-400">Spatial Computing para Vision Pro, Quest e Celular</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileActionsMenu(false);
                        openModal('adr');
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[44px]"
                    >
                      <FileCheck2 className="h-4 w-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold">Decisões de Arquitetura (ADRs)</div>
                        <div className="text-[10px] text-slate-400">Gerar e persistir Architecture Decision Records</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 6. Navigation & General Management */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="px-1 mb-1 text-[10px] uppercase font-bold text-slate-400">
                    Workspace & Arquivos
                  </div>
                  <button
                    onClick={() => {
                      setShowMobileActionsMenu(false);
                      openModal('openDiagram');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[44px]"
                  >
                    <FolderOpen className="h-4 w-4 text-sky-500 shrink-0" />
                    <span className="text-xs font-medium">Meus Diagramas Salvos</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileActionsMenu(false);
                      openModal('templates');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[44px]"
                  >
                    <LayoutTemplate className="h-4 w-4 text-sky-500 shrink-0" />
                    <span className="text-xs font-medium">Galeria de Templates Oficiais</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileActionsMenu(false);
                      openModal('export');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[44px]"
                  >
                    <Download className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium">Exportar Cena 3D / Imagem</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMobileActionsMenu(false);
                      openModal('share');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[44px]"
                  >
                    <Share2 className="h-4 w-4 text-sky-500 shrink-0" />
                    <span className="text-xs font-medium">Compartilhar Link ou Iframe</span>
                  </button>

                  {canEdit && (
                    <button
                      onClick={() => {
                        setShowMobileActionsMenu(false);
                        setShowUploadModal(true);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[44px]"
                    >
                      <UploadCloud className="h-4 w-4 text-sky-500 shrink-0" />
                      <span className="text-xs font-medium">Importar Diagrama (JSON / Code)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowMobileActionsMenu(false);
                      openModal('billing');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-left min-h-[44px]"
                  >
                    <CreditCard className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-medium">Assinatura & Planos SaaS</span>
                  </button>
                </div>

                {/* 6. Logout */}
                {isAuthenticated && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setShowMobileActionsMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 p-3 rounded-xl text-rose-500 hover:bg-rose-500/10 text-left text-xs font-semibold min-h-[44px]"
                    >
                      <LogOut className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>Encerrar Sessão</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Architecture Switching Bottom Sheet */}
      <AnimatePresence>
        {showMobileBottomSheet && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/70 backdrop-blur-sm font-mono">
            {/* Backdrop click to dismiss */}
            <div
              className="absolute inset-0"
              onClick={() => setShowMobileBottomSheet(false)}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-h-[82vh] flex flex-col rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-2xl text-slate-800 dark:text-slate-100"
            >
              {/* Drag indicator handle */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />

              {/* Bottom Sheet Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Trocar Arquitetura
                    </h3>
                    <p className="text-[10px] text-slate-500">Toque em 1 clique para carregar</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileBottomSheet(false)}
                  className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Instant Search Input */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={diagramSearch}
                  onChange={(e) => setDiagramSearch(e.target.value)}
                  placeholder="Filtrar por nome ou tipo..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-sky-500"
                />
              </div>

              {/* Real Diagrams List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 max-h-[45vh]">
                {isLoadingSaved && (
                  <div className="flex items-center justify-center p-6 text-slate-400 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-sky-400" />
                    <span>Carregando seus diagramas...</span>
                  </div>
                )}

                {!isLoadingSaved && savedDiagrams.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <p>Nenhum diagrama na nuvem ainda.</p>
                    <button
                      onClick={() => {
                        setShowMobileBottomSheet(false);
                        openModal('templates');
                      }}
                      className="mt-2 text-sky-400 font-bold hover:underline"
                    >
                      Explorar Templates Oficiais
                    </button>
                  </div>
                )}

                {filteredSavedDiagrams.map((d) => {
                  const viewers = getDiagramActiveViewers(d);
                  const hasActiveViewers = viewers && viewers.length > 0;
                  return (
                    <button
                      key={d.id}
                      disabled={loadingDiagramId !== null}
                      onClick={() => handleSelectSavedDiagram(d)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors min-h-[48px] ${
                        diagram.id === d.id
                          ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold border border-sky-400/50'
                          : 'bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800/80'
                      } ${loadingDiagramId === d.id ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      <div className="truncate min-w-0 flex-1 pr-2">
                        <div className="font-semibold text-xs truncate">{d.name || 'Diagrama Sem Título'}</div>
                        <div className="text-[10px] text-slate-500">
                          {d.data?.nodes?.length ?? d.nodeCount ?? 0} Nós • {d.type || 'cloud'}
                        </div>
                        {hasActiveViewers && (
                          <div className="flex items-center gap-1 mt-0.5 text-[9px] text-emerald-500 font-semibold">
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                            </span>
                            <span className="truncate max-w-[140px]">
                              {viewers.length === 1 ? `${viewers[0].name} online` : `${viewers[0].name} +${viewers.length - 1}`}
                            </span>
                          </div>
                        )}
                      </div>
                      {loadingDiagramId === d.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-sky-500 shrink-0 ml-2" />
                      ) : diagram.id === d.id ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0 ml-2" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Sheet Actions */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowMobileBottomSheet(false);
                    openModal('templates');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 min-h-[44px]"
                >
                  <LayoutTemplate className="h-4 w-4 text-sky-500" />
                  <span>Ver Templates</span>
                </button>

                <button
                  onClick={() => {
                    setShowMobileBottomSheet(false);
                    openModal('openDiagram');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white min-h-[44px]"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>Gerenciar Todos</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreateWorkspaceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-500">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Criar Novo Workspace</h3>
                    <p className="text-[11px] text-slate-500">Organização isolada para sua equipe</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateWorkspaceModal(false)}
                  className="text-slate-400 hover:text-slate-200 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateWorkspaceSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nome do Workspace
                  </label>
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Ex: Arquitetura Cloud, Fintech Team..."
                    required
                    autoFocus
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateWorkspaceModal(false)}
                    className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingWs || !newWorkspaceName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    {isCreatingWs ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Criando...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Criar Workspace</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
