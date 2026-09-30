'use client';

import React, { useState, useEffect } from 'react';
import { useCookieConsentStore } from '@/store/useCookieConsentStore';
import { X, ShieldCheck, Check, Settings, Info } from 'lucide-react';
import Link from 'next/link';

export function CookiePreferencesModal() {
  const isOpen = useCookieConsentStore((s) => s.isPreferencesModalOpen);
  const closePreferencesModal = useCookieConsentStore((s) => s.closePreferencesModal);
  const currentPrefs = useCookieConsentStore((s) => s.preferences);
  const savePreferences = useCookieConsentStore((s) => s.savePreferences);
  const acceptAll = useCookieConsentStore((s) => s.acceptAll);

  const [analytics, setAnalytics] = useState(currentPrefs.analytics);
  const [functional, setFunctional] = useState(currentPrefs.functional);

  useEffect(() => {
    setAnalytics(currentPrefs.analytics);
    setFunctional(currentPrefs.functional);
  }, [currentPrefs, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePreferencesModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closePreferencesModal]);

  if (!isOpen) return null;

  const handleSave = () => {
    savePreferences({ analytics, functional });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-preferences-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1E273A] bg-white dark:bg-[#0B0E14] shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-[#1E273A] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>CENTRAL DE PRIVACIDADE E COOKIES</span>
            </div>
            <h2 id="cookie-preferences-title" className="text-xl font-bold uppercase tracking-tight">
              Preferências de Armazenamento
            </h2>
          </div>

          <button
            type="button"
            onClick={closePreferencesModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#101520] transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
            aria-label="Fechar painel de preferências"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
          Personalize as categorias de cookies e dados em cache que o Diagram3D pode utilizar no seu navegador. Você pode consultar nossa{' '}
          <Link
            href="/cookies"
            onClick={closePreferencesModal}
            className="text-cyan-600 dark:text-cyan-400 underline font-semibold focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
          >
            Política de Cookies
          </Link>{' '}
          para a lista completa.
        </p>

        {/* Toggles */}
        <div className="space-y-4">
          {/* 1. Necessary (Locked) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#07080B] flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  Estritamente Necessários
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold">
                  SEMPRE ATIVO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Essenciais para autenticação de sessão (JWT), segurança CSRF, integridade do workspace multi-tenant e processamento antifraude de faturamento via Stripe.
              </p>
            </div>
            <div className="pt-1">
              <div className="h-5 w-9 rounded-full bg-cyan-500 flex items-center justify-end px-1 opacity-80 cursor-not-allowed">
                <div className="h-3.5 w-3.5 rounded-full bg-white shadow-xs" />
              </div>
            </div>
          </div>

          {/* 2. Functional */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#07080B] flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  Preferências Funcionais
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Memoriza seu tema de interface (Claro / Escuro), o workspace ativo selecionado e preferências de proporção do visualizador 2D/3D no Studio.
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={functional}
                onClick={() => setFunctional(!functional)}
                className={`h-5 w-9 rounded-full transition-colors flex items-center px-0.5 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none ${
                  functional ? 'bg-cyan-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <div className="h-4 w-4 rounded-full bg-white shadow-xs transition-transform" />
              </button>
            </div>
          </div>

          {/* 3. Analytics / Telemetry */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#07080B] flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                  Telemetria e Performance WebGL
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Coleta anônima de taxas de quadros (FPS), tempo de layout force-directed e contagem de nós para diagnóstico e aprimoramento contínuo dos shaders.
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={analytics}
                onClick={() => setAnalytics(!analytics)}
                className={`h-5 w-9 rounded-full transition-colors flex items-center px-0.5 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none ${
                  analytics ? 'bg-cyan-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <div className="h-4 w-4 rounded-full bg-white shadow-xs transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 dark:border-[#1E273A] flex flex-col sm:flex-row items-center justify-end gap-3 font-mono text-xs font-bold">
          <button
            type="button"
            onClick={acceptAll}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 dark:border-[#1E273A] bg-white dark:bg-[#101520] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
          >
            Aceitar Todos
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
          >
            Salvar Preferências
          </button>
        </div>
      </div>
    </div>
  );
}
