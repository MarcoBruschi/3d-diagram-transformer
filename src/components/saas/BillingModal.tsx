'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, SaaSPlan } from '@/store/useAuthStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import {
  X,
  CreditCard,
  Check,
  Zap,
  Sparkles,
  Building,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Layers,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { api } from '@/lib/services/apiClient';

export function BillingModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const openModal = useSaaSModalsStore((s) => s.openModal);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (activeModal !== 'billing') return null;

  const currentPlan = user?.plan || 'free';

  const handleSelectPlan = async (plan: SaaSPlan) => {
    // Free is current/no-op, Enterprise is disabled for now
    if (plan === 'free' || plan === 'enterprise') return;

    if (!isAuthenticated) {
      openModal('auth');
      return;
    }

    setIsProcessingStripe(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // In checkout route: 'yearly' calls R$ 69/mo product, 'monthly' calls R$ 89/mo product
      const res = await api.billing.createCheckout({
        billingCycle,
        plan: 'pro',
      });

      if (res && res.url) {
        window.location.href = res.url;
        return;
      }
      throw new Error('URL de checkout não retornada pelo servidor.');
    } catch (err: any) {
      console.error('[Billing Checkout UI Error]:', err);
      setErrorMessage(err.message || 'Falha ao conectar com o Stripe Checkout. Verifique as credenciais no .env.');
      setIsProcessingStripe(false);
    }
  };

  const PLANS = [
    {
      id: 'free' as SaaSPlan,
      name: 'Free Starter',
      description: 'Ideal para experimentação e projetos pessoais rápidos.',
      priceMonthly: 'R$ 0',
      priceYearly: 'R$ 0',
      badge: 'Básico',
      features: [
        'Até 3 diagramas ativos na nuvem',
        'Visualização 3D e 2D completa',
        'Modelos procedurais padrão',
        'Exportação básica JSON',
        'Sem multiplayer em tempo real',
      ],
      highlight: false,
      disabled: false,
    },
    {
      id: 'pro' as SaaSPlan,
      name: 'Pro Architect',
      description: 'Para engenheiros e arquitetos de software em escala.',
      priceMonthly: 'R$ 89/mês',
      priceYearly: 'R$ 69/mês',
      badge: 'Mais Popular',
      features: [
        'Diagramas ilimitados na nuvem',
        'Colaboração multiplayer (cursores 3D)',
        'Exportação .glTF 3D, .drawio e PDF IA',
        'Histórico de versões com visual diff',
        'AI Copilot para otimização de arquitetura',
        'Telemetria Datadog/Prometheus em tempo real',
      ],
      highlight: true,
      disabled: false,
    },
    {
      id: 'enterprise' as SaaSPlan,
      name: 'Enterprise Scale',
      description: 'Governança, conformidade, SSO corporativo e SLA dedicado.',
      priceMonthly: 'Indisponível',
      priceYearly: 'Indisponível',
      badge: 'Em Breve',
      features: [
        'Tudo do plano Pro',
        'Single Sign-On (SAML, Okta, Azure AD)',
        'White-Label (Domínio e branding próprios)',
        'Trilhas de auditoria SOC2 / ISO 27001',
        'Gateway de IA dedicado com tokens ilimitados',
        'Suporte técnico 24/7 com SLA de 1 hora',
      ],
      highlight: false,
      disabled: true,
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Planos, Faturamento & Assinaturas</span>
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-500 font-semibold">
                    Stripe Integrado
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Desbloqueie exportação 3D (.glTF), histórico de versões, IA ilimitada e colaboração multiplayer
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-300 dark:border-slate-800 text-xs">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Mensal (R$ 89/mês)
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  billingCycle === 'yearly'
                    ? 'bg-sky-600 text-white shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span>Anual (R$ 69/mês)</span>
                <span className="rounded bg-amber-400/20 text-amber-300 px-1 text-[9px] font-bold">
                  20% OFF
                </span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                {errorMessage}
              </span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-slate-400 hover:text-white text-[10px] ml-2"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                {successMessage}
              </span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-slate-400 hover:text-white text-[10px]"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              const isEnterprise = plan.id === 'enterprise';

              return (
                <div
                  key={plan.id}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                    plan.highlight
                      ? 'border-sky-500 bg-sky-500/5 shadow-xl shadow-sky-500/10 ring-1 ring-sky-500/30'
                      : isEnterprise
                      ? 'border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 opacity-70'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        {plan.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          plan.highlight
                            ? 'bg-sky-500 text-white'
                            : isEnterprise
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {plan.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 h-10 leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="mb-4">
                      <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                        {billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly}
                      </span>
                      {plan.id === 'pro' && (
                        <span className="text-[10px] text-slate-400 ml-1">
                          {billingCycle === 'yearly' ? '/ faturado R$ 828 anualmente' : '/ faturado mensalmente'}
                        </span>
                      )}
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-800 mb-4" />

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                          <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-default"
                      >
                        Seu Plano Atual
                      </button>
                    ) : isEnterprise ? (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-slate-400 bg-slate-200 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 cursor-not-allowed opacity-60"
                        title="O plano Enterprise está desabilitado temporariamente"
                      >
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Em Breve (Desabilitado)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={isProcessingStripe}
                        className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-md transition-all ${
                          plan.highlight
                            ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-500/20 active:scale-[0.98]'
                            : 'bg-slate-800 hover:bg-slate-700 active:scale-[0.98]'
                        }`}
                      >
                        {isProcessingStripe ? (
                          <span>Conectando ao Stripe...</span>
                        ) : (
                          <>
                            <span>Fazer Upgrade para Pro</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="mt-6 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Pagamentos processados com segurança pelo Stripe Checkout</span>
            </span>
            <span>Cancele a qualquer momento nas configurações da conta</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
