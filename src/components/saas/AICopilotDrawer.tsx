'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCopilotStore, CopilotMessage } from '@/store/useCopilotStore';
import { useDiagramStore } from '@/store/useDiagramStore';
import { DiagramNode } from '@/types/diagram';
import { useFeatureGating } from '@/hooks/useFeatureGating';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import {
  X,
  Bot,
  Send,
  Sparkles,
  Zap,
  ShieldAlert,
  ArrowRight,
  Database,
  Shield,
  Layers,
  Trash2,
  Cpu,
  Lock,
} from 'lucide-react';

export function AICopilotDrawer() {
  const { canUseCopilot } = useFeatureGating();
  const openModal = useSaaSModalsStore((s) => s.openModal);
  const isOpen = useCopilotStore((s) => s.isOpen);
  const closeCopilot = useCopilotStore((s) => s.closeCopilot);
  const messages = useCopilotStore((s) => s.messages);
  const isThinking = useCopilotStore((s) => s.isThinking);
  const sendMessage = useCopilotStore((s) => s.sendMessage);
  const executeCopilotAction = useCopilotStore((s) => s.executeCopilotAction);
  const clearHistory = useCopilotStore((s) => s.clearHistory);

  const addNode = useDiagramStore((s) => s.addNode);
  const addConnection = useDiagramStore((s) => s.addConnection);
  const diagram = useDiagramStore((s) => s.diagram);

  const [inputPrompt, setInputPrompt] = useState('');
  const [mutationSuccess, setMutationSuccess] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;
    sendMessage(inputPrompt.trim(), diagram.id, diagram);
    setInputPrompt('');
  };

  const handleExecuteAction = (action: CopilotMessage['diagramAction']) => {
    if (!action) return;

    if (action.type === 'add_node' && action.payload) {
      if (action.payload.newNode) {
        addNode({
          id: action.payload.newNode.id || `node-ai-${Date.now()}`,
          name: action.payload.newNode.name,
          type: action.payload.newNode.type || 'service',
          status: 'active',
          importance: action.payload.newNode.importance || 3,
          description: action.payload.newNode.description || 'Gerado via AI Copilot',
          position2D: action.payload.newNode.position2D || { x: 300, y: 200 },
          position3D: action.payload.newNode.position3D || { x: 0, y: 1.5, z: 0 },
        });
      } else {
        addNode(action.payload);
      }
      if (Array.isArray(action.payload.connections)) {
        action.payload.connections.forEach((c: any, i: number) => {
          addConnection({
            id: c.id || `conn-ai-${Date.now()}-${i}`,
            source: c.source,
            target: c.target,
            type: c.type || 'sync',
            label: c.label || undefined,
          });
        });
      }
      setMutationSuccess(`Nó "${action.payload.newNode?.name || action.payload.name || 'Componente'}" injetado no 3D Canvas!`);
    } else if (action.type === 'add_cache') {
      const newNode: DiagramNode = {
        id: `node-redis-cache-${Date.now()}`,
        name: 'Redis Distributed Cache',
        type: 'cache',
        status: 'active',
        importance: 2,
        description: 'Cluster Redis em memória com TTL de 300s para absorver picos de leitura.',
        position2D: { x: 340, y: 180 },
        position3D: { x: 0, y: 1.5, z: 1.2 },
        properties: { stereotype: 'cache', maxMemory: '16GB' },
      };
      addNode(newNode);

      // Connect to Gateway if exists
      const gw = diagram.nodes.find((n) => n.type === 'gateway');
      if (gw) {
        addConnection({
          id: `conn-gw-cache-${Date.now()}`,
          source: gw.id,
          target: newNode.id,
          type: 'association',
          trafficRate: 8,
          label: 'Cache Hit/Miss',
        });
      }

      setMutationSuccess('Nó "Redis Distributed Cache" injetado no 3D Canvas!');
    } else if (action.type === 'add_waf') {
      const wafNode: DiagramNode = {
        id: `node-waf-shield-${Date.now()}`,
        name: 'Cloudflare WAF / DDoS Shield',
        type: 'security-module',
        status: 'active',
        importance: 4,
        description: 'Perímetro WAF com inspeção de pacotes L7 e proteção contra injeções OWASP.',
        position2D: { x: 120, y: 80 },
        position3D: { x: -4.5, y: 2.5, z: 2.0 },
        properties: { stereotype: 'secure', protection: 'L7 DDoS' },
      };
      addNode(wafNode);

      // Connect to Gateway if exists
      const gw = diagram.nodes.find((n) => n.type === 'gateway');
      if (gw) {
        addConnection({
          id: `conn-waf-gw-${Date.now()}`,
          source: wafNode.id,
          target: gw.id,
          type: 'association',
          trafficRate: 10,
          label: 'mTLS Clean Traffic',
        });
      }

      setMutationSuccess('Nó "Cloudflare WAF Shield" injetado no 3D Canvas!');
    } else if (action.type === 'highlight_bottlenecks') {
      const dbNode = diagram.nodes.find((n) => n.type === 'database');
      if (dbNode) {
        useDiagramStore.getState().selectNode(dbNode.id);
        useDiagramStore.getState().updateNodeStatus(dbNode.id, 'error');
        setMutationSuccess('Gargalo em "Primary Database" destacado na cena 3D!');
      }
    } else if (action.payload) {
      addNode(action.payload);
      setMutationSuccess(`Componente "${action.payload.name || 'Personalizado'}" injetado!`);
    }

    executeCopilotAction(action);
    setTimeout(() => setMutationSuccess(null), 3500);
  };

  const QUICK_PROMPTS = [
    { label: 'Identificar Ponto Único de Falha', text: 'Qual é o ponto de falha único neste diagrama de arquitetura?' },
    { label: 'Adicionar Redis Cache', text: 'Adicione um redis cache entre o API Gateway e o banco para reduzir latência' },
    { label: 'Explicar Fluxo de Dados', text: 'Explique o fluxo de dados desde a requisição do usuário até o banco de dados' },
    { label: 'Auditoria de Segurança / WAF', text: 'Avalie a segurança perimetral e sugira proteção contra ataques DDoS' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 420, opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-14 right-0 bottom-0 z-40 w-96 border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 shadow-2xl backdrop-blur-xl flex flex-col font-mono text-xs select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-500">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-slate-100">AI Copilot</span>
                <span className="rounded bg-sky-500/20 text-sky-400 px-1 text-[9px] font-bold">
                  Gemini Pro
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Assistente de Engenharia & Topologia 3D
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={clearHistory}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Limpar Histórico"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={closeCopilot}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Fechar (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!canUseCopilot ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4 shadow-sm">
              <Lock className="h-6 w-6" />
            </div>
            <span className="rounded-full bg-amber-500/20 text-amber-500 px-3 py-0.5 text-[10px] font-bold uppercase mb-2">
              Recurso Pro & Enterprise
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
              AI Copilot para Otimização de Arquitetura
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed max-w-xs">
              Converse com sua topologia 3D, receba recomendações de resiliência em tempo real e aplique mutações com inteligência artificial.
            </p>
            <button
              onClick={() => openModal('billing')}
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 font-bold text-white text-xs shadow-lg shadow-sky-500/25 hover:bg-sky-500 transition-all active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Fazer Upgrade para Pro (R$ 69/mês)</span>
            </button>
          </div>
        ) : (
          <>
            {/* Quick Actions Pills */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/30 overflow-x-auto whitespace-nowrap space-x-1.5">
              {QUICK_PROMPTS.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(qp.text)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-sky-500 text-[10px] transition-colors"
                >
                  <Sparkles className="h-2.5 w-2.5 text-sky-400" />
                  <span>{qp.label}</span>
                </button>
              ))}
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mutationSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs text-emerald-400 font-bold">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  <span>{mutationSuccess}</span>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-sky-600 text-white rounded-br-none shadow-md shadow-sky-600/20'
                        : m.role === 'system'
                        ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : 'border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Interactive Diagram Action Button */}
                    {m.diagramAction && (
                      <div className="mt-3 pt-2.5 border-t border-slate-300 dark:border-slate-800">
                        <button
                          onClick={() => handleExecuteAction(m.diagramAction)}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500/20 border border-sky-500/50 py-1.5 px-3 text-sky-400 hover:bg-sky-500 hover:text-white transition-all font-bold text-[11px]"
                        >
                          <Zap className="h-3 w-3" />
                          <span>{m.diagramAction.label}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 px-1 mt-1">{m.timestamp}</span>
                </div>
              ))}

              {isThinking && (
                <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                  <span>Analisando topologia 3D com IA...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-2">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Pergunte ou comande a IA..."
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isThinking}
                className="p-2 rounded-xl bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-40 transition-colors shadow-sm"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </motion.aside>
      )}
    </AnimatePresence>
  );
}
