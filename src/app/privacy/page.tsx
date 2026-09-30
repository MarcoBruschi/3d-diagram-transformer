import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { Shield, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — PRISM Technologies',
  description:
    'Comprehensive data privacy policy detailing how PRISM collects, processes, protects, and retains cloud architecture diagram data under GDPR, LGPD, and CCPA.',
};

export default function PrivacyPolicyPage() {
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
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            <span>DATA PRIVACY FRAMEWORK // GDPR • LGPD • CCPA</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Política de Privacidade
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
              <span>Visão Geral e Controlador de Dados</span>
            </h2>
            <p>
              A <strong>PRISM Technologies Inc.</strong> (&ldquo;PRISM&rdquo;, &ldquo;nós&rdquo;, &ldquo;nosso&rdquo;) desenvolve tecnologia espacial para compilação de diagramas de arquitetura e infraestrutura distribuída em gêmeos digitais 3D interativos.
            </p>
            <p>
              Esta Política de Privacidade descreve de forma clara e transparente como tratamos, armazenamos e protegemos seus dados pessoais e dados de diagramas corporativos em estrita conformidade com o <strong>Regulamento Geral sobre a Proteção de Dados da União Europeia (GDPR - Reg. 2016/679)</strong>, a <strong>Lei Geral de Proteção de Dados Pessoais do Brasil (LGPD - Lei nº 13.709/2018)</strong> e o <strong>California Consumer Privacy Act (CCPA/CPRA)</strong>.
            </p>
            <div className="rounded-xl border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#0B0E14] p-5 font-mono text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">CONTROLADOR DE DADOS:</div>
              <div>PRISM Technologies Inc.</div>
              <div>E-mail de Contato Geral: <a href="mailto:legal@prism.app" className="text-cyan-600 dark:text-cyan-400 hover:underline">legal@prism.app</a></div>
              <div>Encarregado de Proteção de Dados (DPO): <a href="mailto:dpo@prism.app" className="text-cyan-600 dark:text-cyan-400 hover:underline">dpo@prism.app</a></div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">02.</span>
              <span>Dados Coletados e Princípio da Minimização</span>
            </h2>
            <p>
              Em conformidade com o princípio da <strong>Minimização de Dados</strong> (GDPR Art. 5(1)(c) e LGPD Art. 6(III)), coletamos estritamente os dados necessários para o fornecimento dos serviços:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Dados Cadastrais de Conta:</strong> Nome completo, e-mail corporativo, nome da organização/workspace, senha criptografada com algoritmo <em>bcrypt</em> (salt rounds 10), e identificador público de perfil OAuth (Google ou GitHub).
              </li>
              <li>
                <strong>Especificações de Arquitetura e Diagramas:</strong> Textos em formatos declarativos (Mermaid.js, PlantUML, ASCII), especificações estruturais XML (Draw.io) ou JSON, e arquivos de imagem submetidos para vetorização via OCR/IA.
              </li>
              <li>
                <strong>Telemetria Técnica e Performance:</strong> Métricas agregadas de hardware para calibração do WebGL (taxa de quadros FPS, contagem de nós e arestas, tempo de convergência de layout e latência de rede). Não coletamos nem logamos informações confidenciais de tráfego interno dos clientes.
              </li>
              <li>
                <strong>Dados Financeiros e Faturamento:</strong> As transações são processadas com certificação PCI-DSS Nível 1 pela infraestrutura segura do Stripe. O PRISM não armazena nem tem acesso a números completos de cartão de crédito ou CVV.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">03.</span>
              <span>Bases Legais para o Tratamento</span>
            </h2>
            <p>
              O tratamento de dados pessoais fundamenta-se nas seguintes bases legais:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
              <div className="p-4 rounded-lg border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#07080B]">
                <div className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">EXECUÇÃO DE CONTRATO</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  GDPR Art. 6(1)(b) / LGPD Art. 7(V) — Para autenticar usuários, processar diagramas, gerar malhas 3D e manter workspaces colaborativos.
                </div>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#07080B]">
                <div className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">LEGÍTIMO INTERESSE</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  GDPR Art. 6(1)(f) / LGPD Art. 7(IX) — Para segurança da informação, auditoria contra acessos indevidos, rate limiting e defesa em disputas.
                </div>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#07080B]">
                <div className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">CONSENTIMENTO EXPLÍCITO</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  GDPR Art. 6(1)(a) / LGPD Art. 7(I) — Para telemetria avançada não-essencial, cookies analíticos e comunicações opcionais de produto.
                </div>
              </div>
              <div className="p-4 rounded-lg border border-slate-200 dark:border-[#1E273A] bg-slate-50 dark:bg-[#07080B]">
                <div className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">OBRIGAÇÃO LEGAL</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  GDPR Art. 6(1)(c) / LGPD Art. 7(II) — Para retenção de notas fiscais, registros tributários e atendimento a ordens judiciais.
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">04.</span>
              <span>Inteligência Artificial e Sub-Processadores</span>
            </h2>
            <p>
              Para a interpretação semântica de especificações e síntese de relatórios de arquitetura (ADRs), o PRISM utiliza a API do <strong>Google Gemini</strong> como sub-processador.
            </p>
            <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-slate-700 dark:text-slate-300">
              <strong className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1 font-mono">
                <CheckCircle2 className="h-4 w-4" />
                GARANTIA DE NÃO-TREINAMENTO DE MODELOS:
              </strong>
              Seus diagramas, esquemáticos e especificações confidenciais submetidos à API não são utilizados pela Google ou pelo PRISM para treinamento de modelos de linguagem públicos. As requisições são efetuadas por túnel criptografado TLS 1.3 de servidor para servidor, sem retenção permanente pelo provedor do modelo.
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">05.</span>
              <span>Retenção e Exclusão Definitiva de Dados</span>
            </h2>
            <p>
              Os diagramas salvos permanecem armazenados enquanto a conta do usuário ou organização mantiver-se ativa. Quando um diagrama é excluído pelo usuário, os registros no PostgreSQL e os caches correspondentes no Redis são expurgados em tempo real.
            </p>
            <p>
              No encerramento definitivo de conta, todos os metadados e diagramas vinculados são destruídos de forma irreversível no prazo máximo de 30 dias, ressalvados os registros fiscais legalmente exigíveis.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="font-mono text-cyan-600 dark:text-cyan-400 text-sm">06.</span>
              <span>Direitos dos Titulares de Dados</span>
            </h2>
            <p>
              Garantimos aos usuários todos os direitos assegurados pelo GDPR (Arts. 15 a 22) e LGPD (Art. 18):
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Confirmação e Acesso:</strong> Obter confirmação de existência de tratamento e cópia dos dados pessoais.</li>
              <li><strong>Retificação:</strong> Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li><strong>Portabilidade:</strong> Exportar diagramas em formatos abertos (JSON estruturado, XML Draw.io e glTF 3D).</li>
              <li><strong>Eliminação / Direito ao Esquecimento:</strong> Solicitar a exclusão de dados tratados com base em consentimento.</li>
              <li><strong>Revogação de Consentimento:</strong> Desativar cookies não-essenciais ou opt-outs a qualquer momento via nosso Gerenciador de Cookies.</li>
            </ul>
            <p className="pt-2 text-xs text-slate-500 font-mono">
              Para exercer qualquer um desses direitos, envie sua solicitação para <a href="mailto:privacy@prism.app" className="text-cyan-600 dark:text-cyan-400 underline">privacy@prism.app</a>. Atendemos no prazo legal de até 15 dias.
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-[#1E273A] bg-slate-50/90 dark:bg-[#05070B] py-8 px-6 font-mono text-xs text-slate-600 dark:text-slate-400 transition-colors duration-200">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>PRISM Technologies Inc. • Proteção de Dados & Conformidade Legal</div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/terms" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Termos de Uso</Link>
            <span>•</span>
            <Link href="/cookies" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Política de Cookies</Link>
            <span>•</span>
            <Link href="/refund" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">Reembolso</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
