import { create } from 'zustand';
import { LayerState } from '@/types/diagram';

interface LayersStoreState {
  layers: LayerState;
  isLayersSheetOpen: boolean;
  toggleLayer: (layerName: keyof LayerState) => void;
  setLayer: (layerName: keyof LayerState, visible: boolean) => void;
  resetLayers: () => void;
  setIsLayersSheetOpen: (open: boolean) => void;
}

const DEFAULT_LAYERS: LayerState = {
  infrastructure: true,
  software: true,
  database: true,
  user: true,
  network: true,
  particles: true,
  grid: true,
  labels: true,
  connections: true,
};

export const useLayersStore = create<LayersStoreState>((set) => ({
  layers: DEFAULT_LAYERS,
  isLayersSheetOpen: false,
  toggleLayer: (layerName) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layerName]: !state.layers[layerName],
      },
    })),
  setLayer: (layerName, visible) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layerName]: visible,
      },
    })),
  resetLayers: () => set({ layers: DEFAULT_LAYERS }),
  setIsLayersSheetOpen: (open) => set({ isLayersSheetOpen: open }),
}));
