'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/services/apiClient';
import {
  X,
  FileCheck2,
  Copy,
  Check,
  Download,
  Sparkles,
  History,
  Plus,
  AlertCircle,
  Loader2,
  Calendar,
  User as UserIcon,
} from 'lucide-react';

interface DiagramAdrRecord {
  id: string;
  diagramId: string;
  title: string;
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  context: string;
  decision: string;
  consequences: string;
  createdAt: string;
  creator?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
}

export function ADRGeneratorModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const user = useAuthStore((s) => s.user);

  const diagram = useDiagramStore((s) => s.diagram);
  const backendDiagramId = useDiagramStore((s) => s.backendDiagramId);
  const setBackendDiagramId = useDiagramStore((s) => s.setBackendDiagramId);
  const saveToCloud = useDiagramStore((s) => s.saveToCloud);

  const [activeTab, setActiveTab] = useState<'create' | 'view' | 'history'>('create');
  const [decisionTitle, setDecisionTitle] = useState('');
  const [userRationale, setUserRationale] = useState('');
  const [status, setStatus] = useState<'accepted' | 'proposed' | 'deprecated' | 'superseded'>('accepted');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentMarkdown, setCurrentMarkdown] = useState<string>('');
  const [currentAdr, setCurrentAdr] = useState<DiagramAdrRecord | null>(null);
  const [savedAdrs, setSavedAdrs] = useState<DiagramAdrRecord[]>([]);
  const [copied, setCopied] = useState(false);

  // Load existing ADRs when modal is opened
  useEffect(() => {
    if (activeModal !== 'adr') return;

    setDecisionTitle(`Adoção de Arquitetura 3D para ${diagram.name}`);
    setUserRationale('Garantir isolamento modular, escalabilidade elástica e observabilidade tridimensional.');
    setErrorMessage(null);

    const targetId = backendDiagramId || diagram.id;
    if (targetId) {
      setIsLoadingHistory(true);
      api.diagrams
        .listAdrs(targetId)
        .then((res) => {
          if (res?.adrs && res.adrs.length > 0) {
            setSavedAdrs(res.adrs);
            const latest = res.adrs[0];
            setCurrentAdr(latest);
            setCurrentMarkdown(buildMarkdownFromAdr(latest, diagram.name));
            setActiveTab('view');
          } else {
            setActiveTab('create');
          }
        })
        .catch((err) => {
          console.warn('[ADR Load Error]:', err);
          setActiveTab('create');
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    }
  }, [activeModal, backendDiagramId, diagram.id, diagram.name]);

  if (activeModal !== 'adr') return null;

  function buildMarkdownFromAdr(adr: DiagramAdrRecord, diagramName: string): string {
    return `# ADR: ${adr.title}

* **Status:** \`${adr.status.toUpperCase()}\`
* **Data:** ${new Date(adr.createdAt).toLocaleDateString('pt-BR')}
* **Autor:** ${adr.creator?.name || adr.creator?.email || 'Arquiteto Responsável'}
* **Topologia:** ${diagramName} (${diagram.nodes.length} nós, ${diagram.connections.length} enlaces)

---

## 1. Contexto & Desafio de Arquitetura
${adr.context}

## 2. Decisão Técnica Adotada
${adr.decision}

## 3. Consequências & Riscos Operacionais
${adr.consequences}

---
*Gerado automaticamente pelo 3D Diagram Transformer AI Copilot.*
`;
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionTitle.trim()) {
      setErrorMessage('Por favor, informe o título da decisão de arquitetura.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const targetId = diagram.id || backendDiagramId || 'default-diagram';

      // Chama api.diagrams.createAdr(diagram.id, { decisionTitle, userRationale })
      const res = await api.diagrams.createAdr(targetId, {
        decisionTitle: decisionTitle.trim(),
        userRationale: userRationale.trim(),
        status,
        diagramData: diagram,
        diagramName: diagram.name,
      });

      if (res?.diagramId && !backendDiagramId) {
        setBackendDiagramId(res.diagramId);
      }

      if (res?.adr) {
        setCurrentAdr(res.adr);
        setCurrentMarkdown(res.markdown || buildMarkdownFromAdr(res.adr, diagram.name));
        setSavedAdrs((prev) => [res.adr, ...prev]);
        setActiveTab('view');
      } else {
        throw new Error('Falha ao obter ADR gerado pelo servidor.');
      }
    } catch (err: any) {
      console.error('[ADR Generation Error]:', err);
      setErrorMessage(err.message || 'Erro ao gerar e persistir ADR. Verifique a conexão com o servidor.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!currentMarkdown) return;
    navigator.clipboard.writeText(currentMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentMarkdown) return;
    const blob = new Blob([currentMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanName = (currentAdr?.title || 'adr').toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.download = `ADR-${cleanName}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectHistoricalAdr = (adr: DiagramAdrRecord) => {
    setCurrentAdr(adr);
    setCurrentMarkdown(buildMarkdownFromAdr(adr, diagram.name));
    setActiveTab('view');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-[95vw] sm:w-[90vw] md:max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 sm:p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 shrink-0">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div className="truncate">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 truncate">
                  <span>Architecture Decision Record (ADR)</span>
                  <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-400 font-semibold shrink-0">
                    Michael Nygard / MADR
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Documentação formal de decisões técnicas sincronizada e persistida no PostgreSQL
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-100 transition-colors shrink-0"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 text-xs shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg font-bold transition-colors shrink-0 ${
                  activeTab === 'create'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nova Decisão</span>
              </button>

              {currentMarkdown && (
                <button
                  onClick={() => setActiveTab('view')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    activeTab === 'view'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Visualizar Documento</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  activeTab === 'history'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Histórico ({savedAdrs.length})</span>
              </button>
            </div>

            {activeTab === 'view' && currentMarkdown && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 hover:text-white"
                  title="Copiar Markdown para Área de Transferência"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 transition-colors"
                  title="Baixar arquivo .md"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar .md</span>
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: Create Form */}
          {activeTab === 'create' && (
            <form onSubmit={handleGenerate} className="flex-1 flex flex-col overflow-y-auto space-y-4 pr-1">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Título da Decisão Arquitetural *
                </label>
                <input
                  type="text"
                  value={decisionTitle}
                  onChange={(e) => setDecisionTitle(e.target.value)}
                  placeholder="Ex: Adoção de Redis Cluster para Cache Distribuído de Alta Disponibilidade"
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Justificativa Técnica & Requisitos Não-Funcionais
                </label>
                <textarea
                  value={userRationale}
                  onChange={(e) => setUserRationale(e.target.value)}
                  placeholder="Descreva a motivação: latência elevada, necessidade de resiliência, picos de carga esperados ou conformidade..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Status da Decisão
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="accepted">Aceito / Aprovado (accepted)</option>
                    <option value="proposed">Proposto / Sob Revisão (proposed)</option>
                    <option value="deprecated">Depreciado (deprecated)</option>
                    <option value="superseded">Substituído (superseded)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Topologia Alvo
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                    <span className="truncate">{diagram.name}</span>
                    <span className="text-[10px] text-amber-500 font-bold shrink-0">
                      {diagram.nodes.length} nós / {diagram.connections.length} enlaces
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating || !decisionTitle.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analisando Grafo e Gerando ADR com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Gerar ADR com IA</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Document View */}
          {activeTab === 'view' && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-3">
              {currentAdr && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{currentAdr.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {currentAdr.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-[10px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(currentAdr.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-3 w-3" />
                      {currentAdr.creator?.name || currentAdr.creator?.email || user?.name || 'Autor'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 p-4 font-mono text-[11px] text-slate-200 leading-relaxed shadow-inner">
                <pre className="whitespace-pre-wrap">{currentMarkdown}</pre>
              </div>

              {/* View Tab Footer Actions: Copiar ou Baixar */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80">
                <span className="text-[11px] text-slate-400">
                  Formato MADR / Markdown gerado com sucesso
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar Markdown'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Baixar Arquivo (.md)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: History List */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  <span>Carregando registros do banco de dados...</span>
                </div>
              ) : savedAdrs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <FileCheck2 className="h-8 w-8 mx-auto mb-2 opacity-40 text-amber-500" />
                  <p className="font-semibold text-slate-300">Nenhum ADR persistido para este diagrama</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Crie o primeiro registro de decisão formal clicando na aba &quot;Nova Decisão&quot;.
                  </p>
                </div>
              ) : (
                savedAdrs.map((adr) => (
                  <div
                    key={adr.id}
                    onClick={() => handleSelectHistoricalAdr(adr)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{adr.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {adr.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-3">
                        <span>{new Date(adr.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        <span>{adr.creator?.name || adr.creator?.email || 'Autor'}</span>
                      </div>
                    </div>

                    <button className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors">
                      Ver Documento
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
