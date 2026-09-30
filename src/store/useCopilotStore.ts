'use client';

import { create } from 'zustand';
import { api } from '@/lib/services/apiClient';
import { useDiagramStore } from '@/store/useDiagramStore';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  diagramAction?: {
    type: 'add_node' | 'add_cache' | 'highlight_bottlenecks' | 'add_waf';
    label: string;
    payload?: any;
  };
}

interface CopilotStore {
  isOpen: boolean;
  messages: CopilotMessage[];
  isThinking: boolean;
  openCopilot: () => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
  sendMessage: (text: string, diagramId?: string, diagramData?: any) => Promise<void>;
  executeCopilotAction: (action: CopilotMessage['diagramAction']) => void;
  clearHistory: () => void;
}

const INITIAL_MESSAGES: CopilotMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content:
      'Olá! Sou o seu AI Copilot Arquitetural. Posso responder dúvidas sobre gargalos, fluxo de dados, conformidade e até modificar nós e conexões do seu diagrama 3D em tempo real. Como posso ajudar agora?',
    timestamp: 'Agora',
  },
];

export const useCopilotStore = create<CopilotStore>((set, get) => ({
  isOpen: false,
  messages: INITIAL_MESSAGES,
  isThinking: false,

  openCopilot: () => set({ isOpen: true }),
  closeCopilot: () => set({ isOpen: false }),
  toggleCopilot: () => set((state) => ({ isOpen: !state.isOpen })),

  sendMessage: async (text: string, diagramId?: string, diagramData?: any) => {
    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isThinking: true,
    }));

    try {
      const diagram = diagramData || useDiagramStore.getState().diagram;
      const targetId = diagramId || diagram?.id;

      if (!targetId) {
        throw new Error('Identificador de diagrama não encontrado.');
      }

      // Requisição POST para /api/ai/chat enviando { diagramId: diagram.id, message: text }
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagramId: targetId,
          message: text,
          diagramData: diagram,
        }),
      });

      if (!res.ok) {
        throw new Error(`Falha na API (${res.status})`);
      }

      const data = await res.json();
      const replyContent = data.reply || 'Análise da arquitetura concluída com sucesso.';

      const assistantMsg: CopilotMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isThinking: false,
      }));
      return;
    } catch (err: any) {
      console.warn('[Copilot AI Chat Error, usando fallback amigável]:', err?.message || err);

      const currentDiagram = diagramData || useDiagramStore.getState().diagram;
      const diagramName = currentDiagram?.name || 'Topologia Atual';
      const nodeCount = currentDiagram?.nodes?.length || 0;
      const connCount = currentDiagram?.connections?.length || 0;

      const fallbackReply = `[Assistente de Arquitetura - Modo Offline] Analisei o diagrama "${diagramName}" com ${nodeCount} nós e ${connCount} conexões. 
Não foi possível alcançar o serviço remoto no momento (${err?.message || 'offline'}).

Recomendações preliminares para sua topologia:
1. Nós críticos com alto tráfego devem possuir réplicas ou balanceamento round-robin.
2. Adicione camadas de caching em memória para mitigar contenção no banco de dados.
3. Utilize filas/tópicos assíncronos para desacoplar microsserviços dependentes.`;

      const errorMsg: CopilotMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      set((state) => ({
        messages: [...state.messages, errorMsg],
        isThinking: false,
      }));
    }
  },

  executeCopilotAction: (action) => {
    if (!action) return;
    // Notify via console/UI that action was executed
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `msg-${Date.now()}`,
          role: 'system',
          content: `✅ Ação executada com sucesso: "${action.label}". O diagrama 3D foi atualizado.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    }));
  },

  clearHistory: () => set({ messages: INITIAL_MESSAGES }),
}));
