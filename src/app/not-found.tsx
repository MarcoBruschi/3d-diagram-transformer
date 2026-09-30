import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#07080B] text-white font-sans text-center select-none">
      <div className="max-w-md p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 mb-4 tracking-tighter">
          404
        </div>
        <h2 className="text-xl font-bold mb-2 text-white">Página Não Encontrada</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          O link acessado não existe ou foi digitado com algum caractere incorreto.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/studio"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-500/25 text-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>Abrir Studio 3D</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold rounded-xl transition-all border border-slate-700 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Página Inicial</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
