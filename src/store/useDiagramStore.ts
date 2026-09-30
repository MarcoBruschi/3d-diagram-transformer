import { create } from 'zustand';
import { Diagram, DiagramNode, DiagramConnection, ViewMode, NodeStatus } from '@/types/diagram';
import { PRESET_DIAGRAMS } from '@/data/presets';
import { compute3DLayout } from '@/lib/layout/spatialLayout';
import { useCameraStore } from './useCameraStore';
import { useAuthStore } from './useAuthStore';
import { api } from '@/lib/services/apiClient';
import { saveDraftOffline } from '@/lib/storage/offlineDiagramStorage';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

let autoSaveTimer: NodeJS.Timeout | null = null;

interface DiagramStoreState {
  diagram: Diagram;
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  hoveredNodeId: string | null;
  isDraggingNode: boolean;
  viewMode: ViewMode;
  filterStatus: 'all' | 'healthy' | 'warning' | 'error';
  searchQuery: string;
  connectingSourceId: string | null;

  // Real-world AR Mode
  isARActive: boolean;
  setIsARActive: (active: boolean) => void;

  // Cloud Persistence & Auto-Save
  saveStatus: SaveStatus;
  backendDiagramId: string | null;
  lastSavedAt: string | null;
  saveToCloud: () => Promise<void>;
  scheduleAutoSave: () => void;
  setBackendDiagramId: (id: string | null) => void;

  // Actions
  setDiagram: (diagram: Diagram, backendId?: string | null) => void;
  selectNode: (id: string | null) => void;
  selectConnection: (id: string | null) => void;
  hoverNode: (id: string | null) => void;
  setIsDraggingNode: (isDragging: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilterStatus: (filter: 'all' | 'healthy' | 'warning' | 'error') => void;
  setSearchQuery: (query: string) => void;
  setConnectingSourceId: (id: string | null) => void;
  loadPreset: (id: string) => void;
  updateNodeStatus: (nodeId: string, status: NodeStatus) => void;
  getSelectedNode: () => DiagramNode | undefined;
  getSelectedConnection: () => DiagramConnection | undefined;

  // Live Collaborative Sync
  pendingLocalMutation: {
    nodeId?: string;
    position3D?: { x: number; y: number; z: number };
    position2D?: { x: number; y: number };
    nodes?: DiagramNode[];
    connections?: DiagramConnection[];
    deletedNodeId?: string;
    deletedConnectionId?: string;
    version?: number;
    lastModifiedBy?: string;
  } | null;
  clearPendingLocalMutation: () => void;
  syncRemoteNodePosition: (nodeId: string, pos: { x: number; y: number; z: number }) => void;
  syncRemoteDiagramMutation: (mutation: any) => void;

  // Builder Actions
  addNode: (node: DiagramNode) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<DiagramNode>) => void;
  updateNodePosition2D: (id: string, pos: { x: number; y: number }) => void;
  updateNodePosition3D: (id: string, pos: { x: number; y: number; z: number }) => void;
  addConnection: (conn: DiagramConnection) => void;
  removeConnection: (id: string) => void;
  updateConnection: (id: string, updates: Partial<DiagramConnection>) => void;
  clearDiagram: () => void;
}

