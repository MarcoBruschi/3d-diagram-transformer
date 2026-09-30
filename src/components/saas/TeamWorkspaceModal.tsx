'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/services/apiClient';
import {
  X,
  Users,
  Building2,
  UserPlus,
  Copy,
  Check,
  Shield,
  Mail,
  Loader2,
  ExternalLink,
  Crown,
  Sparkles,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';

export function TeamWorkspaceModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const user = useAuthStore((s) => s.user);
  const currentWorkspace = useAuthStore((s) => s.currentWorkspace);

  // Compute immediate reliable invite URL from client state if available
  const clientInviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/register?invite=${currentWorkspace?.slug || currentWorkspace?.id || (user?.email ? user.email.split('@')[0] : 'team')}`
    : '';

  const [isLoading, setIsLoading] = useState(false);
  const [workspace, setWorkspace] = useState<{ id: string; name: string; slug: string; plan: string } | null>(
    currentWorkspace ? {
      id: currentWorkspace.id,
      name: currentWorkspace.name,
      slug: currentWorkspace.slug,
      plan: currentWorkspace.plan,
    } : null
  );
  const [members, setMembers] = useState<Array<{ id: string; name: string; email: string; role: string; createdAt: string }>>([]);
  const [inviteUrl, setInviteUrl] = useState(clientInviteUrl);
  const [copiedLink, setCopiedLink] = useState(false);

  // Invite role for direct link generation
  const [inviteLinkRole, setInviteLinkRole] = useState<'admin' | 'editor' | 'viewer'>('editor');

  // Invite input state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Member management state
  const [memberToDelete, setMemberToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // Join another workspace state
  const joinWorkspace = useAuthStore((s) => s.joinWorkspace);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const baseInviteUrl = inviteUrl || clientInviteUrl;
  const activeInviteUrl = baseInviteUrl
    ? `${baseInviteUrl}${baseInviteUrl.includes('?') ? '&' : '?'}role=${inviteLinkRole}&redirect=/studio`
    : '';

  useEffect(() => {
    if (currentWorkspace) {
      setWorkspace({
        id: currentWorkspace.id,
        name: currentWorkspace.name,
        slug: currentWorkspace.slug,
        plan: currentWorkspace.plan,
      });
    }
  }, [currentWorkspace]);

  const handleUpdateMemberRole = async (memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    setUpdatingRoleId(memberId);
    try {
      await api.workspaces.updateMemberRole(memberId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
      setStatusMsg({ type: 'success', text: `Cargo alterado com sucesso para ${newRole}!` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Falha ao atualizar cargo do membro.' });
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleConfirmDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeletingMember(true);
    try {
      await api.workspaces.removeMember(memberToDelete.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      setStatusMsg({ type: 'success', text: `Membro ${memberToDelete.name} removido da equipe.` });
      setMemberToDelete(null);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Falha ao remover membro da equipe.' });
    } finally {
      setIsDeletingMember(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = joinCodeInput.trim();
    if (!rawInput) return;

    setIsJoining(true);
    setJoinMsg(null);

    try {
      let codeToJoin = rawInput;
      if (rawInput.includes('invite=')) {
        try {
          const parsed = new URL(rawInput.startsWith('http') ? rawInput : `http://localhost/${rawInput}`);
          codeToJoin = parsed.searchParams.get('invite') || codeToJoin;
        } catch {}
      } else if (rawInput.includes('join=')) {
        try {
          const parsed = new URL(rawInput.startsWith('http') ? rawInput : `http://localhost/${rawInput}`);
          codeToJoin = parsed.searchParams.get('join') || codeToJoin;
        } catch {}
      }

      const res = await joinWorkspace(codeToJoin);
      setJoinMsg({ type: 'success', text: res.message || 'Você entrou no workspace com sucesso!' });
      setJoinCodeInput('');
      await fetchTeam();
    } catch (err: any) {
      setJoinMsg({ type: 'error', text: err?.message || 'Falha ao entrar no workspace. Verifique o código, link ou slug.' });
    } finally {
      setIsJoining(false);
    }
  };

  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const res = await api.workspaces.getMembers();
      if (res) {
        if (res.workspace) setWorkspace(res.workspace);
        if (res.members && res.members.length > 0) setMembers(res.members);
        if (res.inviteUrl) setInviteUrl(res.inviteUrl);
      }
    } catch (err: any) {
      console.warn('[TeamWorkspaceModal Error]:', err);
      if (!inviteUrl && clientInviteUrl) {
        setInviteUrl(clientInviteUrl);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeModal === 'team') {
      if (clientInviteUrl) {
        setInviteUrl(clientInviteUrl);
      }
      fetchTeam();
      setStatusMsg(null);
    }
  }, [activeModal, clientInviteUrl]);

  if (activeModal !== 'team') return null;

  const handleCopyInviteLink = () => {
    const urlToCopy = activeInviteUrl;
    if (!urlToCopy) return;
    navigator.clipboard.writeText(urlToCopy);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await api.workspaces.inviteMember({
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });

      if (res && res.success) {
        setStatusMsg({ type: 'success', text: res.message });
        setInviteEmail('');
        fetchTeam();
      } else {
        setStatusMsg({ type: 'error', text: res?.message || 'Falha ao convidar membro' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Erro ao processar convite' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-[95vw] sm:w-[90vw] md:max-w-2xl lg:max-w-3xl max-h-[92vh] sm:max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 sm:p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-500 shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Equipe & Membros do Workspace</span>
                  <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] text-sky-500 font-semibold uppercase">
                    {workspace?.plan || 'Free'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {workspace?.name || 'Workspace Principal'} • Adicione colegas para colaborar nos mesmos diagramas
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

          <div className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Confirmation Dialog for Member Deletion */}
            {memberToDelete && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                  <span className="text-xs text-rose-200">
                    Remover <strong>{memberToDelete.name}</strong> deste workspace? Ele perderá acesso imediato aos diagramas.
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  <button
                    onClick={() => setMemberToDelete(null)}
                    disabled={isDeletingMember}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold hover:bg-slate-700 text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDeleteMember}
                    disabled={isDeletingMember}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-sm"
                  >
                    {isDeletingMember ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    <span>Confirmar Remoção</span>
                  </button>
                </div>
              </div>
            )}

            {/* 1-Click Workspace Invite Link with Role Selector */}
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3.5 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <label className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Link de Convite Direto para o Workspace</span>
                </label>
                <span className="text-[10px] text-slate-400">Usuários novos criam conta; cadastrados entram com 1 clique</span>
              </div>

              {/* Role selector for invitation link */}
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Cargo do Convite:</span>
                {(['viewer', 'editor', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setInviteLinkRole(r)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      inviteLinkRole === r
                        ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {r === 'viewer' ? 'Visualizador' : r === 'editor' ? 'Editor' : 'Administrador'}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeInviteUrl}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 px-3 text-xs text-slate-900 dark:text-slate-200 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  disabled={!activeInviteUrl}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-sky-500 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>
            </div>

            {/* Direct Email Invite Form */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Convidar por E-mail
              </label>
              <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="colega@empresa.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-sky-500 min-h-[44px]"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 px-3 text-xs text-slate-900 dark:text-slate-200 outline-none min-h-[44px]"
                >
                  <option value="editor">Editor (Cria & Edita)</option>
                  <option value="viewer">Visualizador (Apenas Leitura)</option>
                  <option value="admin">Administrador</option>
                </select>
                <button
                  type="submit"
                  disabled={isSubmitting || !inviteEmail}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold px-4 py-2.5 text-xs transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  <span>Convidar</span>
                </button>
              </form>

              {statusMsg && (
                <div
                  className={`mt-2 rounded-lg p-2.5 text-xs ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}
            </div>

            {/* Join Another Workspace via Code or Link */}
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 dark:bg-sky-950/20 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-sky-500" />
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Entrar em um Workspace Existente
                </label>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3">
                Já possui conta cadastrada e recebeu um código de convite (<code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] text-sky-500">inv_...</code>), link completo ou slug do workspace de um colega? Cole abaixo para entrar instantaneamente na equipe.
              </p>
              <form onSubmit={handleJoinSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Cole aqui o link, código ou slug do workspace..."
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 px-3 text-xs text-slate-900 dark:text-slate-200 outline-none focus:border-sky-500 min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={isJoining || !joinCodeInput.trim()}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2.5 text-xs transition-colors disabled:opacity-50 min-h-[44px] shrink-0 shadow-sm"
                >
                  {isJoining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                  <span>{isJoining ? 'Entrando...' : 'Entrar no Workspace'}</span>
                </button>
              </form>
              {joinMsg && (
                <div
                  className={`mt-2.5 rounded-lg p-2.5 text-xs flex items-center gap-2 ${
                    joinMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  }`}
                >
                  {joinMsg.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <span>{joinMsg.text}</span>
                </div>
              )}
            </div>

            {/* Members List with Admin Role Controls & Delete */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Membros do Workspace ({members.length})
                </span>
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden">
                {members.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">Nenhum membro encontrado.</div>
                ) : (
                  members.map((m) => {
                    const isSelf = m.id === user?.id || m.email === user?.email;
                    const isAdmin = user?.role === 'admin';

                    return (
                      <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-500 font-bold uppercase shrink-0">
                            {m.name ? m.name.charAt(0) : m.email.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{m.name || m.email.split('@')[0]}</span>
                              {isSelf && (
                                <span className="rounded bg-sky-500/15 text-sky-400 px-1 text-[9px] font-bold">
                                  Você
                                </span>
                              )}
                              {m.role === 'admin' && (
                                <span title="Administrador">
                                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">{m.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {isAdmin ? (
                            <>
                              <select
                                value={m.role}
                                disabled={updatingRoleId === m.id}
                                onChange={(e) => handleUpdateMemberRole(m.id, e.target.value as any)}
                                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-2 text-[11px] font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500 min-h-[36px]"
                                title="Alterar cargo do membro"
                              >
                                <option value="editor">Editor</option>
                                <option value="viewer">Visualizador</option>
                                <option value="admin">Administrador</option>
                              </select>

                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => setMemberToDelete({ id: m.id, name: m.name || m.email })}
                                  className="flex items-center justify-center h-9 w-9 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title="Remover membro do workspace"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          ) : (
                            <span
                              className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase ${
                                m.role === 'admin'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  : m.role === 'editor'
                                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                              }`}
                            >
                              {m.role}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
