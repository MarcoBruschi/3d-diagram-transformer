import { create } from 'zustand';
import { CameraPreset, Position3D, DiagramNode } from '@/types/diagram';

interface CameraStoreState {
  preset: CameraPreset;
  targetPosition: Position3D | null;
  targetLookAt: Position3D | null;
  targetBoundingCenter: Position3D | null;
  targetBoundingRadius: number;
  resetTrigger: number;
  isCinematicActive: boolean;
  isFreeCamera: boolean;

  setCameraPreset: (preset: CameraPreset) => void;
  focusOnNode: (position: Position3D) => void;
  resetCamera: () => void;
  resetToDiagram: (nodes: DiagramNode[]) => void;
  toggleCinematic: () => void;
  toggleFreeCamera: () => void;
  setFreeCamera: (enabled: boolean) => void;
}

export const useCameraStore = create<CameraStoreState>((set) => ({
  preset: 'overview',
  targetPosition: null,
  targetLookAt: null,
  targetBoundingCenter: null,
  targetBoundingRadius: 10,
  resetTrigger: 0,
  isCinematicActive: false,
  isFreeCamera: false,

  setCameraPreset: (preset) =>
    set({
      preset,
      isCinematicActive: preset === 'cinematic',
      targetPosition: null,
      targetLookAt: null,
    }),

  focusOnNode: (position) =>
    set({
      preset: 'focus',
      isCinematicActive: false,
      targetPosition: { x: position.x + 2.5, y: position.y + 1.8, z: position.z + 4.5 },
      targetLookAt: { x: position.x, y: position.y, z: position.z },
    }),

  resetCamera: () =>
    set((state) => ({
      preset: 'overview',
      targetPosition: state.targetBoundingCenter
        ? {
            x: state.targetBoundingCenter.x,
            y: state.targetBoundingCenter.y + state.targetBoundingRadius * 0.38,
            z: state.targetBoundingCenter.z + state.targetBoundingRadius * 1.5,
          }
        : { x: 0, y: 6, z: 15 },
      targetLookAt: state.targetBoundingCenter || { x: 0, y: 0, z: 0 },
      isCinematicActive: false,
      resetTrigger: state.resetTrigger + 1,
    })),

  resetToDiagram: (nodes) => {
    if (!nodes || nodes.length === 0) {
      set((state) => ({
        preset: 'overview',
        targetPosition: { x: 0, y: 6, z: 15 },
        targetLookAt: { x: 0, y: 0, z: 0 },
        targetBoundingCenter: { x: 0, y: 0, z: 0 },
        targetBoundingRadius: 10,
        isCinematicActive: false,
        resetTrigger: state.resetTrigger + 1,
      }));
      return;
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    nodes.forEach((n) => {
      const p = n.position3D || { x: 0, y: 0, z: 0 };
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    const dx = maxX - minX;
    const dy = maxY - minY;
    const dz = maxZ - minZ;
    const maxSpan = Math.max(dx, dy, dz, 6);
    const distance = Math.max(12, maxSpan * 1.4 + 4);

    set((state) => ({
      preset: 'overview',
      targetPosition: {
        x: centerX,
        y: centerY + distance * 0.35,
        z: centerZ + distance,
      },
      targetLookAt: {
        x: centerX,
        y: centerY,
        z: centerZ,
      },
      targetBoundingCenter: { x: centerX, y: centerY, z: centerZ },
      targetBoundingRadius: maxSpan,
      isCinematicActive: false,
      resetTrigger: state.resetTrigger + 1,
    }));
  },

  toggleCinematic: () =>
    set((state) => ({
      isCinematicActive: !state.isCinematicActive,
      preset: !state.isCinematicActive ? 'cinematic' : 'orbit',
    })),

  toggleFreeCamera: () =>
    set((state) => ({
      isFreeCamera: !state.isFreeCamera,
    })),

  setFreeCamera: (enabled) =>
    set({
      isFreeCamera: enabled,
    }),
}));
