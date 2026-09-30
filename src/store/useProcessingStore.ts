import { create } from 'zustand';
import { AI_PROCESSING_STAGES, ProcessingStage } from '@/data/mockAI';

interface ProcessingStoreState {
  isProcessing: boolean;
  progress: number;
  currentStage: ProcessingStage | null;
  logs: string[];

  startProcessing: (task?: () => Promise<void> | void) => Promise<void>;
  addLog: (log: string) => void;
  reset: () => void;
}

export const useProcessingStore = create<ProcessingStoreState>((set, get) => ({
  isProcessing: false,
  progress: 0,
  currentStage: null,
  logs: [],

  addLog: (log: string) =>
    set((state) => ({ logs: [...state.logs, log] })),

  startProcessing: async (task) => {
    set({
      isProcessing: true,
      progress: 5,
      currentStage: AI_PROCESSING_STAGES[0],
      logs: [
        '[INIT] Ingesting architectural payload into AI Synthesis Engine...',
        '>>> STAGE 1: ' + AI_PROCESSING_STAGES[0].name,
        ...AI_PROCESSING_STAGES[0].logs.slice(0, 2),
      ],
    });

    let isTaskFinished = false;
    let taskError: any = null;

    // Run the actual background job (e.g. Gemini AI interpretation / layout / routing)
    const runTaskPromise = (async () => {
      try {
        if (task) {
          await task();
        }
      } catch (err) {
        taskError = err;
      } finally {
        isTaskFinished = true;
      }
    })();

    // Animated ticker that smoothly advances stages up to 92% until task resolves
    let currentStageIndex = 0;
    let localProgress = 5;

    const advanceTicker = new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (isTaskFinished) {
          clearInterval(interval);
          resolve();
          return;
        }

        // Advance progress smoothly up to 92%
        if (localProgress < 92) {
          localProgress += Math.floor(Math.random() * 4) + 2;
          if (localProgress > 92) localProgress = 92;

          // Check if we should switch stage
          const targetStageIndex = Math.min(
            AI_PROCESSING_STAGES.length - 1,
            Math.floor((localProgress / 90) * AI_PROCESSING_STAGES.length)
          );

          if (targetStageIndex > currentStageIndex) {
            currentStageIndex = targetStageIndex;
            const newStage = AI_PROCESSING_STAGES[currentStageIndex];
            set((state) => ({
              currentStage: newStage,
              logs: [
                ...state.logs,
                `>>> STAGE ${currentStageIndex + 1}: ${newStage.name}`,
                ...newStage.logs.slice(0, 2),
              ],
            }));
          }

          set({ progress: localProgress });
        }
      }, 120);
    });

    // Wait for both the stage ticker and the actual task promise
    await Promise.all([runTaskPromise, advanceTicker]);

    if (taskError) {
      console.error('[ProcessingStore] Error during processing task:', taskError);
      set((state) => ({
        logs: [
          ...state.logs,
          `[ERROR] Failed to compile architecture: ${taskError?.message || 'Unknown processing error'}`,
        ],
      }));
      await new Promise((r) => setTimeout(r, 600));
      set({ isProcessing: false, progress: 0 });
      throw taskError;
    }

    // AI interpretation & diagram generation are 100% ready!
    set((state) => ({
      progress: 100,
      currentStage: AI_PROCESSING_STAGES[AI_PROCESSING_STAGES.length - 1],
      logs: [
        ...state.logs,
        '>>> [GEMINI-AI] Architectural graph synthesis and node semantics completed.',
        '>>> [READY] Digital 3D Twin successfully compiled. Rendering 3D canvas...',
      ],
    }));

    // Keep modal visible briefly so the user sees the 100% complete state
    await new Promise((r) => setTimeout(r, 450));

    // Finally dismiss the loading modal
    set({
      isProcessing: false,
      progress: 100,
    });
  },

  reset: () =>
    set({
      isProcessing: false,
      progress: 0,
      currentStage: null,
      logs: [],
    }),
}));
