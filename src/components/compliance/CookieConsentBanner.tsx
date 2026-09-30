'use client';

import React, { useEffect, useState } from 'react';
import { useCookieConsentStore } from '@/store/useCookieConsentStore';
import { CookiePreferencesModal } from './CookiePreferencesModal';
import { Cookie, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function CookieConsentBanner() {
  const hasResponded = useCookieConsentStore((s) => s.hasResponded);
  const initConsent = useCookieConsentStore((s) => s.initConsent);
  const acceptAll = useCookieConsentStore((s) => s.acceptAll);
  const acceptNecessaryOnly = useCookieConsentStore((s) => s.acceptNecessaryOnly);
  const openPreferencesModal = useCookieConsentStore((s) => s.openPreferencesModal);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initConsent();
  }, [initConsent]);

  if (!mounted || hasResponded) {
    return (
      <>
        <CookiePreferencesModal />
      </>
    );
  }

  return (
    <>
      <div
        role="region"
        aria-label="Consentimento de Cookies e Privacidade"
        className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-6 sm:max-w-2xl sm:ml-auto z-40 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
      >
        <div className="rounded-2xl border border-slate-300 dark:border-cyan-500/30 bg-white/95 dark:bg-[#07080B]/95 p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md text-slate-900 dark:text-slate-100 transition-colors">
          {/* Header */}
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-700 dark:text-cyan-400 font-bold mb-2">
            <Cookie className="h-4 w-4" aria-hidden="true" />
            <span>PRIVACY & STORAGE CONTROL // LGPD • GDPR</span>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal mb-4">
            Utilizamos cookies estritamente necessários para viabilizar sessões seguras e faturamento via Stripe. Com sua autorização, utilizamos também telemetria agregada para otimização de performance da engine WebGL 3D. Consulte nossa{' '}
            <Link
              href="/privacy"
              className="text-cyan-600 dark:text-cyan-400 underline font-semibold focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
            >
              Política de Privacidade
            </Link>{' '}
            e{' '}
            <Link
              href="/cookies"
              className="text-cyan-600 dark:text-cyan-400 underline font-semibold focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
            >
              Política de Cookies
            </Link>.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 font-mono text-xs font-bold">
            <button
              type="button"
              onClick={acceptNecessaryOnly}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-[#1E273A] bg-slate-100 dark:bg-[#0B0E14] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-cyan-500/40 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
            >
              Apenas Necessários
            </button>

            <button
              type="button"
              onClick={openPreferencesModal}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-[#1E273A] bg-white dark:bg-[#101520] text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
            >
              Personalizar
            </button>

            <button
              type="button"
              onClick={acceptAll}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-400 dark:hover:bg-cyan-300 text-white dark:text-slate-950 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
            >
              Aceitar Todos
            </button>
          </div>
        </div>
      </div>

      <CookiePreferencesModal />
    </>
  );
}
