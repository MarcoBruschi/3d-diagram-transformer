'use client';

import React from 'react';
import { useCookieConsentStore } from '@/store/useCookieConsentStore';
import { Settings } from 'lucide-react';

interface TriggerProps {
  className?: string;
  variant?: 'button' | 'link';
}

export function CookiePreferencesTrigger({
  className = '',
  variant = 'button',
}: TriggerProps) {
  const openPreferencesModal = useCookieConsentStore((s) => s.openPreferencesModal);

  if (variant === 'link') {
    return (
      <button
        type="button"
        onClick={openPreferencesModal}
        className={`inline-flex items-center gap-1.5 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500 rounded outline-none cursor-pointer ${className}`}
        aria-label="Abrir configurações de cookies"
      >
        <Settings className="h-3 w-3 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
        <span>Preferências de Cookies</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openPreferencesModal}
      className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-[#1E273A] bg-slate-100 dark:bg-[#0B0E14] px-3.5 py-2 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none ${className}`}
      aria-label="Gerenciar preferências de privacidade e cookies"
    >
      <Settings className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Gerenciar Cookies</span>
    </button>
  );
}
