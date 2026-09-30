'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { StudioHeader } from '@/components/layout/StudioHeader';
import { DiagramCanvas } from '@/components/three/Scene/DiagramCanvas';
import { Diagram2DCanvas } from '@/components/diagram-2d/Diagram2DCanvas';
import { ComparisonView } from '@/components/comparison/ComparisonView';
import { FloatingToolbar } from '@/components/toolbar/FloatingToolbar';
import { RadarMinimap } from '@/components/minimap/RadarMinimap';
import { NodeInspector } from '@/components/inspector/NodeInspector';
import { CommandPalette } from '@/components/palette/CommandPalette';
import { VisualDiagramEditor } from '@/components/editor/VisualDiagramEditor';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useAuthStore } from '@/store/useAuthStore';
import { setAccessToken, api } from '@/lib/services/apiClient';

import { LiveMonitoringHUD } from '@/components/saas/LiveMonitoringHUD';
import { MultiplayerSyncManager } from '@/components/saas/MultiplayerSyncManager';
import { PresenterBanner } from '@/components/saas/PresenterBanner';
import { AICopilotDrawer } from '@/components/saas/AICopilotDrawer';
import { SaaSModalsHub } from '@/components/saas/SaaSModalsHub';
import { ARCameraViewer } from '@/components/saas/ARCameraViewer';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { loadDraftOffline } from '@/lib/storage/offlineDiagramStorage';
import {
  Box,
  Shield,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock,
  ExternalLink,
} from 'lucide-react';

