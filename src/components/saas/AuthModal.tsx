'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, UserRole, SaaSPlan } from '@/store/useAuthStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import {
  X,
  Shield,
  Building2,
  Users,
  Check,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  KeyRound,
  ExternalLink,
  Laptop,
  Loader2,
} from 'lucide-react';

export function AuthModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const openModal = useSaaSModalsStore((s) => s.openModal);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const workspaces = useAuthStore((s) => s.workspaces);
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  const authError = useAuthStore((s) => s.authError);
  const clearAuthError = useAuthStore((s) => s.clearAuthError);
  const switchWorkspace = useAuthStore((s) => s.switchWorkspace);
  const updateUserRole = useAuthStore((s) => s.updateUserRole);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const modalPayload = useSaaSModalsStore((s) => s.modalPayload);

  const [activeTab, setActiveTab] = useState<'profile' | 'workspaces' | 'login' | 'register'>('profile');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [orgInput, setOrgInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Profile customization states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatarUrl || '');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (activeModal === 'auth') {
      if (modalPayload && (modalPayload as any).tab) {
        setActiveTab((modalPayload as any).tab);
      } else if (isAuthenticated) {
        setActiveTab('profile');
      }
    }
  }, [activeModal, modalPayload, isAuthenticated]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileAvatar(user.avatarUrl || '');
    }
  }, [user]);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl, profileAvatar]);

  const AVATAR_PRESETS = [
    { id: 'p1', name: 'Cyber Neon', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80' },
    { id: 'p2', name: 'Quantum Core', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=150&auto=format&fit=crop&q=80' },
    { id: 'p3', name: 'Emerald Flux', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80&sat=-100' },
    { id: 'p4', name: 'Violet Nebula', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=150&auto=format&fit=crop&q=80' },
    { id: 'p5', name: 'Solar Flare', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150&auto=format&fit=crop&q=80' },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      if (newPasswordInput && newPasswordInput.length < 8) {
        throw new Error('A nova senha deve possuir pelo menos 8 caracteres.');
      }
      await updateProfile({
        name: profileName,
        avatarUrl: profileAvatar,
        currentPassword: currentPasswordInput || undefined,
        newPassword: newPasswordInput || undefined,
      });
      setProfileMsg({ type: 'success', text: 'Perfil e credenciais atualizados com sucesso!' });
      setCurrentPasswordInput('');
      setNewPasswordInput('');
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err?.message || 'Falha ao atualizar perfil.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (activeModal !== 'auth') return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setIsSubmitting(true);
    setLocalFeedback(null);
    try {
      await login({ email: emailInput, password: passwordInput });
      setActiveTab('profile');
    } catch (err: any) {
      setLocalFeedback(err.message || 'Erro ao realizar login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !nameInput || !passwordInput) {
      setLocalFeedback('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (passwordInput.length < 8) {
      setLocalFeedback('A senha deve ter pelo menos 8 caracteres para garantir a segurança da conta.');
      return;
    }
    setIsSubmitting(true);
    setLocalFeedback(null);
    try {
      await register({
        email: emailInput,
        password: passwordInput,
        name: nameInput,
        orgName: orgInput || undefined,
      });
      setActiveTab('profile');
    } catch (err: any) {
      setLocalFeedback(err.message || 'Erro ao criar conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'github') => {
    // In production, redirects to OAuth gateway endpoint
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-[95vw] sm:w-[90vw] md:max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 sm:p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-500 shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Autenticação & Multi-Tenancy</span>
                  <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] text-sky-500 font-semibold">
                    SaaS Core
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gerencie sua identidade, organização e permissões granulares de acesso
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800/60 pb-3 mb-3 text-xs font-semibold shrink-0">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  Perfil & Personalização
                </button>
                <button
                  onClick={() => setActiveTab('workspaces')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'workspaces'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  Workspaces ({workspaces.length})
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('login')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'login'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  Fazer Login
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'register'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  Criar Conta
                </button>
              </>
            )}
          </div>

          {/* TAB 1: Profile Customization & Roles */}
          {activeTab === 'profile' && isAuthenticated && user && (
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
                <div className="h-16 w-16 rounded-full border-2 border-sky-500 overflow-hidden bg-slate-800 flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-md">
                  {profileAvatar && !avatarError ? (
                    <img
                      src={profileAvatar}
                      alt={profileName || 'User'}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (profileName || user.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      {profileName || user.name}
                    </span>
                    <span className="rounded bg-sky-500/20 text-sky-400 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                      {user.role}
                    </span>
                    <span className="rounded bg-amber-500/20 text-amber-400 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                      Plano {user.plan}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Workspace Ativo: <strong className="text-sky-400">{currentWorkspace?.name}</strong>
                  </p>
                </div>
              </div>

              {/* Profile Customization Form (Name, Avatar, Password) */}
              <form onSubmit={handleSaveProfile} className="space-y-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                  <span>Personalização de Perfil & Credenciais</span>
                </h4>

                {/* Edit Name */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Nome Completo ou Nome de Exibição
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    placeholder="Seu nome"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 min-h-[44px]"
                  />
                </div>

                {/* Edit Avatar: Presets + URL */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                    Avatar 3D / Imagem de Perfil
                  </label>

                  {/* Preset Choices */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {AVATAR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setProfileAvatar(p.url);
                          setAvatarError(false);
                        }}
                        className={`h-10 w-10 rounded-full border-2 overflow-hidden transition-transform hover:scale-105 ${
                          profileAvatar === p.url
                            ? 'border-sky-500 ring-2 ring-sky-400/50 scale-105'
                            : 'border-slate-300 dark:border-slate-700 opacity-80 hover:opacity-100'
                        }`}
                        title={p.name}
                      >
                        <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>

                  {/* Custom URL Input */}
                  <input
                    type="url"
                    value={profileAvatar}
                    onChange={(e) => {
                      setProfileAvatar(e.target.value);
                      setAvatarError(false);
                    }}
                    placeholder="Ou cole a URL direta de uma imagem (.png, .jpg, .svg)..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 min-h-[44px]"
                  />
                </div>

                {/* Change Password Fields */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    Alteração de Senha (Opcional)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="password"
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        placeholder="Senha Atual"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="Nova Senha (mín. 8 caracteres)"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Feedback message */}
                {profileMsg && (
                  <div
                    className={`rounded-lg p-2.5 text-xs ${
                      profileMsg.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                    }`}
                  >
                    {profileMsg.text}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 text-xs transition-colors shadow-md disabled:opacity-50 min-h-[44px]"
                >
                  {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Salvar Alterações de Perfil</span>
                </button>
              </form>

              {/* Role Selector Simulation */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase">
                  Alternar Permissão / Role no Workspace
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'editor', 'viewer'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => updateUserRole(r)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs min-h-[44px] ${
                        user.role === r
                          ? 'border-sky-500 bg-sky-500/10 text-sky-400 font-bold'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      <span className="uppercase">{r}</span>
                      <span className="text-[9px] font-normal text-slate-400">
                        {r === 'admin' ? 'Controle Total' : r === 'editor' ? 'Edita Diagramas' : 'Apenas Leitura'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => openModal('billing')}
                  className="flex items-center gap-1.5 text-xs text-sky-400 hover:underline min-h-[44px] py-1"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Gerenciar Assinatura & Faturamento</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setActiveTab('login');
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors min-h-[44px]"
                >
                  Encerrar Sessão
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Workspaces */}
          {activeTab === 'workspaces' && isAuthenticated && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione o workspace para isolar projetos, diagramas e políticas de controle da equipe:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    onClick={() => switchWorkspace(ws.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      currentWorkspace?.id === ws.id
                        ? 'border-sky-500 bg-sky-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-sky-400">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{ws.name}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                            {ws.plan}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{ws.memberCount} colaboradores</span>
                          <span>•</span>
                          <span className="capitalize">Sua função: {ws.role}</span>
                        </div>
                      </div>
                    </div>
                    {currentWorkspace?.id === ws.id && (
                      <span className="flex items-center gap-1 text-xs text-sky-400 font-bold">
                        <Check className="h-4 w-4" />
                        <span>Ativo</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => openModal('enterprise')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Configurar Single Sign-On (SSO / SAML) para Empresa</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Login */}
          {(activeTab === 'login' || !isAuthenticated) && activeTab !== 'register' && (
            <div className="space-y-4">
              {/* Feedback Alert Banner */}
              {(localFeedback || authError) && (
                <div className="flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>{localFeedback || authError}</span>
                  </div>
                  <button
                    onClick={() => {
                      setLocalFeedback(null);
                      clearAuthError();
                    }}
                    className="text-rose-400 hover:text-rose-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* OAuth Providers */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 py-2.5 px-3 text-xs font-semibold hover:border-slate-400 dark:hover:border-slate-700 transition-all text-slate-800 dark:text-slate-200"
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
                  <span>Google OAuth</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth('github')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 py-2.5 px-3 text-xs font-semibold hover:border-slate-400 dark:hover:border-slate-700 transition-all text-slate-800 dark:text-slate-200"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub OAuth</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                <span className="text-[10px] uppercase text-slate-400">ou com email profissional</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Email Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="nome@suaempresa.com"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-sky-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 font-bold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-500 disabled:opacity-50 transition-all text-xs"
                >
                  <span>{isSubmitting ? 'Autenticando...' : 'Entrar no Workspace'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: Register */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              {/* Feedback Alert Banner */}
              {(localFeedback || authError) && (
                <div className="flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>{localFeedback || authError}</span>
                  </div>
                  <button
                    onClick={() => {
                      setLocalFeedback(null);
                      clearAuthError();
                    }}
                    className="text-rose-400 hover:text-rose-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Seu Nome Completo
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Engenheiro(a) de Software"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Nome da Organização (Opcional)
                  </label>
                  <input
                    type="text"
                    value={orgInput}
                    onChange={(e) => setOrgInput(e.target.value)}
                    placeholder="Minha Empresa S/A"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Email Corporativo
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Senha de Acesso
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 px-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 disabled:opacity-50 transition-all text-xs"
                >
                  <span>{isSubmitting ? 'Criando Conta...' : 'Criar Novo Workspace (14 dias Pro Grátis)'}</span>
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
