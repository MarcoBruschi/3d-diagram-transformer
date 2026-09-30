import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { CreditCard, ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — PRISM Technologies',
  description:
    'Clear and transparent refund and subscription cancellation policy for PRISM Pro and Enterprise tiers, including 14-day statutory withdrawal rights.',
};

export default function RefundPage() {
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
            <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
            <span>BILLING & REFUND POLICY // STRIPE PCI-DSS • EU 2011/83/EU • CDC ART. 49</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Política de Reembolso e Cancelamento
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
              <span>Nosso Compromisso com a Transparência</span>
            </h2>
            <p>
              Acreditamos em modelos de negócio baseados no valor real entregue aos engenheiros e arquitetos de software. Não aplicamos cobranças ocultas, pegadinhas de renovação nem barreiras burocráticas para cancelamento.
            </p>
            <p>
              O PRISM oferece um <strong>Plano Gratuito permanente</strong> (até 3 diagramas ativos e acesso completo ao editor 3D WebGL sem exigência de cartão de crédito) para que você possa testar e validar nossa tecnologia antes de qualquer contratação comercial.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">02.</span>
              <span>Direito de Arrependimento e Reembolso em 14 Dias</span>
            </h2>
            <div className="p-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 text-slate-800 dark:text-slate-200 space-y-3">
              <div className="font-mono font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-2 text-sm uppercase">
                <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                <span>Garantia de Reembolso Total em até 14 Dias</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">
                Em conformidade com a <strong>Diretiva Europeia de Direitos do Consumidor (2011/83/UE)</strong> e o <strong>Código de Defesa do Consumidor (Art. 49 da Lei nº 8.078/1990)</strong>, qualquer pessoa física ou novo cliente que assinar os planos pagos possui o direito incondicional de solicitar o cancelamento e reembolso de 100% do valor pago no prazo de até <strong>14 dias corridos</strong> após a contratação inicial.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed">
                Nenhuma justificativa técnica ou jurídica é exigida para o reembolso neste período.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">03.</span>
              <span>Cancelamento em 1 Clique a Qualquer Momento</span>
            </h2>
            <p>
              Você pode cancelar a renovação automática da sua assinatura a qualquer momento, sem precisar falar com atendentes:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-xs sm:text-sm">
              <li>Acesse o Studio e clique no menu do seu perfil ou nas configurações do Workspace;</li>
              <li>Selecione <strong>&ldquo;Faturamento / Gerenciar Assinatura&rdquo;</strong> para abrir o Portal do Cliente Stripe;</li>
              <li>Clique em <strong>&ldquo;Cancelar Assinatura&rdquo;</strong>.</li>
            </ol>
            <p>
              Após o cancelamento, seu plano permanecerá ativo com todos os recursos profissionais até o último dia do período já faturado. Nenhuma cobrança futura será efetuada no seu cartão.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">04.</span>
              <span>Reembolsos por Indisponibilidade de SLA ou Cobrança Indevida</span>
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Descumprimento de SLA:</strong> Se a disponibilidade do serviço ficar abaixo de 99,9% no seu ciclo de faturamento por falha na nossa infraestrutura, você terá direito a crédito integral ou reembolso proporcional do mês afetado.
              </li>
              <li>
                <strong>Duplicidade de Cobrança:</strong> Em caso de cobrança duplicada decorrente de instabilidade de rede ou falha de webhook, o reembolso do valor excedente é emitido imediatamente.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">05.</span>
              <span>Canal Direto de Faturamento</span>
            </h2>
            <p>
              Se tiver qualquer dúvida sobre sua fatura ou precisar solicitar um reembolso, entre em contato direto com nosso time financeiro antes de abrir disputas bancárias:
            </p>
            <div className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#0B0E14] p-5 font-mono text-xs space-y-2">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span>SUPORTE DE FATURAMENTO E REEMBOLSOS:</span>
              </div>
              <div>E-mail: <a href="mailto:billing@prism.app" className="text-cyan-600 dark:text-cyan-400 hover:underline">billing@prism.app</a></div>
              <div className="text-slate-500">Tempo médio de resposta para faturamento: menos de 24 horas úteis.</div>
            </div>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-[#1E273A] bg-slate-50/90 dark:bg-[#05070B] py-8 px-6 font-mono text-xs text-slate-600 dark:text-slate-400 transition-colors duration-200">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>PRISM Technologies Inc. • Política de Cobrança e Cancelamento Transparente</div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Privacidade</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Termos de Uso</Link>
            <span>•</span>
            <Link href="/cookies" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
