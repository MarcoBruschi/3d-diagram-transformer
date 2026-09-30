'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error Boundary Caught]:', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#07080B] text-white font-sans text-center select-none m-0">
        <div className="max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-2xl">
            !
          </div>
          <h2 className="text-xl font-bold mb-2 text-white">Falha no Carregamento</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {error?.message || 'Ocorreu um erro crítico ao renderizar a aplicação.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-500/20 text-sm"
            >
              Recarregar Aplicação
            </button>
            <a
              href="/studio"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold rounded-xl transition-all text-sm border border-slate-700"
            >
              Ir para o Studio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
