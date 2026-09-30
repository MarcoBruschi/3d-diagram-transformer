'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { api } from '@/lib/services/apiClient';
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  Code2,
  QrCode,
  Users,
  Shield,
  Loader2,
} from 'lucide-react';

export function ShareModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const modalPayload = useSaaSModalsStore((s) => s.modalPayload);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const diagram = useDiagramStore((s) => s.diagram);
  const backendDiagramId = useDiagramStore((s) => s.backendDiagramId);
  const saveToCloud = useDiagramStore((s) => s.saveToCloud);

  const [accessLevel, setAccessLevel] = useState<'public-view' | 'public-edit' | 'private'>('public-view');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function syncShareToken() {
      if (activeModal !== 'share') return;

      setIsGeneratingToken(true);
      try {
        let targetId = modalPayload?.diagramId || backendDiagramId;
        // If diagram not saved in backend yet, auto-save first so it exists in Postgres
        if (!targetId) {
          await saveToCloud();
          targetId = useDiagramStore.getState().backendDiagramId;
        }

        if (targetId && !isCancelled) {
          const res = await api.diagrams.setShare(targetId, accessLevel !== 'private');
          if (res?.diagram?.shareToken && !isCancelled) {
            setShareToken(res.diagram.shareToken);
          }
        }
      } catch (err) {
        console.warn('[ShareModal] Falha ao sincronizar shareToken:', err);
      } finally {
        if (!isCancelled) {
          setIsGeneratingToken(false);
        }
      }
    }

    syncShareToken();

    return () => {
      isCancelled = true;
    };
  }, [activeModal, backendDiagramId, modalPayload, accessLevel, saveToCloud]);

  if (activeModal !== 'share') return null;

  const tokenOrId = shareToken || modalPayload?.diagramId || backendDiagramId || diagram.id;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/studio?share=${tokenOrId}`
    : `https://prism.app/studio?share=${tokenOrId}`;

  const embedSnippet = `<iframe src="${shareUrl}&embed=true" width="100%" height="600" frameborder="0" allow="webxr; fullscreen"></iframe>`;

  const copyToClipboard = (text: string, isEmbed = false) => {
    navigator.clipboard.writeText(text);
    if (isEmbed) {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-500">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Compartilhar Diagrama 3D</span>
                  <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] text-sky-500 font-semibold">
                    Colaboração
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gere links públicos ou incorpore a cena 3D interativa em documentações
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

          <div className="space-y-4">
            {/* Permission Switcher */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                Nível de Privacidade & Acesso
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAccessLevel('public-view')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                    accessLevel === 'public-view'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Globe className="h-4 w-4 mb-1" />
                  <span>Leitura Pública</span>
                </button>

                <button
                  onClick={() => setAccessLevel('public-edit')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                    accessLevel === 'public-edit'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Users className="h-4 w-4 mb-1" />
                  <span>Colaborativo</span>
                </button>

                <button
                  onClick={() => setAccessLevel('private')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                    accessLevel === 'private'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Lock className="h-4 w-4 mb-1" />
                  <span>Apenas Workspace</span>
                </button>
              </div>
            </div>

            {/* Direct Link */}
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Link de Acesso Direto
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-slate-200 outline-none select-all"
                />
                <button
                  onClick={() => copyToClipboard(shareUrl)}
                  className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white shadow hover:bg-sky-500 transition-colors"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="p-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-white"
                  title="Ver QR Code"
                >
                  <QrCode className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            {showQR && (
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <div className="h-32 w-32 bg-white p-2 rounded-lg flex items-center justify-center shadow-md">
                  {/* Simplified SVG QR Code mockup */}
                  <svg className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
                    <rect x="2" y="2" width="6" height="6" />
                    <rect x="16" y="2" width="6" height="6" />
                    <rect x="2" y="16" width="6" height="6" />
                    <path d="M16 16h2v2h-2zM20 20h2v2h-2zM12 7v5M7 12h10M12 17v5" />
                  </svg>
                </div>
                <span className="text-[10px] text-slate-400 mt-2">
                  Aponte a câmera do celular ou headset VR para carregar a cena
                </span>
              </div>
            )}

            {/* Iframe Embed */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>Código para Embed (Notion / Confluence / Docs)</span>
                </label>
                <button
                  onClick={() => copyToClipboard(embedSnippet, true)}
                  className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"
                >
                  {copiedEmbed ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedEmbed ? 'Copiado!' : 'Copiar Iframe'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={2}
                value={embedSnippet}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-2.5 text-[11px] text-slate-700 dark:text-slate-300 font-mono outline-none resize-none select-all"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
