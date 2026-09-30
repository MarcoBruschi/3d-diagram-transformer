'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useProcessingStore } from '@/store/useProcessingStore';
import { Cpu, Terminal, CheckCircle2 } from 'lucide-react';

export function ProcessingHUD() {
  const isProcessing = useProcessingStore((s) => s.isProcessing);
  const progress = useProcessingStore((s) => s.progress);
  const currentStage = useProcessingStore((s) => s.currentStage);
  const logs = useProcessingStore((s) => s.logs);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-xl rounded-xl border border-sky-400/50 dark:border-sky-500/40 bg-white dark:bg-slate-950 p-6 shadow-2xl text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-500/50">
              <Cpu className="h-4 w-4 text-sky-600 dark:text-sky-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-sky-600 dark:text-sky-400 uppercase">
                  AI SYNTHESIS ENGINE
                </span>
                <span className="rounded bg-sky-100 dark:bg-sky-950 px-1.5 py-0.2 text-[10px] text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800/60 font-semibold">
                  ONLINE
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {currentStage?.name || 'Processing Architecture Diagram...'}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-sky-600 dark:text-sky-400">{progress}%</div>
            <span className="text-[10px] text-slate-500">STAGE {currentStage ? currentStage.progressStart < 50 ? '1/3' : '2/3' : '1/3'}</span>
          </div>
        </div>

        {/* Progress Bar with glowing pulse */}
        <div className="mt-4">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-900">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-400 to-sky-400"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span>{currentStage?.description || 'Synthesizing graph structure...'}</span>
            <span>{progress === 100 ? 'READY' : 'ANALYZING'}</span>
          </div>
        </div>

        {/* Live Terminal Log Output */}
        <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-900 bg-slate-100/90 dark:bg-black/60 p-3 shadow-inner">
          <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-900 pb-2 text-[10px] text-slate-500">
            <Terminal className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>NEURAL DECODER TELEMETRY STREAM</span>
          </div>
          <div className="mt-2 h-36 overflow-y-auto space-y-1 text-[10.5px] leading-relaxed scrollbar-thin">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.startsWith('>>>')
                    ? 'font-bold text-sky-600 dark:text-sky-300'
                    : log.includes('[SEMANTICS]') || log.includes('[READY]')
                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    : log.includes('[INFERENCE]')
                    ? 'text-violet-700 dark:text-violet-300'
                    : 'text-slate-600 dark:text-slate-400'
                }
              >
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
