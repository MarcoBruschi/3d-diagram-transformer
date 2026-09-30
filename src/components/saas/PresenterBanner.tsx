'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollaborationStore } from '@/store/useCollaborationStore';
import { useCameraStore } from '@/store/useCameraStore';
import { useDiagramStore } from '@/store/useDiagramStore';
import { api } from '@/lib/services/apiClient';
import { Video, Eye, EyeOff, X, Compass, RefreshCw } from 'lucide-react';

export function PresenterBanner() {
  const isPresenterActive = useCollaborationStore((s) => s.isPresenterActive);
  const presenterName = useCollaborationStore((s) => s.presenterName);
  const remotePresenter = useCollaborationStore((s) => s.remotePresenter);
  const isFollowingPresenter = useCollaborationStore((s) => s.isFollowingPresenter);
  const isCameraDecoupled = useCollaborationStore((s) => s.isCameraDecoupled);
  const resyncCamera = useCollaborationStore((s) => s.resyncCamera);
  const toggleFollowPresenter = useCollaborationStore((s) => s.toggleFollowPresenter);
  const togglePresenterMode = useCollaborationStore((s) => s.togglePresenterMode);
  const setRemotePresenter = useCollaborationStore((s) => s.setRemotePresenter);

  const backendDiagramId = useDiagramStore((s) => s.backendDiagramId);
  const localDiagramId = useDiagramStore((s) => s.diagram.id);
  const diagramId = backendDiagramId || localDiagramId;

  const [workspacePresenter, setWorkspacePresenter] = React.useState<any | null>(null);

  // Poll workspace-level active presentation (e.g. if colleague is presenting another diagram)
  React.useEffect(() => {
    if (isPresenterActive || remotePresenter) {
      setWorkspacePresenter(null);
      return;
    }

    let isMounted = true;
    const checkWorkspacePresenter = async () => {
      try {
        const res = await api.collaborate.getWorkspacePresenter();
        if (isMounted) {
          if (res?.active && res?.presenter) {
            // Only set if different from current diagram
            if (res.presenter.diagramId !== diagramId) {
              setWorkspacePresenter(res.presenter);
            } else {
              setWorkspacePresenter(null);
            }
          } else {
            setWorkspacePresenter(null);
          }
        }
      } catch {}
    };

    checkWorkspacePresenter();
    const interval = setInterval(checkWorkspacePresenter, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isPresenterActive, remotePresenter, diagramId]);

  // If nobody is presenting in current diagram nor workspace, don't show the banner
  if (!isPresenterActive && !remotePresenter && !workspacePresenter) return null;

  const handleJoinWorkspacePresentation = async () => {
    if (!workspacePresenter?.diagramId) return;
    try {
      // Try to load as cloud diagram or preset
      const res = await api.diagrams.getById(workspacePresenter.diagramId);
      if (res?.diagram) {
        useDiagramStore.getState().setDiagram(res.diagram, res.diagram.id);
      } else {
        useDiagramStore.getState().loadPreset(workspacePresenter.diagramId);
      }
    } catch {
      useDiagramStore.getState().loadPreset(workspacePresenter.diagramId);
    }
    useCollaborationStore.getState().setIsFollowingPresenter(true);
    setWorkspacePresenter(null);
  };

  const handleEndPresentation = async () => {
    togglePresenterMode();
    if (diagramId) {
      try {
        await api.collaborate.stopPresenterMode(diagramId);
      } catch {}
    }
  };

  const handleResync = () => {
    useCameraStore.getState().setFreeCamera(false);
    resyncCamera();
  };

  const handleToggleFollow = () => {
    if (!isFollowingPresenter) {
      useCameraStore.getState().setFreeCamera(false);
    }
    toggleFollowPresenter();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className={`fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border px-4 py-1.5 text-xs font-mono shadow-2xl backdrop-blur-xl select-none max-w-[95vw] overflow-x-auto ${
          isPresenterActive
            ? 'border-violet-500/50 bg-slate-950/95 text-slate-100 ring-1 ring-violet-500/30'
            : isCameraDecoupled
            ? 'border-amber-500/50 bg-slate-950/95 text-slate-100 ring-1 ring-amber-500/30'
            : 'border-sky-500/50 bg-slate-950/95 text-slate-100 ring-1 ring-sky-500/30'
        }`}
      >
        {workspacePresenter && !remotePresenter && !isPresenterActive ? (
          /* WORKSPACE COLLEAGUE IS PRESENTING IN ANOTHER DIAGRAM */
          <>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                <span>{workspacePresenter.userName || 'Colega'} está apresentando &ldquo;{workspacePresenter.diagramName}&rdquo;</span>
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            <button
              onClick={handleJoinWorkspacePresentation}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all ring-1 ring-emerald-400/40 cursor-pointer"
              title="Entrar na sala e assistir a apresentação"
            >
              <Eye className="h-3.5 w-3.5 text-white" />
              <span>Entrar e Assistir</span>
            </button>

            <button
              onClick={() => setWorkspacePresenter(null)}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Ocultar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : isPresenterActive ? (
          /* LOCAL USER IS PRESENTING */
          <>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
              </span>
              <span className="font-bold text-violet-300 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                <span>Você está apresentando a arquitetura ao vivo</span>
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            <button
              onClick={handleEndPresentation}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-600/90 hover:bg-red-500 text-white transition-colors"
              title="Encerrar Apresentação"
            >
              <X className="h-3 w-3" />
              <span>Encerrar</span>
            </button>
          </>
        ) : (
          /* REMOTE PEER IS PRESENTING - ALLOW USER TO CHOOSE TO WATCH OR NOT */
          <>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
              </span>
              <span className="font-bold text-sky-300 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                <span>{remotePresenter?.name || 'Colega'} está apresentando</span>
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* If following AND camera was decoupled manually: show resync prompt */}
            {isFollowingPresenter && isCameraDecoupled ? (
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5 animate-spin" />
                  <span>Câmera Livre</span>
                </span>
                <button
                  onClick={handleResync}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/30 transition-all ring-1 ring-sky-300/40"
                  title="Voltar a acompanhar a visão do apresentador"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Ressincronizar com Apresentador</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleToggleFollow}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm ${
                  isFollowingPresenter
                    ? 'bg-sky-600 text-white shadow-sky-500/25 ring-1 ring-white/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {isFollowingPresenter ? (
                  <>
                    <Eye className="h-3.5 w-3.5 text-white" />
                    <span>Assistindo (Câmera Sincronizada)</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                    <span>Assistir Apresentação</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => {
                setRemotePresenter(null);
                if (isFollowingPresenter) {
                  toggleFollowPresenter();
                }
              }}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Ocultar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
