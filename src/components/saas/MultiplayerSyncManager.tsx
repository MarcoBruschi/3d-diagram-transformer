'use client';

import { useEffect, useRef } from 'react';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCollaborationStore, RemotePeer } from '@/store/useCollaborationStore';
import { useFeatureGating } from '@/hooks/useFeatureGating';
import { api } from '@/lib/services/apiClient';

const USER_PALETTE = [
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#14B8A6', // Teal
];

export function getStableColorForUser(idOrEmail?: string): string {
  if (!idOrEmail) return USER_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < idOrEmail.length; i++) {
    hash = (hash << 5) - hash + idOrEmail.charCodeAt(i);
    hash |= 0;
  }
  return USER_PALETTE[Math.abs(hash) % USER_PALETTE.length];
}

/**
 * Global Multiplayer Synchronization Manager
 * Runs continuously in all viewport modes (3D, 2D, Split, and Builder)
 * Executes 300ms polling for live diagram mutations, room participants, and presence.
 */
export function MultiplayerSyncManager() {
  const { canUseMultiplayer } = useFeatureGating();
  const isMultiplayerEnabled = useCollaborationStore((s) => s.isMultiplayerEnabled);
  const setPeers = useCollaborationStore((s) => s.setPeers);

  const backendDiagramId = useDiagramStore((s) => s.backendDiagramId);
  const localDiagramId = useDiagramStore((s) => s.diagram.id);
  const diagramName = useDiagramStore((s) => s.diagram.name);
  const diagramId = backendDiagramId || localDiagramId;
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isPollingRef = useRef(false);
  const pauseUntilRef = useRef<number>(0);

  const hasShareToken = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).has('share') ||
    new URLSearchParams(window.location.search).has('token') ||
    new URLSearchParams(window.location.search).has('shareToken')
  );
  const isSharedSession = Boolean(hasShareToken);
  const isValidMultiplayerTarget = Boolean(
    backendDiagramId ||
    isSharedSession ||
    (diagramId && (/^[0-9a-fA-F-]{36}$/.test(diagramId) || diagramId.startsWith('sh_')))
  );
  const canParticipate = Boolean(
    (isAuthenticated || isSharedSession) &&
    (canUseMultiplayer || isSharedSession || Boolean(backendDiagramId)) &&
    isValidMultiplayerTarget
  );

  const myColor = getStableColorForUser(user?.id || user?.email || 'guest');

  useEffect(() => {
    pauseUntilRef.current = 0;
  }, [diagramId, isAuthenticated]);

  useEffect(() => {
    if (!canParticipate || !isMultiplayerEnabled || !isValidMultiplayerTarget || !diagramId) {
      return;
    }

    const pollSync = async () => {
      if (isPollingRef.current) return;
      if (Date.now() < pauseUntilRef.current) return;
      isPollingRef.current = true;

      try {
        const currentUserId = user?.id;
        const pendingMutation = useDiagramStore.getState().pendingLocalMutation;
        const activeNodeId = useDiagramStore.getState().selectedNodeId;

        let res: {
          participants?: any[];
          liveDiagramMutation?: any;
          canonicalDiagramId?: string;
        } | null = null;

        if (pendingMutation) {
          useDiagramStore.getState().clearPendingLocalMutation();
          res = await api.collaborate.sendHeartbeat(
            diagramId,
            pendingMutation.position3D,
            myColor,
            {
              nodeId: pendingMutation.nodeId,
              position3D: pendingMutation.position3D,
              position2D: pendingMutation.position2D,
              nodes: pendingMutation.nodes || (pendingMutation.nodeId ? [
                {
                  id: pendingMutation.nodeId,
                  position3D: pendingMutation.position3D,
                  position2D: pendingMutation.position2D,
                },
              ] : undefined),
              connections: pendingMutation.connections,
              deletedNodeId: pendingMutation.deletedNodeId,
              deletedConnectionId: pendingMutation.deletedConnectionId,
              version: Date.now(),
              lastModifiedBy: currentUserId || 'guest',
            },
            diagramName,
            activeNodeId || undefined
          );
        } else {
          res = await api.collaborate.getParticipants(diagramId);
        }

        if (res && res.participants) {
          const mapped: RemotePeer[] = res.participants
            .filter((p: any) => p.userId !== currentUserId)
            .map((p: any, idx: number) => ({
              id: p.userId || p.id || `peer-${idx}`,
              name: p.name || `Dev #${idx + 1}`,
              avatar: p.avatar || '',
              color: p.color || getStableColorForUser(p.userId || p.name),
              role: p.role || 'viewer',
              cursor3D: [p.cursor?.x || 0, p.cursor?.y || 0, p.cursor?.z || 0],
              activeNodeId: p.activeNodeId || undefined,
              lastPing: Date.now(),
            }));
          setPeers(mapped);

          // Real-time synchronization of remote diagram mutations in any view mode
          if (res.liveDiagramMutation) {
            const mut = res.liveDiagramMutation;
            if (!mut.lastModifiedBy || mut.lastModifiedBy !== currentUserId) {
              useDiagramStore.getState().syncRemoteDiagramMutation(mut);
            }
          }
        }
      } catch (err: any) {
        // Circuit breaker: on 401/403/429, pause to prevent spamming
        const status = err?.status;
        if (status === 401 || status === 403 || status === 429) {
          pauseUntilRef.current = Date.now() + 6000;
        }
      } finally {
        isPollingRef.current = false;
      }
    };

    pollSync();
    const interval = setInterval(pollSync, 600);

    return () => {
      clearInterval(interval);
      api.collaborate.leaveRoom(diagramId).catch(() => {});
    };
  }, [
    canParticipate,
    isMultiplayerEnabled,
    isValidMultiplayerTarget,
    diagramId,
    diagramName,
    myColor,
    setPeers,
    user?.id,
  ]);

  return null;
}
