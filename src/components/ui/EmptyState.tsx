'use client';

import React from 'react';
import { LucideIcon, Box, Plus, RefreshCw } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Box,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl bg-[#0B0E14]/60 border border-[#1E273A] relative overflow-hidden ${className}`}
    >
      {/* Decorative CAD Corner Crosshairs */}
      <span className="absolute top-2 left-2 text-[#38BDF8]/40 font-mono text-[10px] select-none">+</span>
      <span className="absolute top-2 right-2 text-[#38BDF8]/40 font-mono text-[10px] select-none">+</span>
      <span className="absolute bottom-2 left-2 text-[#38BDF8]/40 font-mono text-[10px] select-none">+</span>
      <span className="absolute bottom-2 right-2 text-[#38BDF8]/40 font-mono text-[10px] select-none">+</span>

      {/* Cybernetic Icon Frame */}
      <div className="relative mb-5 p-4 rounded-xl bg-[#101520] border border-[#1E273A] text-[#38BDF8] shadow-[0_0_25px_rgba(56,189,248,0.1)]">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>

      {/* Title & Description */}
      <h3 className="font-mono text-base md:text-lg font-semibold tracking-wider text-slate-100 uppercase mb-2">
        {title}
      </h3>
      <p className="max-w-md text-xs md:text-sm text-slate-400 font-sans leading-relaxed mb-6">
        {description}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium tracking-wider text-[#05070B] bg-[#38BDF8] hover:bg-[#0284C7] active:scale-95 transition-all rounded shadow-[0_0_15px_rgba(56,189,248,0.3)] uppercase"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
          </button>
        )}

        {secondaryLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium tracking-wider text-slate-300 bg-[#101520] hover:bg-[#1E273A] border border-[#1E273A] active:scale-95 transition-all rounded uppercase"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
