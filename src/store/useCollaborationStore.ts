'use client';

import { create } from 'zustand';

export interface RemotePeer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: 'admin' | 'editor' | 'viewer';
  cursor3D: [number, number, number];
  activeNodeId?: string;
  lastPing: number;
}

export interface NodeComment {
  id: string;
  nodeId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  content: string;
  createdAt: string;
  resolved: boolean;
}

export interface RemotePresenterCamera {
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export interface RemotePresenterInfo {
  userId: string;
  name: string;
  camera?: RemotePresenterCamera;
}

interface CollaborationStore {
  peers: RemotePeer[];
  isPresenterActive: boolean;
  presenterName: string | null;
  isFollowingPresenter: boolean;
  remotePresenter: RemotePresenterInfo | null;
  remotePresenterCamera: RemotePresenterCamera | null;
  isCameraDecoupled: boolean;
  comments: Record<string, NodeComment[]>; // nodeId -> comments
  isMultiplayerEnabled: boolean;

  setPeers: (peers: RemotePeer[]) => void;
  setMultiplayerEnabled: (enabled: boolean) => void;
  setRemotePresenter: (presenter: RemotePresenterInfo | null) => void;
  setRemotePresenterCamera: (camera: RemotePresenterCamera | null) => void;
  setIsFollowingPresenter: (following: boolean) => void;
  setIsCameraDecoupled: (decoupled: boolean) => void;
  resyncCamera: () => void;
  togglePresenterMode: (presenterName?: string) => void;
  toggleFollowPresenter: () => void;
  updatePeerCursor: (peerId: string, position: [number, number, number]) => void;
  addComment: (nodeId: string, authorName: string, content: string) => void;
  toggleCommentResolved: (nodeId: string, commentId: string) => void;
}

export const useCollaborationStore = create<CollaborationStore>((set) => ({
  peers: [],
  isPresenterActive: false,
  presenterName: null,
  isFollowingPresenter: false,
  remotePresenter: null,
  remotePresenterCamera: null,
  isCameraDecoupled: false,
  comments: {},
  isMultiplayerEnabled: true,

  setPeers: (peers) => set({ peers }),
  setMultiplayerEnabled: (enabled) => set({ isMultiplayerEnabled: enabled }),
  setRemotePresenter: (presenter) =>
    set({
      remotePresenter: presenter,
      remotePresenterCamera: presenter?.camera || null,
    }),
  setRemotePresenterCamera: (camera) =>
    set((state) => ({
      remotePresenterCamera: camera,
      remotePresenter: state.remotePresenter
        ? { ...state.remotePresenter, camera: camera || undefined }
        : null,
    })),
  setIsFollowingPresenter: (following) => set({ isFollowingPresenter: following, isCameraDecoupled: false }),
  setIsCameraDecoupled: (decoupled) => set({ isCameraDecoupled: decoupled }),
  resyncCamera: () => set({ isFollowingPresenter: true, isCameraDecoupled: false }),

  togglePresenterMode: (presenterName = 'Apresentador') =>
    set((state) => ({
      isPresenterActive: !state.isPresenterActive,
      presenterName: !state.isPresenterActive ? presenterName : null,
      isFollowingPresenter: false,
      isCameraDecoupled: false,
    })),

  toggleFollowPresenter: () =>
    set((state) => ({
      isFollowingPresenter: !state.isFollowingPresenter,
      isCameraDecoupled: false,
    })),

  updatePeerCursor: (peerId, position) =>
    set((state) => ({
      peers: state.peers.map((p) =>
        p.id === peerId ? { ...p, cursor3D: position, lastPing: Date.now() } : p
      ),
    })),

  addComment: (nodeId, authorName, content) =>
    set((state) => {
      const newComment: NodeComment = {
        id: `cmt-${Date.now()}`,
        nodeId,
        authorName,
        authorRole: 'Team Member',
        content,
        createdAt: 'Agora',
        resolved: false,
      };
      const existing = state.comments[nodeId] || [];
      return {
        comments: {
          ...state.comments,
          [nodeId]: [newComment, ...existing],
        },
      };
    }),

  toggleCommentResolved: (nodeId, commentId) =>
    set((state) => {
      const list = state.comments[nodeId] || [];
      return {
        comments: {
          ...state.comments,
          [nodeId]: list.map((c) =>
            c.id === commentId ? { ...c, resolved: !c.resolved } : c
          ),
        },
      };
    }),
}));
