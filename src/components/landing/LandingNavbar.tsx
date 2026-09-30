'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Box, ArrowRight, User, LogOut, Layers } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuthStore } from '@/store/useAuthStore';

export function LandingNavbar() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const checkSession = useAuthStore((s) => s.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-slate-200 dark:border-[#1E273A] bg-white/80 dark:bg-[#05070B]/85 px-4 sm:px-6 backdrop-blur-md flex items-center justify-between font-mono text-xs select-none transition-colors duration-200">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <Link href="/" data-cursor="pointer" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 dark:border-[#1E273A] bg-slate-100 dark:bg-[#0B0E14] text-slate-800 dark:text-cyan-400 group-hover:border-cyan-400/50 transition-colors shadow-2xs">
            <Box className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-widest text-slate-900 dark:text-white uppercase">
              PRISM<span className="text-cyan-600 dark:text-cyan-400">.</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <Link
          href="/tutorial"
          data-cursor="pointer"
          className="hidden md:inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-cyan-300 transition-colors"
        >
          <span>Tutorial</span>
        </Link>

        {/* Theme Toggle */}
        <div data-cursor="pointer">
          <ThemeToggle />
        </div>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2.5">
            <Link
              href="/studio"
              data-cursor="pointer"
              className="flex items-center gap-1.5 rounded border border-cyan-500/40 bg-slate-900 dark:bg-cyan-500/10 px-3.5 py-1.5 font-bold text-white dark:text-cyan-300 hover:bg-slate-800 dark:hover:bg-cyan-500/20 transition-all active:scale-95 shadow-sm"
            >
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>Studio 3D</span>
              <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
            </Link>

            <div className="hidden sm:flex items-center gap-2 rounded border border-slate-200 dark:border-[#1E273A] bg-slate-100 dark:bg-[#0B0E14] px-2 py-1">
              <div className="h-5 w-5 rounded-full bg-cyan-700 dark:bg-cyan-600 flex items-center justify-center text-[10px] text-white font-bold">
                {user.name.charAt(0)}
              </div>
              <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[90px]">
                {user.name}
              </span>
            </div>

            <button
              onClick={() => logout()}
              data-cursor="pointer"
              className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-[#101520] transition-colors"
              title="Encerrar Sessão"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              data-cursor="pointer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#101520] font-semibold transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              <span>Entrar</span>
            </Link>

            <Link
              href="/register"
              data-cursor="pointer"
              className="flex items-center gap-1.5 rounded border border-cyan-500/50 bg-slate-900 dark:bg-cyan-500/20 px-3.5 py-1.5 font-bold text-white dark:text-cyan-200 hover:bg-slate-800 dark:hover:bg-cyan-500/30 transition-all active:scale-95"
            >
              <span>Criar Conta</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
