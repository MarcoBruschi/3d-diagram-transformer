import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { FileText, ArrowLeft, ShieldCheck, AlertTriangle, Layers } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — PRISM Technologies',
  description:
    'Terms of Service and Customer Licensing Agreement governing the use of PRISM spatial architecture SaaS, intellectual property ownership, and acceptable use.',
};

export default function TermsPage() {
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
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span>COMMERCIAL SAAS TERMS // EULA & CUSTOMER AGREEMENT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Termos de Uso e Serviço
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 font-mono">
            Última atualização: {lastUpdated} • PRISM Technologies Inc.
          </p>
        </header>

        {/* Content Body */}
        <article className="prose prose-slate dark:prose-invert max-w-none space-y-10 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">01.</span>
              <span>Aceitação dos Termos e Acesso ao Serviço</span>
            </h2>
            <p>
              Estes Termos de Uso (&ldquo;Termos&rdquo;) regulam o acesso e utilização da plataforma SaaS PRISM. Ao criar uma conta, conectar um workspace ou importar qualquer diagrama, você (&ldquo;Cliente&rdquo; ou &ldquo;Usuário&rdquo;) concorda integralmente com estes Termos.
            </p>
            <p>
              Caso esteja utilizando o serviço em nome de uma pessoa jurídica (empresa ou instituição), você declara e garante ter plenos poderes para vinculá-la a estes Termos.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">02.</span>
              <span>Propriedade Intelectual: O Cliente é o Único Dono dos Seus Diagramas</span>
            </h2>
            <div className="p-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 text-slate-800 dark:text-slate-200 space-y-3">
              <div className="font-mono font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-2 text-sm uppercase">
                <ShieldCheck className="h-5 w-5 text-cyan-500" />
                <span>Propriedade Incondicional do Cliente (100% Customer IP)</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">
                O Cliente retém todos os direitos autorais, segredos comerciais, propriedade intelectual e titularidade sobre todos os dados de arquitetura, arquivos (Draw.io, Mermaid, PlantUML, JSON, imagens), anotações, especificações de microsserviços e configurações espaciais enviadas à plataforma.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed">
                O PRISM recebe exclusivamente uma licença restrita, temporária e não-exclusiva para hospedar, processar e renderizar os modelos 3D no navegador estritamente para os usuários autorizados pelo Cliente.
              </p>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              A tecnologia subjacente (engine de renderização WebGL, shaders analíticos, layout espacial e código de interface) é de propriedade intelectual exclusiva da PRISM Technologies Inc.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">03.</span>
              <span>Isenção de Responsabilidade sobre Inteligência Artificial (AI Copilot / ADRs)</span>
            </h2>
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <div className="font-mono font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 uppercase">
                <AlertTriangle className="h-4 w-4" />
                <span>AVISO LEGAL DE IA // CONFORMIDADE COM O EU AI ACT & FTC</span>
              </div>
              <p>
                Os recursos de sugestão de topologia, geração automática de diagramas e elaboração de registros de decisões arquiteturais (ADRs) utilizam modelos de linguagem probabilísticos (Google Gemini API).
              </p>
              <p>
                As sugestões de IA são fornecidas em caráter meramente consultivo e experimental. O PRISM <strong>não garante</strong> a precisão absoluta, ausência de alucinações ou adequação de segurança para produção. É de responsabilidade exclusiva dos arquitetos e engenheiros humanos da sua equipe validar regras de firewall, redundâncias e capacidades de hardware antes da implementação em ambientes críticos.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">04.</span>
              <span>Política de Uso Aceitável (AUP)</span>
            </h2>
            <p>Ao utilizar o PRISM, o usuário compromete-se a NÃO:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
              <li>Tentar quebrar ou contornar as barreiras de isolamento multi-tenant (RLS) para acessar dados de outras organizações;</li>
              <li>Fazer engenharia reversa ou descompilar os shaders GLSL e o código-fonte da aplicação;</li>
              <li>Realizar varreduras abusivas de portas, ataques de negação de serviço (DoS/DDoS) ou flooding nos WebSockets de colaboração em tempo real;</li>
              <li>Submeter códigos maliciosos, exploits em XML (XXE) ou payloads de injeção nos campos de diagramas;</li>
              <li>Fazer upload de dados protegidos por segredo militar, armas de destruição em massa ou conteúdos ilícitos.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">05.</span>
              <span>Disponibilidade do Serviço (SLA) e Manutenção</span>
            </h2>
            <p>
              O PRISM empenha seus melhores esforços comerciais para assegurar uma meta de disponibilidade de <strong>99,9%</strong> para a infraestrutura de renderização e API em nuvem, ressalvadas janelas de manutenção programada (notificadas com 48 horas de antecedência) e interrupções em provedores upstream de telecomunicações ou infraestrutura (ex: instabilidades globais da AWS ou Cloudflare).
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">06.</span>
              <span>Limitação de Responsabilidade e Foro</span>
            </h2>
            <p>
              Em nenhuma hipótese a PRISM Technologies Inc. responderá por lucros cessantes, perda de receitas, corrupção de dados externos ou danos indiretos decorrentes de incidentes na infraestrutura do próprio cliente.
            </p>
            <p>
              A responsabilidade total agregada do PRISM por quaisquer reivindicações decorrentes destes Termos limita-se estritamente ao valor total pago pelo Cliente nos doze (12) meses anteriores ao fato gerador da reclamação.
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-[#1E273A] bg-slate-50/90 dark:bg-[#05070B] py-8 px-6 font-mono text-xs text-slate-600 dark:text-slate-400 transition-colors duration-200">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>PRISM Technologies Inc. • Termos Comerciais e Licenciamento</div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Privacidade</Link>
            <span>•</span>
            <Link href="/cookies" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Cookies</Link>
            <span>•</span>
            <Link href="/refund" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Reembolso</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
