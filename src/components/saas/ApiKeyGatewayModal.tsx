'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/services/apiClient';
import {
  X,
  Key,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Plus,
  Trash2,
  Lock,
  Cpu,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';

import { useFeatureGating } from '@/hooks/useFeatureGating';

interface TelemetrySourceItem {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
}

export function ApiKeyGatewayModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const openModal = useSaaSModalsStore((s) => s.openModal);
  const user = useAuthStore((s) => s.user);
  const { isFree, canUseTelemetry } = useFeatureGating();

  const [keys, setKeys] = useState<TelemetrySourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<TelemetrySourceItem | null>(null);

  const fetchKeys = useCallback(async () => {
    if (isFree || !canUseTelemetry) {
      setKeys([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.telemetry.getSources();
      if (res?.sources) {
        setKeys(res.sources);
      }
    } catch (err: any) {
      const isGated =
        err?.message?.includes('plano Pro') ||
        err?.message?.includes('FEATURE_GATED') ||
        err?.message?.includes('403') ||
        isFree;

      if (!isGated) {
        console.error('[Telemetry Sources Fetch Error]:', err);
        setErrorMessage('Erro ao carregar chaves de API da organização.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isFree, canUseTelemetry]);

  useEffect(() => {
    if (activeModal === 'gateway') {
      setErrorMessage(null);
      setNewlyCreatedKey(null);
      setIsCreating(false);
      setNewKeyName('');

      if (isFree || !canUseTelemetry) {
        setKeys([]);
        setIsLoading(false);
      } else {
        setIsLoading(true);
        api.telemetry
          .getSources()
          .then((res) => {
            if (res?.sources) {
              setKeys(res.sources);
            }
          })
          .catch((err: any) => {
            const isGated =
              err?.message?.includes('plano Pro') ||
              err?.message?.includes('FEATURE_GATED') ||
              err?.message?.includes('403') ||
              isFree;
            if (!isGated) {
              console.error('[Telemetry Sources Fetch Error]:', err);
              setErrorMessage('Erro ao carregar chaves de API da organização.');
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [activeModal, isFree, canUseTelemetry]);

  if (activeModal !== 'gateway') return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const keyName = newKeyName.trim();
    if (!keyName) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Chama api.telemetry.createSource(newKeyName) persistindo no banco e atualizando a lista
      const res = await api.telemetry.createSource(keyName);
      if (res?.source) {
        setKeys((prev) => [res.source, ...prev]);
        setNewlyCreatedKey(res.source);
        setNewKeyName('');
        setIsCreating(false);
      } else {
        throw new Error('Falha ao gerar nova chave de API.');
      }
    } catch (err: any) {
      console.error('[Telemetry Source Creation Error]:', err);
      setErrorMessage(err.message || 'Erro ao gerar chave. Verifique suas permissões de acesso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setDeletingId(id);
    setErrorMessage(null);

    try {
      const res = await api.telemetry.deleteSource(id);
      if (res?.success) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
        if (newlyCreatedKey?.id === id) {
          setNewlyCreatedKey(null);
        }
      } else {
        throw new Error('Falha ao revogar chave de API.');
      }
    } catch (err: any) {
      console.error('[Telemetry Source Revoke Error]:', err);
      setErrorMessage(err.message || 'Erro ao revogar chave.');
    } finally {
      setDeletingId(null);
    }
  };

  const isViewer = user?.role === 'viewer';

  const formatKeyDisplay = (fullKey: string) => {
    if (!fullKey) return '';
    if (fullKey.length <= 16) return fullKey;
    return `${fullKey.substring(0, 14)}••••••••${fullKey.slice(-4)}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>API Key Gateway & Segurança Backend</span>
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-500 font-semibold">
                    Proxy Ativo
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Proteção de segredos: chamadas de IA e telemetria persistem em chaves seguras com rate limit e isolamento
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Metrics Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
              <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Quota de Tokens IA</span>
              <strong className="text-slate-900 dark:text-slate-100 text-sm">
                {user?.plan === 'enterprise' ? 'Customizado' : user?.plan === 'pro' ? 'Ilimitado (Pro)' : '10.000 / mês'}
              </strong>
              <div className="mt-1.5 h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: user?.plan === 'pro' || user?.plan === 'enterprise' ? '100%' : '15%' }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
              <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Gateway & Cache</span>
              <strong className="text-emerald-400 text-sm flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Proxy Ativo
              </strong>
              <p className="text-[9px] text-slate-400 mt-1">PostgreSQL & Ingestão Segura</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
              <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Rate Limit</span>
              <strong className="text-amber-400 text-sm flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" />
                60 RPM
              </strong>
              <p className="text-[9px] text-slate-400 mt-1">Por workspace</p>
            </div>
          </div>

          {/* Newly Created Key Alert */}
          {newlyCreatedKey && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  Nova Chave Gerada com Sucesso!
                </span>
                <button
                  onClick={() => setNewlyCreatedKey(null)}
                  className="text-slate-400 hover:text-slate-200 text-[10px]"
                >
                  Fechar Aviso
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Copie o token agora. Por razões de segurança, o valor completo não será mostrado novamente.
              </p>
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-emerald-500/20 font-mono text-[11px] text-emerald-300">
                <span className="truncate mr-2">{newlyCreatedKey.apiKey}</span>
                <button
                  onClick={() => handleCopy(newlyCreatedKey.id, newlyCreatedKey.apiKey)}
                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 shrink-0"
                >
                  {copiedId === newlyCreatedKey.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedId === newlyCreatedKey.id ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Key List Header */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                Chaves de Acesso da Organização ({keys.length})
              </span>
              {!isViewer && !isFree && canUseTelemetry && (
                <button
                  onClick={() => setIsCreating(true)}
                  disabled={isCreating}
                  className="flex items-center gap-1 text-xs text-sky-400 font-bold hover:underline disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Gerar Nova Chave</span>
                </button>
              )}
            </div>

            {isViewer && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px]">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Seu perfil é Somente Leitura (Viewer). Apenas editores ou administradores podem gerar ou revogar chaves.</span>
              </div>
            )}

            {isCreating && (
              <form onSubmit={handleCreate} className="flex gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Nome da chave (ex: Prod Ingestion Pipeline)"
                  className="flex-1 bg-transparent px-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newKeyName.trim()}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs"
                >
                  Cancelar
                </button>
              </form>
            )}

            {isLoading ? (
              <div className="py-8 px-4 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                <span>Carregando chaves de acesso do banco de dados...</span>
              </div>
            ) : isFree || !canUseTelemetry ? (
              <div className="py-8 px-6 text-center border border-dashed border-sky-500/30 bg-sky-500/5 rounded-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 mx-auto mb-3 border border-sky-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  API Key Gateway & Telemetria em Tempo Real
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                  As chaves de API e a ingestão de telemetria ao vivo estão disponíveis nos planos <strong>Pro</strong> e <strong>Enterprise</strong>. Integre pipelines de CI/CD, métricas de pods Kubernetes e alertas sem expor credenciais.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeModal();
                      openModal('billing');
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Fazer Upgrade para o Pro</span>
                  </button>
                </div>
              </div>
            ) : keys.length === 0 ? (
              <div className="py-8 px-4 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                <Key className="h-7 w-7 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nenhuma chave de API gerada
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Crie uma chave para integrar pipelines de CI/CD, ingestão de telemetria ou automações externas via backend seguro.
                </p>
                {!isViewer && (
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Gerar Primeira Chave</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{k.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          • {new Date(k.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {formatKeyDisplay(k.apiKey)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(k.id, k.apiKey)}
                        className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-400 hover:text-white transition-colors"
                        title="Copiar Chave de API"
                      >
                        {copiedId === k.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      {!isViewer && (
                        <button
                          onClick={() => handleRevoke(k.id)}
                          disabled={deletingId === k.id}
                          className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 disabled:opacity-50 transition-colors"
                          title="Revogar Chave"
                        >
                          {deletingId === k.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
