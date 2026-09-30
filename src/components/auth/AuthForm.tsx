'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  Box,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Users,
} from 'lucide-react';

interface AuthFormProps {
  defaultTab?: 'login' | 'register';
}

export function AuthForm({ defaultTab = 'login' }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/studio';
  const paramTab = searchParams.get('tab');
  const inviteParam = searchParams.get('invite');
  const initialTab = inviteParam || paramTab === 'register' ? 'register' : paramTab === 'login' ? 'login' : defaultTab;

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const joinWorkspace = useAuthStore((s) => s.joinWorkspace);
  const clearAuthError = useAuthStore((s) => s.clearAuthError);

  // If already authenticated and invite link provided, auto-join workspace before redirecting
  useEffect(() => {
    if (isAuthenticated) {
      if (inviteParam) {
        joinWorkspace(inviteParam)
          .catch((err) => console.warn('[AuthForm Join Error]:', err))
          .finally(() => router.push(redirectPath));
      } else {
        router.push(redirectPath);
      }
    }
  }, [isAuthenticated, redirectPath, router, inviteParam, joinWorkspace]);

  // Update tab if URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const inv = searchParams.get('invite');
    if (inv || tabParam === 'register') {
      setActiveTab('register');
    } else if (tabParam === 'login') {
      setActiveTab('login');
    }
  }, [searchParams]);

  const handleOAuth = (provider: 'google' | 'github') => {
    const params = new URLSearchParams();
    if (inviteParam) params.set('invite', inviteParam);
    const qs = params.toString();
    window.location.href = `/api/auth/${provider}${qs ? `?${qs}` : ''}`;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor, informe seu e-mail e senha.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    clearAuthError();

    try {
      await login({ email, password, inviteCode: inviteParam || undefined });
      setSuccessMsg(inviteParam ? 'Autenticado e adicionado ao workspace da equipe! Redirecionando...' : 'Autenticado com sucesso! Redirecionando...');
      setTimeout(() => {
        router.push(redirectPath);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha na autenticação. Verifique seu e-mail e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('A senha deve ter pelo menos 8 caracteres para garantir a segurança da conta.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg('Você deve ler e concordar com os Termos de Uso e a Política de Privacidade para criar uma conta.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    clearAuthError();

    try {
      await register({
        email,
        password,
        name,
        orgName: orgName || undefined,
        inviteCode: inviteParam || undefined,
      });
      setSuccessMsg(inviteParam ? 'Entrou na equipe com sucesso! Redirecionando ao Studio...' : 'Conta criada com sucesso! Redirecionando ao Studio...');
      setTimeout(() => {
        router.push(redirectPath);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao registrar conta. Tente outro e-mail.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-[#07080B] text-slate-900 dark:text-slate-100 font-mono transition-colors duration-200 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-sky-500/10 dark:bg-sky-500/15 blur-[140px]" />
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      {/* Top Header / Navigation */}
      <header className="relative z-20 flex h-16 w-full items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar para Início</span>
          </Link>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 border border-sky-400/50 dark:border-sky-500/50 text-sky-600 dark:text-sky-400 shadow-sm">
              <Box className="h-4 w-4" />
            </div>
            <span className="font-black text-sm tracking-widest uppercase">
              PRISM<span className="text-sky-500 dark:text-sky-400">.</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          {/* Subtle top indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-400" />

          {/* Heading */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] text-sky-600 dark:text-sky-400 mb-3">
              <Shield className="h-3.5 w-3.5" />
              <span>CONTROLE DE ACESSO MULTI-TENANT</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {activeTab === 'login' ? 'Acesse seu Workspace' : 'Crie sua Conta'}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {activeTab === 'login'
                ? 'Conecte-se para acessar seus diagramas tridimensionais salvos na nuvem'
                : 'Inicie com 14 dias de teste completo do Studio 3D com colaboração em tempo real'}
            </p>
          </div>

          {/* Team Invite Banner */}
          {inviteParam && (
            <div className="mb-5 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 text-xs text-sky-600 dark:text-sky-300 flex items-start gap-2.5">
              <Users className="h-4 w-4 shrink-0 text-sky-500 mt-0.5" />
              <div>
                <p className="font-bold">Convite para Equipe Detectado</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Ao criar sua conta, você será adicionado automaticamente ao Workspace compartilhado com permissão de Editor.
                </p>
              </div>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900/80 p-1 mb-6 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500 dark:text-rose-400"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="flex-1">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 py-2.5 px-3 text-xs font-semibold hover:border-slate-400 dark:hover:border-slate-700 transition-all text-slate-800 dark:text-slate-200 active:scale-[0.98]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.2.2-2 .4-2.7L1.9 6.4C.7 8.8 0 10.8 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('github')}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 py-2.5 px-3 text-xs font-semibold hover:border-slate-400 dark:hover:border-slate-700 transition-all text-slate-800 dark:text-slate-200 active:scale-[0.98]"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          <div className="relative mb-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative bg-white dark:bg-slate-950 px-3 text-[10px] uppercase text-slate-400">
              ou com e-mail corporativo
            </span>
          </div>

          {/* TAB: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  E-MAIL CORPORATIVO
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engenheiro@empresa.com"
                    required
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    SENHA
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Para redefinir sua senha, solicite suporte ao administrador do workspace.')}
                    className="text-[10px] text-sky-500 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 pl-9 pr-10 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 font-bold text-white shadow-lg shadow-sky-500/25 hover:bg-sky-500 disabled:opacity-50 transition-all text-xs active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Studio</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  NOME COMPLETO *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Meu Nome"
                    required
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  E-MAIL CORPORATIVO *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: minhaEmpresa@empresa.com"
                    required
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  ORGANIZAÇÃO / EMPRESA (OPCIONAL)
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ex: FinTech Platform Inc"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  CRIE UMA SENHA SEGURA *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 pl-9 pr-10 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="terms-consent"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-sky-600 focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="terms-consent" className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug cursor-pointer select-none">
                    Declaro que tenho 18 anos ou mais e concordo com os{' '}
                    <Link href="/terms" target="_blank" className="text-sky-600 dark:text-sky-400 font-bold hover:underline">
                      Termos de Uso
                    </Link>
                    , a{' '}
                    <Link href="/privacy" target="_blank" className="text-sky-600 dark:text-sky-400 font-bold hover:underline">
                      Política de Privacidade
                    </Link>{' '}
                    e a{' '}
                    <Link href="/refund" target="_blank" className="text-sky-600 dark:text-sky-400 font-bold hover:underline">
                      Política de Reembolso
                    </Link>. *
                  </label>
                </div>

                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="marketing-optin"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-sky-600 focus:ring-2 focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="marketing-optin" className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug cursor-pointer select-none">
                    (Opcional) Desejo receber benchmarks de arquitetura, atualizações técnicas e comunicados de novos recursos.
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 py-3 font-bold text-white shadow-lg shadow-sky-500/25 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 transition-all text-xs active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Criando Conta...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Criar Conta & Acessar Studio</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="mt-6 text-center text-[10px] text-slate-400">
            {activeTab === 'login' ? (
              <p>
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-sky-500 hover:underline"
                >
                  Cadastre-se gratuitamente
                </button>
              </p>
            ) : (
              <p>
                Já possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-sky-500 hover:underline"
                >
                  Faça login aqui
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-950/50 py-4 px-6 text-center text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
        <div>PRISM Technologies Inc. • Autenticação Criptografada JWT com Isolamento Multi-Tenancy</div>
        <div className="flex items-center justify-center gap-3 text-[10px]">
          <Link href="/privacy" className="hover:text-sky-600 dark:hover:text-sky-400">Privacidade</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-sky-600 dark:hover:text-sky-400">Termos</Link>
          <span>•</span>
          <Link href="/cookies" className="hover:text-sky-600 dark:hover:text-sky-400">Cookies</Link>
          <span>•</span>
          <Link href="/refund" className="hover:text-sky-600 dark:hover:text-sky-400">Reembolso</Link>
        </div>
      </footer>
    </div>
  );
}
