'use client';

import { create } from 'zustand';

export type SaaSModalType =
  | 'auth'
  | 'billing'
  | 'export'
  | 'templates'
  | 'share'
  | 'versions'
  | 'diff'
  | 'iac'
  | 'adr'
  | 'plugins'
  | 'webxr'
  | 'enterprise'
  | 'gateway'
  | 'monitoring'
  | 'comments'
  | 'openDiagram'
  | 'team';

interface SaaSModalsStore {
  activeModal: SaaSModalType | null;
  modalPayload: any | null;
  openModal: (type: SaaSModalType, payload?: any) => void;
  closeModal: () => void;
}

export const useSaaSModalsStore = create<SaaSModalsStore>((set) => ({
  activeModal: null,
  modalPayload: null,
  openModal: (type, payload = null) => set({ activeModal: type, modalPayload: payload }),
  closeModal: () => set({ activeModal: null, modalPayload: null }),
}));
