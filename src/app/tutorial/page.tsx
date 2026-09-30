'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  ArrowLeft,
  Sparkles,
  Move3d,
  Layers,
  Compass,
  Unlock,
  Edit3,
  Columns,
  Cpu,
  Shield,
  Cable,
  Keyboard,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Database,
  Globe,
  Zap,
} from 'lucide-react';

import { ThemeToggle } from '@/components/theme/ThemeToggle';

const SECTIONS = [
  { id: 'visao-geral', title: '1. Visão Geral & Conceito', icon: Box },
  { id: 'importacao-ia', title: '2. Importação com IA Vision', icon: Sparkles },
  { id: 'camera-3d', title: '3. Navegação & Câmera Livre', icon: Compass },
  { id: 'movimentacao-edicao', title: '4. Movimentação & Edição 3D', icon: Move3d },
  { id: 'builder-split', title: '5. Builder & Split View (2D+3D)', icon: Columns },
  { id: 'conexoes-uml', title: '6. Estereótipos & Conexões UML', icon: Cable },
  { id: 'camadas-profundidade', title: '7. Hierarquia Z & Anti-Colisão', icon: Layers },
  { id: 'atalhos-teclado', title: '8. Atalhos & Produtividade', icon: Keyboard },
];

export default function TutorialPage() {
  const [activeSection, setActiveSection] = useState('visao-geral');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#07080B] text-slate-900 dark:text-slate-100 font-sans selection:bg-sky-500/30 transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 h-14 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 px-6 flex items-center justify-between backdrop-blur-xl transition-colors duration-200">
        <div className="flex items-center gap-4">
          <Link
            href="/studio"
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar ao Studio</span>
          </Link>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 border border-sky-400/50 dark:border-sky-500/50 text-sky-600 dark:text-sky-400">
              <Box className="h-4 w-4" />
            </div>
            <span className="font-mono text-xs font-black tracking-wider uppercase text-slate-900 dark:text-slate-100">
              DIAGRAM<span className="text-sky-500 dark:text-sky-400">3D</span>
            </span>
            <span className="rounded bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800/60 font-mono">
              GUIA DA FERRAMENTA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/studio"
            className="flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-sky-500 shadow-lg shadow-sky-600/20 transition-colors"
          >
            <span>Abrir Studio 3D</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Layout: Sidebar Navigation + Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-10">
        {/* Sticky Sidebar Navigation */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-20 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/60 p-4 shadow-sm backdrop-blur-md">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-2">
              Índice do Tutorial
            </div>
            <nav className="space-y-1">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollTo(sec.id)}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-all ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-800/60 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate">{sec.title}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80">
              <Link
                href="/studio"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 py-2.5 text-xs font-bold text-white hover:opacity-95 shadow-md"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Testar no Studio</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-12 pb-24 max-w-4xl">
          {/* Header Banner */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-white to-slate-100 dark:from-slate-900/60 dark:to-slate-950 p-8 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-950/50 px-3 py-1 text-xs text-sky-700 dark:text-sky-300 font-mono mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Documentação Completa de Uso</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Manual Interativo do 3D Diagram Transformer
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Aprenda como converter diagramas estáticos em qualquer formato (imagens raster com IA, XML do Draw.io, Mermaid, JSON) em gêmeos digitais 3D interativos, navegar no espaço espacial sem restrições e criar arquiteturas visuais com o Builder 2D/3D.
            </p>
          </div>

          {/* SECTION 1: VISÃO GERAL */}
          <section id="visao-geral" className="space-y-4 pt-4">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800/60">
                <Box className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">1. Visão Geral & Conceito</h2>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              O <strong>3D Diagram Transformer</strong> foi concebido para superar as limitações de diagramas bidimensionais planos em papel ou telas convencionais. Em sistemas complexos, sobreposições de caixas e linhas cruzadas tornam a arquitetura opaca.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/80 p-4 space-y-2 shadow-xs">
                <div className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">ESPACIALIDADE 3D</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Cada componente é renderizado com geometria volumétrica Three.js (UML 2.0, gabinetes industriais, cofres de segurança, nuvens e bancos de dados).
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/80 p-4 space-y-2 shadow-xs">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">CAMADAS ANTI-SOBREPOSIÇÃO</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  O algoritmo espacial separa os componentes em níveis de profundidade (Tiers 1 a 5) para eliminar cruzamentos indesejados.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/80 p-4 space-y-2 shadow-xs">
                <div className="text-xs font-bold text-violet-600 dark:text-violet-400 font-mono">TELEMETRIA SIMULADA</div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Partículas de luz viajam através das conexões indicando fluxo de dados, requisições por segundo e latência em tempo real.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2: IMPORTAÇÃO POR IA */}
          <section id="importacao-ia" className="space-y-4 pt-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800/60">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">2. Importação com IA de Visão Computacional</h2>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              O sistema possui um pipeline universal capaz de ingerir praticamente qualquer representação gráfica ou textual de arquitetura.
            </p>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-sky-600 dark:text-sky-300 font-mono">
                    A. Leitura de Imagens por IA Multimodal (PNG, JPG, WEBP, SVG)
                  </h4>
                  <span className="rounded bg-sky-100 dark:bg-sky-950 px-2 py-0.5 text-[10px] text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-800">
                    Visão Computacional
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ao arrastar uma imagem para o estúdio ou pelo botão <strong>Import Diagram</strong>, a imagem é codificada em alta resolução e enviada para o modelo de visão multimodal (<strong>Google Gemini Vision</strong>). A IA identifica o que cada caixa representa, extrai estereótipos (ex: <code>«controller»</code>, <code>«service»</code>, <code>«device»</code>), detecta as setas e multiplicidades, e constrói o grafo arquitetural tridimensional.
                </p>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Chave de API Gemini (Opcional):</div>
                  <p>
                    No modal de upload, você pode inserir sua chave do Google AI Studio para análise neural direta via LLM. Se não configurada, o motor recorre automaticamente ao analisador de OCR e raciocínio topológico integrado, garantindo que sempre funcione.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-300 font-mono">
                    B. Suporte Direto a XML Draw.io (`&lt;mxGraphModel&gt;`)
                  </h4>
                  <span className="rounded bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    Draw.io / diagrams.net
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Cole o código XML ou envie o arquivo <code>.xml</code> / <code>.drawio</code>. O parser analisa as tags <code>mxCell</code>, decodifica entidades HTML internas, associa rótulos vizinhos de interfaces e mapeia conectores como <code>«provides»</code> e <code>«requires»</code>.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-300 font-mono">
                    C. Texto em Linguagem Natural, JSON e Mermaid
                  </h4>
                  <span className="rounded bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                    Mermaid / JSON / Texto
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Descreva um sistema em linguagem natural (ex: <em>&quot;API Gateway conecta em microsserviço de pagamentos que salva no PostgreSQL&quot;</em>) ou cole diagramas Mermaid.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 3: CÂMERA 3D */}
          <section id="camera-3d" className="space-y-4 pt-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800/60">
                <Compass className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">3. Navegação 3D & Câmera Livre</h2>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              O controle de câmera permite inspecionar a arquitetura de qualquer perspectiva:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs font-mono">
                  <Unlock className="h-4 w-4" />
                  <span>Modo Câmera Livre (Recomendado para Inspeção)</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Ao clicar no botão <strong>Câmera Livre</strong> na barra inferior, a câmera ganha liberdade total de 360°:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc pl-4">
                  <li>Pode ser rotacionada completamente por baixo (olhando para cima) ou por cima (zenital).</li>
                  <li>Clicar em nós para inspecionar <strong>não força a câmera a se mover nem recente</strong>.</li>
                  <li>Você mantém 100% de autoridade sobre o ponto de visão.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-sky-300 dark:border-sky-900/50 bg-sky-50/70 dark:bg-sky-950/20 p-4 space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-xs font-mono">
                  <Compass className="h-4 w-4" />
                  <span>Presets de Enquadramento Automático</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                  <li>
                    <strong className="text-slate-900 dark:text-slate-200">Fit (Visão Geral):</strong> Calcula o centro e o raio de todos os nós e reenquadra perfeitamente toda a arquitetura na tela.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-slate-200">CAD (Top-Down):</strong> Visão ortogonal de cima para baixo no estilo planta de engenharia.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-slate-200">Cinematic:</strong> Órbita contínua em movimento suave para apresentações e demonstrações.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* SECTION 4: MOVIMENTAÇÃO E EDIÇÃO */}
          <section id="movimentacao-edicao" className="space-y-4 pt-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800/60">
                <Move3d className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">4. Movimentação & Edição Direta no Espaço 3D</h2>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Você pode reorganizar e customizar nós diretamente no ambiente tridimensional:
            </p>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 space-y-2 shadow-xs">
                <h4 className="text-xs font-bold text-sky-700 dark:text-sky-300 font-mono flex items-center gap-2">
                  <Move3d className="h-4 w-4" />
                  Como Mover Nós no Cenário 3D
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Basta clicar com o botão esquerdo do mouse sobre qualquer componente 3D e <strong>arrastá-lo</strong>. O cursor mudará para o ícone de agarrar e o componente deslizará suavemente no plano espacial. As linhas de conexão e partículas de dados acompanham o movimento instantaneamente.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1 font-mono">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Anel de posicionamento no solo</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Eixos 3D (X Vermelho, Y Verde, Z Azul)</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 space-y-2 shadow-xs">
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edição Imediata ao Clicar (Painel Lateral / Inspector)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ao clicar em qualquer nó, a aba <strong>&quot;Editar Nó&quot;</strong> abre automaticamente no painel lateral:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
                  <div className="rounded bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-sky-600 dark:text-sky-400">Renomear:</span> altere o nome em tempo real.
                  </div>
                  <div className="rounded bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-amber-600 dark:text-amber-400">Estereótipo:</span> defina <code>«controller»</code>, <code>«service»</code>, etc.
                  </div>
                  <div className="rounded bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Modelo 3D:</span> troque o visual entre 40+ tipos arquiteturais.
                  </div>
                  <div className="rounded bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-violet-600 dark:text-violet-400">Coordenadas X/Y/Z:</span> ajuste fino com botões <code>+</code> e <code>-</code>.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: BUILDER & SPLIT VIEW */}
          <section id="builder-split" className="space-y-4 pt-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800/60">
                <Columns className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">5. Builder & Split View (2D + 3D)</h2>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              O modo <strong>Builder</strong> permite desenhar diagramas com ferramentas de alinhamento e construir arquiteturas do zero:
            </p>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 space-y-3 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-sky-700 dark:text-sky-300 font-mono">Modo 2D Vetor</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Canvas bidimensional com grade milimetrada e portas de conexão.</p>
                </div>

                <div className="rounded-lg bg-sky-50/50 dark:bg-slate-950 p-3 border border-sky-300 dark:border-sky-800/80 space-y-1 shadow-xs">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono">Modo Split (2D + 3D)</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Visão lado a lado: altere em 2D e veja o gêmeo 3D atualizar simultaneamente.</p>
                </div>

                <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-violet-700 dark:text-violet-300 font-mono">Modo 3D Espacial</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Imersão completa com iluminação de estúdio e profundidade.</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-slate-200">Fio Dinâmico com Mouse:</div>
                <p>
                  No Builder 2D, clique na porta <strong>(+)</strong> de qualquer nó. Uma linha curva tracejada seguirá o ponteiro do mouse em tempo real. Clique no componente de destino para criar a conexão, ou clique em qualquer área vazia (ou pressione <code>Esc</code>) para cancelar.
                </p>
                <div className="font-bold text-slate-900 dark:text-slate-200 pt-2">Ferramentas de Alinhamento:</div>
                <p>
                  Use <strong>Grade (Snap 20px)</strong> para travar posições em múltiplos de 20 pixels, e os botões <strong>Alinhar Horiz.</strong> e <strong>Alinhar Vert.</strong> para equalizar fileiras ou colunas instantaneamente.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 6: CONEXÕES & ESTEREÓTIPOS */}
          {/* SECTION 6: CONEXÕES & ESTEREÓTIPOS */}
          <section id="conexoes-uml" className="space-y-4 pt-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800/60">
                <Cable className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">6. Estereótipos & Conexões UML</h2>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              O transformer reconhece as convenções formais de diagramação UML e engenharia de software:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3.5 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-300 font-mono">
                  <Cable className="h-4 w-4" />
                  <span>«provides» / Interface Lollipop</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Conector <em>Ball & Socket</em> onde o componente executivo provê uma interface de serviço através de uma esfera metálica com anel orbital.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3.5 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-300 font-mono">
                  <Cable className="h-4 w-4" />
                  <span>«requires» / Soquete</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Representa a demanda de consumo da interface, conectando o controlador diretamente ao soquete da interface.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3.5 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-300 font-mono">
                  <Cable className="h-4 w-4" />
                  <span>«use» (Tracejada)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Dependência direta entre componentes, renderizada com linha tracejada e pulsos luminosos de dados.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3.5 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-300 font-mono">
                  <Cable className="h-4 w-4" />
                  <span>«4G» & «HTTPS»</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Comunicação sem fio (wireless celular) e túneis criptografados TLS com badges informativos interativos no ponto médio.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 7: HIERARQUIA Z */}
          <section id="camadas-profundidade" className="space-y-4 pt-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800/60">
                <Layers className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">7. Hierarquia Z & Prevenção de Colisão</h2>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Para evitar que nós fiquem uns na frente dos outros ou colidam visualmente, o motor espacial categoriza os nós em 5 níveis de importância:
            </p>

            <div className="space-y-2">
              {[
                { tier: 'Tier 5 (Primeiro Plano)', desc: 'Clientes, Dispositivos Web/Mobile, Atores e Sensores IoT.', color: 'text-rose-600 dark:text-rose-400' },
                { tier: 'Tier 4 (Perímetro)', desc: 'API Gateways, Regiões Cloud, Controladores, WAF e Roteadores.', color: 'text-amber-600 dark:text-amber-400' },
                { tier: 'Tier 3 (Lógica de Negócio)', desc: 'Microsserviços, Controladores UML, Servidores e Modelos de IA.', color: 'text-emerald-600 dark:text-emerald-400' },
                { tier: 'Tier 2 (Eventos & Fila)', desc: 'Kafka, RabbitMQ, Pipelines ETL, Caches Redis e Streams.', color: 'text-sky-600 dark:text-sky-400' },
                { tier: 'Tier 1 (Fundação & Dados)', desc: 'Bancos de Dados Relacionais, Data Lakes, SAN Storage e Tabelas.', color: 'text-violet-600 dark:text-violet-400' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-xs shadow-xs">
                  <span className={`font-mono font-bold ${item.color}`}>{item.tier}</span>
                  <span className="text-slate-600 dark:text-slate-400 max-w-lg text-right">{item.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 8: ATALHOS */}
          <section id="atalhos-teclado" className="space-y-4 pt-6">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800/60">
                <Keyboard className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">8. Atalhos de Teclado & Produtividade</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'Ctrl + K', action: 'Abre a Paleta de Comandos rápida para busca e ações.' },
                { key: 'Esc', action: 'Fecha modais, deseleciona componentes e cancela ligações.' },
                { key: 'Clique com Botão Esquerdo + Arraste no Nó', action: 'Move o componente livremente no espaço 3D.' },
                { key: 'Clique no Fundo + Arraste', action: 'Orbita a câmera ao redor da cena.' },
                { key: 'Botão Direito ou Shift + Arraste', action: 'Move (pan) a visão lateralmente na tela.' },
                { key: 'Scroll do Mouse', action: 'Zoom contínuo de aproximação e afastamento.' },
              ].map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3.5 text-xs shadow-xs">
                  <kbd className="rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-2 py-1 font-mono text-[11px] font-bold text-sky-700 dark:text-sky-300 shadow-xs">
                    {shortcut.key}
                  </kbd>
                  <span className="text-slate-600 dark:text-slate-400 text-right pl-3">{shortcut.action}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA Card */}
          <div className="rounded-2xl border border-sky-300 dark:border-sky-500/30 bg-gradient-to-r from-sky-50 via-white to-cyan-50 dark:from-sky-950/40 dark:via-slate-950 dark:to-cyan-950/40 p-8 text-center space-y-4 shadow-xl">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Pronto para transformar sua arquitetura em 3D?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              Abra o estúdio agora mesmo para testar os presets existentes, colar seu XML do Draw.io ou fazer upload de qualquer imagem de diagrama.
            </p>
            <div className="pt-2">
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white hover:bg-sky-500 shadow-xl shadow-sky-600/25 transition-all"
              >
                <span>Acessar o Studio 3D</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
