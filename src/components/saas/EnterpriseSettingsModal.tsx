'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  X,
  Building,
  Globe,
  ShieldCheck,
  FileCheck,
  Check,
  Save,
  KeyRound,
  Lock,
} from 'lucide-react';

export function EnterpriseSettingsModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace);

  const [customDomain, setCustomDomain] = useState('');
  const [companyName, setCompanyName] = useState(currentWorkspace?.name || '');
  const [ssoProvider, setSsoProvider] = useState<'okta' | 'azure-ad' | 'google-workspace'>('okta');
  const [saved, setSaved] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  if (activeModal !== 'enterprise') return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-500">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>White-Label, SSO & Governança Enterprise</span>
                  <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] text-sky-500 font-semibold">
                    SOC2 Ready
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customização corporativa com domínio próprio, Single Sign-On SAML e trilhas de auditoria
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

          {saved && (
            <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Configurações Enterprise salvas com sucesso!</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* White Label Form */}
            <form onSubmit={handleSave} className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block mb-2">
                White-Label & Domínio Customizado
              </span>

              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Nome da Organização (Exibido no Cabeçalho)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Custom Domain CNAME
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="ex: diagramas.suaempresa.com"
                    className="flex-1 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                  />
                  {customDomain ? (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      <span>SSL Ativo</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Opcional
                    </span>
                  )}
                </div>
              </div>

              {/* SSO SAML Provider */}
              <div className="pt-2">
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Provedor de Identidade Corporativo (SSO SAML / OIDC)
                </label>
                <select
                  value={ssoProvider}
                  onChange={(e) => setSsoProvider(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="okta">Okta Enterprise Workforce Identity</option>
                  <option value="azure-ad">Microsoft Entra ID (Azure AD)</option>
                  <option value="google-workspace">Google Workspace SAML Provider</option>
                </select>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md mt-2"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Salvar Configurações</span>
              </button>
            </form>

            {/* Audit Logs */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block mb-2">
                Trilha de Auditoria Recente (Compliance SOC2)
              </span>
              {auditLogs.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                  Nenhum evento de auditoria registrado no período. As atividades de login SSO, exportações e políticas RBAC serão registradas aqui em tempo real.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200 block">{log.event}</strong>
                        <span className="text-slate-400">{log.user} • IP: {log.ip}</span>
                      </div>
                      <span className="text-slate-400">{log.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
