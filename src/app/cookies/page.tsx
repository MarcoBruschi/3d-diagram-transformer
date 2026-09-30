import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { Cookie, ArrowLeft, Settings, ShieldCheck, Database } from 'lucide-react';
import { CookiePreferencesTrigger } from '@/components/compliance/CookiePreferencesTrigger';

export const metadata: Metadata = {
  title: 'Cookie & Storage Policy — PRISM Technologies',
  description:
    'Comprehensive Cookie and Local Storage Policy detailing cookies, session tokens, and telemetry tracking used on PRISM.',
};

export default function CookiesPage() {
  const lastUpdated = '29 de Setembro de 2026';

  return (
    <div className="min-h-screen bg-white dark:bg-[#05070B] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <LandingNavbar />

      <main id="main-content" className="pt-28 pb-20 px-6 sm:px-12 lg:px-20 max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline focus-visible:ring-2 focus-visible:ring-cyan-500 rounded p-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Voltar para Início</span>
          </Link>
        </div>

        {/* Header Block */}
        <header className="border-b border-slate-200 dark:border-[#1E273A] pb-8 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-slate-200 dark:border-cyan-500/20 bg-slate-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-mono text-xs font-semibold mb-4">
            <Cookie className="h-3.5 w-3.5" aria-hidden="true" />
            <span>COOKIE & STORAGE POLICY // ePRIVACY • GDPR • LGPD</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                Política de Cookies e Armazenamento
              </h1>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 font-mono">
                Última atualização: {lastUpdated} • PRISM Technologies Inc.
              </p>
            </div>

            {/* Quick Action to Open Modal */}
            <div className="sm:self-start">
              <CookiePreferencesTrigger />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <article className="prose prose-slate dark:prose-invert max-w-none space-y-10 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">01.</span>
              <span>O que são Cookies e Tecnologias de Armazenamento Local?</span>
            </h2>
            <p>
              Cookies e recursos de armazenamento no navegador (como <code>localStorage</code> e <code>sessionStorage</code>) são pequenos blocos de dados gravados no seu dispositivo para possibilitar a navegação segura, memorizar preferências e garantir a estabilidade das sessões de engenharia no PRISM.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">02.</span>
              <span>Categorias de Cookies Utilizadas</span>
            </h2>

            {/* Table of Cookies */}
            <div className="overflow-x-auto not-prose my-6">
              <table className="w-full text-left text-xs font-mono border-collapse border border-slate-200 dark:border-[#1E273A]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#0B0E14] text-slate-900 dark:text-white border-b border-slate-200 dark:border-[#1E273A]">
                    <th className="p-3">Nome / Chave</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Provedor</th>
                    <th className="p-3">Finalidade</th>
                    <th className="p-3">Duração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1E273A] bg-white dark:bg-[#07080B]">
                  <tr>
                    <td className="p-3 font-bold text-cyan-600 dark:text-cyan-400">refreshToken</td>
                    <td className="p-3">Estritamente Necessário</td>
                    <td className="p-3">PRISM (1st Party)</td>
                    <td className="p-3">Token JWT HttpOnly seguro para autenticação do usuário.</td>
                    <td className="p-3">7 Dias</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-cyan-600 dark:text-cyan-400">prism-theme</td>
                    <td className="p-3">Funcional</td>
                    <td className="p-3">PRISM (localStorage)</td>
                    <td className="p-3">Persistência da preferência de tema (Modo Claro vs Modo Escuro).</td>
                    <td className="p-3">Persistente</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-cyan-600 dark:text-cyan-400">prism-cookie-consent</td>
                    <td className="p-3">Estritamente Necessário</td>
                    <td className="p-3">PRISM (localStorage)</td>
                    <td className="p-3">Registra suas escolhas no banner de consentimento de cookies.</td>
                    <td className="p-3">1 Ano</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-cyan-600 dark:text-cyan-400">__stripe_mid, __stripe_sid</td>
                    <td className="p-3">Estritamente Necessário</td>
                    <td className="p-3">Stripe Inc.</td>
                    <td className="p-3">Prevenção a fraudes e checkout seguro em cartões de crédito.</td>
                    <td className="p-3">1 Ano / 30 Min</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-cyan-600 dark:text-cyan-400">telemetry-metrics</td>
                    <td className="p-3">Telemetria & Analítico</td>
                    <td className="p-3">PRISM (Opcional)</td>
                    <td className="p-3">Métricas de performance gráfica WebGL (FPS, tempo de carga, erros de shader).</td>
                    <td className="p-3">Sessão</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">03.</span>
              <span>Como Gerenciar ou Revogar seu Consentimento</span>
            </h2>
            <p>
              Você pode alterar suas preferências de cookies a qualquer momento clicando no botão <strong>&ldquo;Preferências de Cookies&rdquo;</strong> presente no topo desta página ou no rodapé de todas as páginas da plataforma.
            </p>
            <p>
              Além disso, todos os navegadores modernos permitem bloquear ou excluir cookies através do painel de configurações de privacidade (Chrome, Firefox, Safari, Edge). Ressaltamos que a desativação dos cookies estritamente necessários impedirá a autenticação e o salvamento em nuvem no Studio.
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-[#1E273A] bg-slate-50/90 dark:bg-[#05070B] py-8 px-6 font-mono text-xs text-slate-600 dark:text-slate-400 transition-colors duration-200">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>PRISM Technologies Inc. • Política de Cookies e Armazenamento Local</div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Privacidade</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Termos de Uso</Link>
            <span>•</span>
            <Link href="/refund" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Reembolso</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
