'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useProcessingStore } from '@/store/useProcessingStore';
import { useAuthStore } from '@/store/useAuthStore';
import { diagramService } from '@/lib/services/diagramService';
import { PRESET_DIAGRAMS } from '@/data/presets';
import { ArchitectureEditor } from '../diagram-editor/ArchitectureEditor';
import {
  X,
  UploadCloud,
  FileText,
  Sparkles,
  Layers,
  FileCode,
  Image as ImageIcon,
  Lock,
  AlertTriangle,
  Key,
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'upload' | 'text' | 'presets'>('upload');
  const [importError, setImportError] = useState<{ code?: string; message: string } | null>(null);
  const [userApiKey, setUserApiKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : ''));
  const [lastFile, setLastFile] = useState<File | null>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setDiagram = useDiagramStore((s) => s.setDiagram);
  const loadPreset = useDiagramStore((s) => s.loadPreset);
  const startProcessing = useProcessingStore((s) => s.startProcessing);

  const processFile = useCallback(
    async (fileToProcess: File) => {
      setImportError(null);
      try {
        await startProcessing(async () => {
          const diagram = await diagramService.analyzeFile(fileToProcess);
          setDiagram(diagram);
        });
        onClose();
        router.push('/studio');
      } catch (err: any) {
        console.error('[UploadModal] Failed to analyze file:', err);
        setImportError({
          code: err?.code || 'INVALID_GEMINI_KEY',
          message: err?.message || 'Falha ao processar diagrama com a Google Gemini API.',
        });
      }
    },
    [onClose, startProcessing, setDiagram, router]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!useAuthStore.getState().isAuthenticated) {
        onClose();
        router.push('/login?redirect=/studio');
        return;
      }

      if (acceptedFiles.length === 0) return;
      let file = acceptedFiles[0];

      if (file.size > 10 * 1024 * 1024) {
        setImportError({
          code: 'PAYLOAD_TOO_LARGE',
          message: 'O arquivo selecionado excede o limite máximo de 10MB.',
        });
        return;
      }

      if (file.type.startsWith('image/')) {
        const { compressImage } = await import('@/lib/upload/imageCompressor');
        const compressedResult = await compressImage(file);
        file = compressedResult.file;
      }

      setLastFile(file);
      await processFile(file);
    },
    [onClose, router, processFile]
  );

  const handleRetryWithKey = async () => {
    if (!lastFile) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', userApiKey.trim());
    }
    await processFile(lastFile);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.bmp', '.gif'],
      'application/xml': ['.xml', '.drawio', '.bpmn', '.graphml'],
      'text/xml': ['.xml', '.drawio', '.bpmn', '.graphml'],
      'application/json': ['.json'],
      'text/plain': ['.txt', '.puml', '.mmd', '.mermaid', '.plantuml'],
    },
  });

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 isolate flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Universal Diagram Ingestion</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Transforms images (PNG/JPG/SVG), Draw.io/XML, BPMN, Mermaid, and JSON into a 3D spatial twin.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
            title="Fechar Modal (Esc ou clique fora)"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Visitor Warning Banner */}
        {!isAuthenticated && (
          <div className="mt-4 rounded-xl border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/40 p-3.5 flex items-center justify-between text-xs font-sans">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Lock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>A ingestão de diagramas requer login. Visitantes têm acesso somente para visualizar diagramas em 3D.</span>
            </div>
            <Link
              href="/login?redirect=/studio"
              onClick={onClose}
              className="rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 transition-colors whitespace-nowrap shrink-0 ml-3"
            >
              Fazer Login
            </Link>
          </div>
        )}

        {/* Import Error Banner (Blocking Feedback) */}
        {importError && (
          <div className="mt-4 rounded-xl border border-rose-500/70 bg-rose-50 dark:bg-rose-950/40 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-rose-800 dark:text-rose-200">
                  Importação Bloqueada: {importError.code === 'MISSING_GEMINI_KEY' ? 'Chave de API Ausente' : 'Chave de API Inválida ou Quota Excedida'}
                </h4>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed font-sans">
                  {importError.message}
                </p>
              </div>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row items-center gap-2 font-mono">
              <div className="relative flex-1 w-full">
                <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="password"
                  placeholder="Cole sua Google Gemini API Key (ex: AIzaSy...)"
                  value={userApiKey}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    setUserApiKey(val);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('gemini_api_key', val);
                    }
                  }}
                  className="w-full rounded border border-rose-300 dark:border-rose-800/80 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>
              {lastFile && (
                <button
                  onClick={handleRetryWithKey}
                  disabled={!userApiKey.trim()}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shrink-0 whitespace-nowrap shadow-xs"
                >
                  Salvar e Tentar Novamente
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="mt-4 flex border-b border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              tab === 'upload'
                ? 'border-sky-500 text-sky-700 dark:text-sky-300 font-semibold bg-sky-50 dark:bg-slate-900/60'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Dropzone File (All Formats)</span>
          </button>

          <button
            onClick={() => setTab('text')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              tab === 'text'
                ? 'border-sky-500 text-sky-700 dark:text-sky-300 font-semibold bg-sky-50 dark:bg-slate-900/60'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span>Text / Mermaid / XML Editor</span>
          </button>

          <button
            onClick={() => setTab('presets')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              tab === 'presets'
                ? 'border-sky-500 text-sky-700 dark:text-sky-300 font-semibold bg-sky-50 dark:bg-slate-900/60'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Preset Library</span>
          </button>
        </div>

        {/* Content Tabs */}
        <div className="mt-4">
          {/* TAB 1: DROPZONE */}
          {tab === 'upload' && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
                  isDragActive
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/20 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/30 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 mb-3 shadow-xs">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isDragActive ? 'Release to ingest diagram...' : 'DROP YOUR DIAGRAM HERE'}
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Drag and drop any diagram, architectural schema, or exported project file
                </p>

                <div className="mt-4 flex items-center gap-1.5 flex-wrap justify-center text-[10px] font-mono">
                  <span className="rounded border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 text-sky-700 dark:text-sky-300">PNG</span>
                  <span className="rounded border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 text-sky-700 dark:text-sky-300">JPG</span>
                  <span className="rounded border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 text-sky-700 dark:text-sky-300">SVG</span>
                  <span className="rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300">XML</span>
                  <span className="rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300">DRAW.IO</span>
                  <span className="rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300">BPMN</span>
                  <span className="rounded border border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/60 px-1.5 py-0.5 text-violet-700 dark:text-violet-300">JSON</span>
                  <span className="rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">MERMAID</span>
                  <span className="rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 text-slate-700 dark:text-slate-300">TXT</span>
                </div>
              </div>

              {/* AI Vision & Text Multimodal Pipeline Configuration Card */}
              <div className="rounded-xl border border-sky-300 dark:border-sky-900/40 bg-sky-50/70 dark:bg-sky-950/20 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs font-bold text-sky-800 dark:text-sky-200">Motor IA Multimodal (Imagens & Texto Livre)</span>
                  </div>
                  <span className="rounded bg-sky-100 dark:bg-sky-900/60 px-2 py-0.5 text-[10px] text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-700/50 font-semibold">
                    Gemini 2.5 Flash Ativo
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Imagens e textos sem padrão Draw.io (linguagem natural, requisitos, notas) são interpretados pelo Gemini para extrair componentes, estereótipos UML, microsserviços e fluxos antes de renderizar o gêmeo digital 3D.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="Chave Google Gemini API (Obrigatória para IA - salva localmente)"
                    value={userApiKey}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setUserApiKey(val);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('gemini_api_key', val);
                      }
                    }}
                    className="flex-1 rounded border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">Auto-salvo</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEXT ARCHITECTURE EDITOR */}
          {tab === 'text' && (
            <ArchitectureEditor
              onSuccess={() => {
                onClose();
                router.push('/studio');
              }}
            />
          )}

          {/* TAB 3: PRESETS */}
          {tab === 'presets' && (
            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {PRESET_DIAGRAMS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    if (!isAuthenticated) {
                      onClose();
                      router.push('/login?redirect=/studio');
                      return;
                    }
                    onClose();
                    startProcessing(async () => {
                      loadPreset(p.id);
                      router.push('/studio');
                    });
                  }}
                  className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 hover:border-sky-500/60 hover:bg-sky-50/50 dark:hover:bg-slate-800/60 transition-all group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-sky-100 dark:bg-sky-950 px-1.5 py-0.5 text-[9px] uppercase font-bold text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-800/60">
                      {p.type}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{p.nodes.length} Nodes</span>
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                    {p.name}
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Privacy & Confidentiality Guarantee */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Criptografia TLS 1.3 • Seus diagramas não são usados para treinar IA pública</span>
            </div>
            <Link
              href="/privacy"
              target="_blank"
              className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