export default function StudioPage() {
  const [isMounted, setIsMounted] = useState(false);
  const viewMode = useDiagramStore((s) => s.viewMode);
  const isARActive = useDiagramStore((s) => s.isARActive);
  const setDiagram = useDiagramStore((s) => s.setDiagram);
  const checkSession = useAuthStore((s) => s.checkSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoadingSession = useAuthStore((s) => s.isLoadingSession);
  const joinWorkspace = useAuthStore((s) => s.joinWorkspace);

  const [isSharedLoading, setIsSharedLoading] = useState(false);
  const [isSharedView, setIsSharedView] = useState(() => {
    if (typeof window !== 'undefined') {
      return Boolean(new URLSearchParams(window.location.search).get('share'));
    }
    return false;
  });
  const [isOfflineDraftLoaded, setIsOfflineDraftLoaded] = useState(false);

  // Process invite/join workspace parameter immediately when authenticated
  useEffect(() => {
    if (typeof window === 'undefined' || !isAuthenticated) return;

    const urlParams = new URLSearchParams(window.location.search);
    const inviteParam = urlParams.get('invite') || urlParams.get('join');
    if (inviteParam) {
      joinWorkspace(inviteParam)
        .then((res) => {
          console.log('[Studio] Workspace adicionado com sucesso:', res?.message);
        })
        .catch((err) => {
          console.warn('[Studio Workspace Join URL Error]:', err);
        })
        .finally(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('invite');
          url.searchParams.delete('join');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        });
    }
  }, [isAuthenticated, joinWorkspace]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const oauthToken = urlParams.get('oauth_token');
      if (oauthToken) {
        setAccessToken(oauthToken);
        // Clean URL params without reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }

      const billingParam = urlParams.get('billing');
      const sessionId = urlParams.get('session_id');
      if (billingParam === 'success') {
        // Instantly sync subscription from Stripe to database and update state
        api.billing.sync(sessionId || undefined)
          .then((res) => {
            if (res && res.success) {
              checkSession();
            }
          })
          .catch((err) => {
            console.warn('[Billing Sync Error]:', err);
            checkSession();
          })
          .finally(() => {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
          });
      }

      const shareParam = urlParams.get('share');
      const idParam = urlParams.get('id') || urlParams.get('diagram');

      if (shareParam) {
        setIsSharedLoading(true);
        setIsSharedView(true);
        // Try public share token endpoint first
        api.diagrams.getShared(shareParam)
          .then((res) => {
            if (res && res.diagram) {
              setDiagram(res.diagram.data || res.diagram, res.diagram.id);
              setIsSharedView(true);
            }
          })
          .catch(() => {
            // Fallback to getById in case raw diagram ID was used
            api.diagrams.getById(shareParam)
              .then((res) => {
                if (res && res.diagram) {
                  setDiagram(res.diagram.data || res.diagram, res.diagram.id);
                  setIsSharedView(true);
                }
              })
              .catch((err) => {
                console.warn('[Shared Diagram Load Error]:', err);
              });
          })
          .finally(() => {
            setIsSharedLoading(false);
          });
      } else if (idParam) {
        // Load cloud diagram by ID
        api.diagrams.getById(idParam)
          .then((res) => {
            if (res && res.diagram) {
              setDiagram(res.diagram.data || res.diagram, res.diagram.id);
            }
          })
          .catch((err) => {
            console.warn('[Diagram Load Error]:', err);
          });
      } else {
        // Local-First Persistence: No ID in URL, load offline draft from IndexedDB
        loadDraftOffline()
          .then((draft) => {
            if (draft && draft.nodes && Array.isArray(draft.nodes) && draft.nodes.length > 0) {
              setDiagram(draft);
              setIsOfflineDraftLoaded(true);
            }
          })
          .catch((err) => {
            console.warn('[Offline Draft Load Warning]:', err);
          });
      }
    }
    checkSession();
  }, [checkSession, setDiagram]);

  // Global shortcut: Ctrl+S / Cmd+S to save to cloud
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        useDiagramStore.getState().saveToCloud();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading state during SSR and token/share rehydration to prevent React hydration mismatch
  if (!isMounted || isLoadingSession || isSharedLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-[#07080B] text-slate-800 dark:text-slate-200 font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-500 shadow-xl shadow-sky-500/10">
            <Box className="h-7 w-7 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-sky-600 dark:text-sky-400 font-bold">PRISM Engine</p>
            <div className="flex items-center gap-2 justify-center mt-2 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
              <span>Verificando Sessão e Credenciais...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Effective view mode: strictly locked to '3d' for unauthenticated users
  const effectiveViewMode = isAuthenticated ? viewMode : '3d';

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-slate-100 dark:bg-[#07080B] text-slate-900 dark:text-slate-100 select-none transition-colors duration-200">
      {/* Studio Header */}
      <StudioHeader />

      {/* Guest Mode 3D Viewer Pill Banner */}
      {!isAuthenticated && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101520]/95 border border-[#38BDF8]/40 shadow-xl text-[11px] font-mono text-slate-200 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="h-2 w-2 rounded-full bg-[#38BDF8] animate-pulse" />
          <span className="font-semibold text-[#38BDF8]">VISITANTE:</span>
          <span>MODO DE VISUALIZAÇÃO 3D EXCLUSIVA</span>
          <span className="text-slate-600 dark:text-slate-400">•</span>
          <Link
            href="/login?redirect=/studio"
            className="text-[#38BDF8] hover:text-white underline font-bold transition-colors"
          >
            Fazer Login para Editar
          </Link>
        </div>
      )}

      {/* Main Interactive Viewport */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Strictly 3D Canvas is rendered for unauthenticated users */}
        {effectiveViewMode === '3d' && <DiagramCanvas />}
        {isAuthenticated && effectiveViewMode === '2d' && <Diagram2DCanvas />}
        {isAuthenticated && effectiveViewMode === 'split' && <ComparisonView />}
        {isAuthenticated && effectiveViewMode === 'editor' && <VisualDiagramEditor />}

        {/* Floating Studio Controls */}
        <FloatingToolbar />
        {effectiveViewMode !== 'editor' && <RadarMinimap />}
        {effectiveViewMode !== 'editor' && <NodeInspector />}

        {/* Authenticated-Only Real-Time Live Monitoring Stream HUD */}
        {isAuthenticated && <LiveMonitoringHUD />}

        {/* Authenticated-Only Multiplayer Presenter Mode Banner */}
        {isAuthenticated && <PresenterBanner />}

        {/* Authenticated-Only AI Copilot Architectural Drawer */}
        {isAuthenticated && <AICopilotDrawer />}
      </main>

      {/* Authenticated-Only Overlays & Modals */}
      {isAuthenticated && <MultiplayerSyncManager />}
      {isAuthenticated && <CommandPalette />}

      {/* Authenticated-Only SaaS Feature Modals (Billing, Export, Share, Versions, Diff, IaC, ADR, etc.) */}
      {isAuthenticated && <SaaSModalsHub />}

      {/* Authenticated-Only Real Mobile AR Camera Fullscreen Experience */}
      {isAuthenticated && isARActive && <ARCameraViewer />}
    </div>
  );
}