export const useDiagramStore = create<DiagramStoreState>((set, get) => ({
  diagram: compute3DLayout(PRESET_DIAGRAMS[0]),
  selectedNodeId: null,
  selectedConnectionId: null,
  hoveredNodeId: null,
  isDraggingNode: false,
  viewMode: '3d',
  filterStatus: 'all',
  searchQuery: '',
  connectingSourceId: null,
  isARActive: false,
  setIsARActive: (active) => set({ isARActive: active }),

  saveStatus: 'saved',
  backendDiagramId: null,
  lastSavedAt: null,

  setBackendDiagramId: (id) => set({ backendDiagramId: id }),

  scheduleAutoSave: () => {
    set({ saveStatus: 'unsaved' });

    // 1. Immediately persist changes locally in IndexedDB
    saveDraftOffline(get().diagram).catch((err) => {
      console.warn('[IndexedDB Immediate Save Error]:', err);
    });

    // 2. Debounce cloud and periodic offline save every 2 seconds
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    autoSaveTimer = setTimeout(() => {
      saveDraftOffline(get().diagram).catch((err) => {
        console.warn('[IndexedDB 2s Save Error]:', err);
      });
      get().saveToCloud();
    }, 2000);
  },

  saveToCloud: async () => {
    if (get().saveStatus === 'saving') return;
    const { diagram, backendDiagramId } = get();
    set({ saveStatus: 'saving' });

    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const isValidUuid = typeof backendDiagramId === 'string' && UUID_REGEX.test(backendDiagramId);

    try {
      if (isValidUuid) {
        const res = await api.diagrams.update(backendDiagramId!, {
          name: diagram.name,
          description: diagram.description,
          type: diagram.type,
          data: diagram,
        });
        if (res?.diagram?.id) {
          set({ backendDiagramId: res.diagram.id });
        }
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        set({ saveStatus: 'saved', lastSavedAt: timeStr });
        return;
      }

      // Create new diagram in cloud database
      const res = await api.diagrams.create({
        name: diagram.name || 'Nova Arquitetura 3D',
        description: diagram.description,
        type: diagram.type || 'custom',
        data: diagram,
      });

      if (res && res.diagram && res.diagram.id) {
        set({
          backendDiagramId: res.diagram.id,
          diagram: {
            ...diagram,
            id: res.diagram.id,
          },
        });
      }
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      set({ saveStatus: 'saved', lastSavedAt: timeStr });
    } catch (err: any) {
      if (err?.status === 429) {
        console.warn('[Diagram Save Throttled]: Taxa de requisições excedida momentaneamente. O auto-save tentará sincronizar em seguida.');
      } else {
        console.error('[Diagram Save Error]:', err);
      }
      // Preserve unsaved status so user knows changes have not synced to cloud
      set({ saveStatus: 'unsaved' });
    }
  },

  setDiagram: (diagram, backendId) => {
    const laidOut = compute3DLayout(diagram);
    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const isValidUuid = typeof backendId === 'string' && UUID_REGEX.test(backendId);
    set({
      diagram: laidOut,
      selectedNodeId: null,
      selectedConnectionId: null,
      connectingSourceId: null,
      backendDiagramId: isValidUuid ? backendId : null,
      saveStatus: 'saved',
      lastSavedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    // Automatically center and frame camera to the new diagram
    useCameraStore.getState().resetToDiagram(laidOut.nodes);
  },

  selectNode: (id) =>
    set((state) => ({
      selectedNodeId: id,
      selectedConnectionId: id ? null : state.selectedConnectionId,
    })),
  selectConnection: (id) =>
    set((state) => ({
      selectedConnectionId: id,
      selectedNodeId: id ? null : state.selectedNodeId,
    })),
  hoverNode: (id) => set({ hoveredNodeId: id }),
  setIsDraggingNode: (isDragging) => set({ isDraggingNode: isDragging }),
  setViewMode: (mode) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated && mode !== '3d') {
      console.warn('[ViewMode] Visitantes não autenticados possuem acesso exclusivo à visualização 3D.');
      set({ viewMode: '3d', connectingSourceId: null });
      return;
    }
    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
    const targetMode = isSmallScreen && (mode === 'editor' || mode === '2d' || mode === 'split') ? '3d' : mode;
    set({ viewMode: targetMode, connectingSourceId: null });
  },
  setFilterStatus: (filter) => set({ filterStatus: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setConnectingSourceId: (id) => set({ connectingSourceId: id }),

  loadPreset: (id) => {
    const preset = PRESET_DIAGRAMS.find((p) => p.id === id) || PRESET_DIAGRAMS[0];
    const laidOut = compute3DLayout(preset);
    set({
      diagram: laidOut,
      selectedNodeId: null,
      selectedConnectionId: null,
      backendDiagramId: null,
      saveStatus: 'saved',
      lastSavedAt: null,
    });
    // Automatically center and frame camera to the new preset
    useCameraStore.getState().resetToDiagram(laidOut.nodes);
  },

  updateNodeStatus: (nodeId, status) => {
    set((state) => ({
      diagram: {
        ...state.diagram,
        nodes: state.diagram.nodes.map((n) => (n.id === nodeId ? { ...n, status } : n)),
      },
    }));
  },

  getSelectedNode: () => {
    const { diagram, selectedNodeId } = get();
    return diagram.nodes.find((n) => n.id === selectedNodeId);
  },

  getSelectedConnection: () => {
    const { diagram, selectedConnectionId } = get();
    return diagram.connections.find((c) => c.id === selectedConnectionId);
  },

  // Builder actions
  addNode: (node) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    const currentUserId = useAuthStore.getState().user?.id;
    set((state) => {
      const updatedDiagram = compute3DLayout({
        ...state.diagram,
        nodes: [...state.diagram.nodes, node],
      });
      return {
        diagram: updatedDiagram,
        selectedNodeId: node.id,
        pendingLocalMutation: {
          nodeId: node.id,
          nodes: updatedDiagram.nodes,
          connections: updatedDiagram.connections,
          version: Date.now(),
          lastModifiedBy: currentUserId,
        },
      };
    });
    get().scheduleAutoSave();
  },

  removeNode: (id) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    const currentUserId = useAuthStore.getState().user?.id;
    set((state) => {
      const updatedNodes = state.diagram.nodes.filter((n) => n.id !== id);
      const updatedConnections = state.diagram.connections.filter(
        (c) => c.source !== id && c.target !== id
      );
      const updatedDiagram = {
        ...state.diagram,
        nodes: updatedNodes,
        connections: updatedConnections,
      };
      return {
        diagram: updatedDiagram,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        pendingLocalMutation: {
          deletedNodeId: id,
          nodes: updatedNodes,
          connections: updatedConnections,
          version: Date.now(),
          lastModifiedBy: currentUserId,
        },
      };
    });
    get().scheduleAutoSave();
  },

  updateNode: (id, updates) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    const currentUserId = useAuthStore.getState().user?.id;
    set((state) => {
      const updatedNodes = state.diagram.nodes.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      );
      return {
        diagram: {
          ...state.diagram,
          nodes: updatedNodes,
        },
        pendingLocalMutation: {
          nodeId: id,
          nodes: updatedNodes,
          connections: state.diagram.connections,
          version: Date.now(),
          lastModifiedBy: currentUserId,
        },
      };
    });
    get().scheduleAutoSave();
  },

  updateNodePosition2D: (id, pos) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    const currentUserId = useAuthStore.getState().user?.id;
    set((state) => {
      const updatedNodes = state.diagram.nodes.map((n) =>
        n.id === id ? { ...n, position2D: pos } : n
      );
      return {
        diagram: {
          ...state.diagram,
          nodes: updatedNodes,
        },
        pendingLocalMutation: {
          nodeId: id,
          position2D: pos,
          nodes: updatedNodes,
          version: Date.now(),
          lastModifiedBy: currentUserId,
        },
      };
    });
    get().scheduleAutoSave();
  },

  pendingLocalMutation: null,
  clearPendingLocalMutation: () => set({ pendingLocalMutation: null }),

  syncRemoteNodePosition: (nodeId, pos) => {
    set((state) => {
      // If user is actively dragging this exact node, do not overwrite local drag
      if (state.isDraggingNode && state.selectedNodeId === nodeId) {
        return state;
      }
      const nodeIndex = state.diagram.nodes.findIndex((n) => n.id === nodeId);
      if (nodeIndex === -1) return state;

      const existingNode = state.diagram.nodes[nodeIndex];
      if (
        existingNode.position3D &&
        Math.abs(existingNode.position3D.x - pos.x) < 0.01 &&
        Math.abs(existingNode.position3D.y - pos.y) < 0.01 &&
        Math.abs(existingNode.position3D.z - pos.z) < 0.01
      ) {
        return state;
      }

      const updatedNodes = [...state.diagram.nodes];
      updatedNodes[nodeIndex] = {
        ...existingNode,
        position3D: pos,
      };

      return {
        diagram: {
          ...state.diagram,
          nodes: updatedNodes,
        },
      };
    });
  },

  syncRemoteDiagramMutation: (mutation: any) => {
    if (!mutation) return;

    set((state) => {
      let changed = false;
      let updatedNodes = [...state.diagram.nodes];
      let updatedConnections = [...state.diagram.connections];

      // 1. Direct single node position mutation
      if (mutation.nodeId && (mutation.position3D || mutation.position2D)) {
        if (!(state.isDraggingNode && state.selectedNodeId === mutation.nodeId)) {
          const idx = updatedNodes.findIndex((n) => n.id === mutation.nodeId);
          if (idx !== -1) {
            const current = updatedNodes[idx];
            let nodeModified = false;
            let newPos3D = current.position3D;
            let newPos2D = current.position2D;

            if (mutation.position3D) {
              if (
                !current.position3D ||
                Math.abs(current.position3D.x - mutation.position3D.x) > 0.01 ||
                Math.abs(current.position3D.y - mutation.position3D.y) > 0.01 ||
                Math.abs(current.position3D.z - mutation.position3D.z) > 0.01
              ) {
                newPos3D = mutation.position3D;
                nodeModified = true;
              }
            }

            if (mutation.position2D) {
              if (
                !current.position2D ||
                Math.abs(current.position2D.x - mutation.position2D.x) > 0.01 ||
                Math.abs(current.position2D.y - mutation.position2D.y) > 0.01
              ) {
                newPos2D = mutation.position2D;
                nodeModified = true;
              }
            }

            if (nodeModified) {
              updatedNodes[idx] = {
                ...current,
                position3D: newPos3D,
                position2D: newPos2D,
              };
              changed = true;
            }
          }
        }
      }

      // 2. Synchronize remote nodes (updates or additions)
      if (Array.isArray(mutation.nodes) && mutation.nodes.length > 0) {
        for (const remoteNode of mutation.nodes) {
          if (!remoteNode || !remoteNode.id) continue;
          if (state.isDraggingNode && state.selectedNodeId === remoteNode.id) {
            continue;
          }

          const existingIdx = updatedNodes.findIndex((n) => n.id === remoteNode.id);
          if (existingIdx !== -1) {
            const localNode = updatedNodes[existingIdx];
            let nodeChanged = false;
            const merged = { ...localNode };

            // Check position3D
            if (remoteNode.position3D) {
              if (
                !localNode.position3D ||
                Math.abs(localNode.position3D.x - remoteNode.position3D.x) > 0.01 ||
                Math.abs(localNode.position3D.y - remoteNode.position3D.y) > 0.01 ||
                Math.abs(localNode.position3D.z - remoteNode.position3D.z) > 0.01
              ) {
                merged.position3D = remoteNode.position3D;
                nodeChanged = true;
              }
            }

            // Check position2D
            if (remoteNode.position2D) {
              if (
                !localNode.position2D ||
                Math.abs(localNode.position2D.x - remoteNode.position2D.x) > 0.01 ||
                Math.abs(localNode.position2D.y - remoteNode.position2D.y) > 0.01
              ) {
                merged.position2D = remoteNode.position2D;
                nodeChanged = true;
              }
            }

            // Sync other attributes if present
            const remoteName = (remoteNode as any).name || (remoteNode as any).label;
            if (remoteName && remoteName !== localNode.name) {
              merged.name = remoteName;
              nodeChanged = true;
            }
            if (remoteNode.status && remoteNode.status !== localNode.status) {
              merged.status = remoteNode.status;
              nodeChanged = true;
            }
            if (remoteNode.type && remoteNode.type !== localNode.type) {
              merged.type = remoteNode.type;
              nodeChanged = true;
            }

            if (nodeChanged) {
              updatedNodes[existingIdx] = merged;
              changed = true;
            }
          } else {
            // New node created remotely
            updatedNodes.push(remoteNode as DiagramNode);
            changed = true;
          }
        }
      }

      // 3. Synchronize remote connections (updates or additions)
      if (Array.isArray(mutation.connections) && mutation.connections.length > 0) {
        for (const remoteConn of mutation.connections) {
          if (!remoteConn || !remoteConn.id) continue;
          const connIdx = updatedConnections.findIndex(
            (c) =>
              c.id === remoteConn.id ||
              (c.source === remoteConn.source && c.target === remoteConn.target) ||
              (c.source === remoteConn.target && c.target === remoteConn.source)
          );

          if (connIdx !== -1) {
            const currentConn = updatedConnections[connIdx];
            if (JSON.stringify(currentConn) !== JSON.stringify({ ...currentConn, ...remoteConn })) {
              updatedConnections[connIdx] = { ...currentConn, ...remoteConn };
              changed = true;
            }
          } else {
            // New connection created remotely
            updatedConnections.push(remoteConn as DiagramConnection);
            changed = true;
          }
        }
      }

      // 0. Handle remote node or connection deletion
      if (mutation.deletedNodeId) {
        updatedNodes = updatedNodes.filter((n) => n.id !== mutation.deletedNodeId);
        updatedConnections = updatedConnections.filter(
          (c) => c.source !== mutation.deletedNodeId && c.target !== mutation.deletedNodeId
        );
        changed = true;
      }

      if (mutation.deletedConnectionId) {
        updatedConnections = updatedConnections.filter((c) => c.id !== mutation.deletedConnectionId);
        changed = true;
      }

      if (!changed) return state;

      return {
        diagram: {
          ...state.diagram,
          nodes: updatedNodes,
          connections: updatedConnections,
        },
      };
    });
  },

  updateNodePosition3D: (id, pos) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    const currentUserId = useAuthStore.getState().user?.id;
    set((state) => {
      const updatedNodes = state.diagram.nodes.map((n) =>
        n.id === id ? { ...n, position3D: pos } : n
      );
      return {
        diagram: {
          ...state.diagram,
          nodes: updatedNodes,
        },
        pendingLocalMutation: {
          nodeId: id,
          position3D: pos,
          nodes: updatedNodes,
          version: Date.now(),
          lastModifiedBy: currentUserId,
        },
      };
    });
    get().scheduleAutoSave();
  },

  addConnection: (conn) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    const currentUserId = useAuthStore.getState().user?.id;
    let added = false;
    set((state) => {
      // Check if already exists
      const exists = state.diagram.connections.some(
        (c) =>
          (c.source === conn.source && c.target === conn.target) ||
          (c.source === conn.target && c.target === conn.source)
      );
      if (exists) return state;

      added = true;
      const updatedConnections = [...state.diagram.connections, conn];
      return {
        diagram: {
          ...state.diagram,
          connections: updatedConnections,
        },
        pendingLocalMutation: {
          connections: updatedConnections,
          nodes: state.diagram.nodes,
          version: Date.now(),
          lastModifiedBy: currentUserId,
        },
      };
    });
    if (added) get().scheduleAutoSave();
  },

  removeConnection: (id) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    const currentUserId = useAuthStore.getState().user?.id;
    set((state) => {
      const updatedConnections = state.diagram.connections.filter((c) => c.id !== id);
      return {
        diagram: {
          ...state.diagram,
          connections: updatedConnections,
        },
        selectedConnectionId: state.selectedConnectionId === id ? null : state.selectedConnectionId,
        pendingLocalMutation: {
          deletedConnectionId: id,
          connections: updatedConnections,
          nodes: state.diagram.nodes,
          version: Date.now(),
          lastModifiedBy: currentUserId,
        },
      };
    });
    get().scheduleAutoSave();
  },

  updateConnection: (id, updates) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    const currentUserId = useAuthStore.getState().user?.id;
    set((state) => {
      const updatedConnections = state.diagram.connections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      return {
        diagram: {
          ...state.diagram,
          connections: updatedConnections,
        },
        pendingLocalMutation: {
          connections: updatedConnections,
          nodes: state.diagram.nodes,
          version: Date.now(),
          lastModifiedBy: currentUserId,
        },
      };
    });
    get().scheduleAutoSave();
  },

  clearDiagram: () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    set({
      diagram: {
        id: `custom-${Date.now()}`,
        name: 'New Architecture Canvas',
        type: 'custom',
        description: 'Clean architectural canvas ready for 3D components.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [],
        connections: [],
      },
      selectedNodeId: null,
      backendDiagramId: null,
      saveStatus: 'unsaved',
    });
  },
}));
