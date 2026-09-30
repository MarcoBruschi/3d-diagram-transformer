'use client';

import { create } from 'zustand';
import { api, setAccessToken, getAccessToken } from '@/lib/services/apiClient';

export type UserRole = 'admin' | 'editor' | 'viewer';
export type SaaSPlan = 'free' | 'pro' | 'enterprise';

export interface SaaSUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  plan: SaaSPlan;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: SaaSPlan;
  memberCount: number;
  role: UserRole;
  isPersonal?: boolean;
}

interface AuthStore {
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  authError: string | null;
  user: SaaSUser | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  checkSession: () => Promise<void>;
  login: (credentials: { email: string; password?: string; role?: UserRole; inviteCode?: string }) => Promise<boolean>;
  register: (data: { email: string; password?: string; name: string; orgName?: string; inviteCode?: string }) => Promise<boolean>;
  joinWorkspace: (inviteCode: string) => Promise<{ success: boolean; message: string }>;
  createWorkspace: (name: string) => Promise<Workspace>;
  logout: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void> | void;
  updateProfile: (data: { name?: string; avatarUrl?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
  updatePlan: (plan: SaaSPlan) => void;
  updateUserRole: (role: UserRole) => void;
  clearAuthError: () => void;
}



function getInitialAuth() {
  if (typeof window === 'undefined') {
    return { user: null, workspace: null, isAuthenticated: false, isLoading: false };
  }
  try {
    const token = localStorage.getItem('diag_access_token');
    const cachedUser = localStorage.getItem('diag_user');
    const cachedWs = localStorage.getItem('diag_workspace');
    if (token && cachedUser) {
      const parsedUser = JSON.parse(cachedUser);
      const parsedWs = cachedWs ? JSON.parse(cachedWs) : null;
      return {
        user: parsedUser,
        workspace: parsedWs,
        isAuthenticated: true,
        isLoading: false,
      };
    }
  } catch {}
  return { user: null, workspace: null, isAuthenticated: false, isLoading: false };
}

const initialAuth = getInitialAuth();

export const useAuthStore = create<AuthStore>((set, get) => ({
  isAuthenticated: initialAuth.isAuthenticated,
  isLoadingSession: initialAuth.isLoading,
  authError: null,
  user: initialAuth.user,
  workspaces: initialAuth.workspace ? [initialAuth.workspace] : [],
  currentWorkspace: initialAuth.workspace,

  clearAuthError: () => set({ authError: null }),

  checkSession: async () => {
    const token = getAccessToken();
    if (!token) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('diag_user');
        localStorage.removeItem('diag_workspace');
      }
      set({
        isAuthenticated: false,
        user: null,
        workspaces: [],
        currentWorkspace: null,
        isLoadingSession: false,
      });
      return;
    }

    // If we don't have user in state yet, show brief loading
    if (!get().user) {
      set({ isLoadingSession: true });
    }

    try {
      const res = await api.auth.me();
      if (res && res.user) {
        const u = res.user;
        const mappedUser: SaaSUser = {
          id: u.id || `usr-${Date.now()}`,
          name: u.name || u.email?.split('@')[0] || 'Usuário',
          email: u.email,
          avatarUrl: u.avatarUrl || u.avatar,
          role: (u.role as UserRole) || 'editor',
          plan: (u.organization?.plan as SaaSPlan) || (u.plan as SaaSPlan) || 'free',
        };

        // Fetch workspaces from API to maintain [ Workspace Pessoal (Padrão) ] and [ Workspaces Adicionados ]
        let apiWorkspaces: Workspace[] = [];
        try {
          const wsRes = await api.workspaces.list();
          if (wsRes && Array.isArray(wsRes.workspaces)) {
            apiWorkspaces = wsRes.workspaces.map((w: any) => ({
              id: w.id,
              name: w.name,
              slug: w.slug,
              plan: (w.plan as SaaSPlan) || 'free',
              memberCount: w.memberCount || 1,
              role: (w.role as UserRole) || 'editor',
              isPersonal: false,
            }));
          }
        } catch (err) {
          console.warn('[checkSession] Error fetching workspaces list:', err);
        }

        // Determine [ Workspace Pessoal (Padrão) ]
        const personalWsName = 'Workspace Pessoal (Padrão)';
        let personalWs: Workspace;
        const foundPersonal = apiWorkspaces.find(
          (w) =>
            w.id === u.organization?.id ||
            w.id === u.organizationId ||
            w.name?.toLowerCase().includes('pessoal') ||
            w.name?.toLowerCase().includes('principal')
        );

        if (foundPersonal) {
          personalWs = {
            ...foundPersonal,
            name: foundPersonal.name || personalWsName,
            isPersonal: true,
          };
        } else {
          personalWs = {
            id: u.organization?.id || u.organizationId || `ws-personal-${mappedUser.id}`,
            name: personalWsName,
            slug: 'workspace-personal',
            plan: mappedUser.plan,
            memberCount: 1,
            role: mappedUser.role,
            isPersonal: true,
          };
        }

        // Maintain [ Workspaces Adicionados ]
        const addedWorkspaces = apiWorkspaces
          .filter((w) => w.id !== personalWs.id)
          .map((w) => ({ ...w, isPersonal: false }));

        const allWorkspaces = [personalWs, ...addedWorkspaces];

        // Restore active workspace if stored in localStorage, otherwise personalWs
        let activeWs = personalWs;
        if (typeof window !== 'undefined') {
          const cachedWsJson = localStorage.getItem('diag_workspace');
          if (cachedWsJson) {
            try {
              const cached = JSON.parse(cachedWsJson);
              const matched = allWorkspaces.find((w) => w.id === cached.id);
              if (matched) activeWs = matched;
            } catch {}
          }
          localStorage.setItem('diag_user', JSON.stringify(mappedUser));
          localStorage.setItem('diag_workspace', JSON.stringify(activeWs));
        }

        set({
          user: mappedUser,
          workspaces: allWorkspaces,
          currentWorkspace: activeWs,
          isAuthenticated: true,
          isLoadingSession: false,
          authError: null,
        });
      } else {
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('diag_user');
          localStorage.removeItem('diag_workspace');
        }
        set({
          isAuthenticated: false,
          user: null,
          workspaces: [],
          currentWorkspace: null,
          isLoadingSession: false,
        });
      }
    } catch {
      // If network fails but we had cached user, keep offline access
      if (!get().user) {
        setAccessToken(null);
        set({
          isAuthenticated: false,
          user: null,
          workspaces: [],
          currentWorkspace: null,
          isLoadingSession: false,
        });
      } else {
        set({ isLoadingSession: false });
      }
    }
  },

  login: async ({ email, password, role = 'editor', inviteCode }: { email: string; password?: string; role?: UserRole; inviteCode?: string }) => {
    if (!password) {
      throw new Error('A senha é obrigatória para autenticação.');
    }
    set({ isLoadingSession: true, authError: null });
    try {
      const res = await api.auth.login({ email, password, inviteCode });
      if (res && res.accessToken) {
        setAccessToken(res.accessToken);
        const u = res.user || {};
        const userPlan = (u.plan as SaaSPlan) || 'free';
        const userRole = (u.role as UserRole) || role;
        const loggedUser: SaaSUser = {
          id: u.id || `usr-${Date.now()}`,
          name: u.name || email.split('@')[0],
          email: u.email || email,
          avatarUrl: u.avatarUrl || u.avatar,
          role: userRole,
          plan: userPlan,
        };
        const ws: Workspace = {
          id: u.organizationId || `ws-${Date.now()}`,
          name: u.organizationName || u.organization?.name || `${email.split('@')[0]}'s Workspace`,
          slug: 'org-main',
          plan: userPlan,
          memberCount: 1,
          role: userRole,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('diag_user', JSON.stringify(loggedUser));
          localStorage.setItem('diag_workspace', JSON.stringify(ws));
        }
        set({
          isAuthenticated: true,
          user: loggedUser,
          workspaces: [ws],
          currentWorkspace: ws,
          isLoadingSession: false,
          authError: null,
        });
        return true;
      }
      throw new Error('Falha ao autenticar.');
    } catch (err: any) {
      set({
        isLoadingSession: false,
        authError: err?.message || 'Credenciais inválidas. Verifique seu email e senha.',
      });
      throw err;
    }
  },

  joinWorkspace: async (inviteCode: string) => {
    try {
      const res = await api.workspaces.join(inviteCode);
      if (res && res.accessToken) {
        setAccessToken(res.accessToken);
      }
      if (res && res.workspace) {
        const newWs: Workspace = {
          id: res.workspace.id,
          name: res.workspace.name,
          slug: res.workspace.slug,
          plan: (res.workspace.plan as SaaSPlan) || 'free',
          memberCount: res.workspace.memberCount || 1,
          role: (res.workspace.role as UserRole) || 'editor',
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('diag_workspace', JSON.stringify(newWs));
        }
        set((state) => {
          const filtered = state.workspaces.filter((w) => w.id !== newWs.id);
          return {
            currentWorkspace: newWs,
            workspaces: [newWs, ...filtered],
            user: state.user ? { ...state.user, role: newWs.role, plan: newWs.plan } : null,
          };
        });
      }
      await get().checkSession();
      return { success: true, message: res.message };
    } catch (err: any) {
      throw new Error(err.message || 'Falha ao entrar no workspace.');
    }
  },

  createWorkspace: async (name: string) => {
    try {
      const res = await api.workspaces.create(name);
      if (res && res.accessToken) {
        setAccessToken(res.accessToken);
      }
      const wsData = res?.workspace;
      const newWs: Workspace = {
        id: wsData?.id || `ws-${Date.now()}`,
        name: wsData?.name || name,
        slug: wsData?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        plan: (wsData?.plan as SaaSPlan) || get().currentWorkspace?.plan || 'free',
        memberCount: wsData?.memberCount || 1,
        role: (wsData?.role as UserRole) || 'admin',
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('diag_workspace', JSON.stringify(newWs));
      }
      set((state) => {
        const filtered = state.workspaces.filter((w) => w.id !== newWs.id);
        return {
          currentWorkspace: newWs,
          workspaces: [newWs, ...filtered],
          user: state.user ? { ...state.user, role: newWs.role, plan: newWs.plan } : null,
        };
      });
      return newWs;
    } catch (err: any) {
      const fallbackWs: Workspace = {
        id: `ws-${Date.now()}`,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        plan: get().currentWorkspace?.plan || 'free',
        memberCount: 1,
        role: 'admin',
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('diag_workspace', JSON.stringify(fallbackWs));
      }
      set((state) => ({
        workspaces: [fallbackWs, ...state.workspaces.filter((w) => w.id !== fallbackWs.id)],
        currentWorkspace: fallbackWs,
        user: state.user ? { ...state.user, role: 'admin' } : null,
      }));
      return fallbackWs;
    }
  },

  register: async ({ email, password, name, orgName, inviteCode }: { email: string; password?: string; name: string; orgName?: string; inviteCode?: string }) => {
    if (!password) {
      throw new Error('A senha é obrigatória para criação de conta.');
    }
    set({ isLoadingSession: true, authError: null });
    try {
      const res = await api.auth.register({ email, password, name, orgName, inviteCode });
      if (res && res.accessToken) {
        setAccessToken(res.accessToken);
        const u = res.user || {};
        const userPlan = (u.plan as SaaSPlan) || 'free';
        const userRole = (u.role as UserRole) || (inviteCode ? 'editor' : 'admin');
        const registeredUser: SaaSUser = {
          id: u.id || `usr-${Date.now()}`,
          name: u.name || name,
          email: u.email || email,
          avatarUrl: u.avatarUrl || u.avatar,
          role: userRole,
          plan: userPlan,
        };
        const ws: Workspace = {
          id: u.organizationId || `ws-${Date.now()}`,
          name: orgName || (inviteCode ? 'Workspace Compartilhado' : `${name}'s Workspace`),
          slug: 'org-main',
          plan: userPlan,
          memberCount: inviteCode ? 2 : 1,
          role: userRole,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('diag_user', JSON.stringify(registeredUser));
          localStorage.setItem('diag_workspace', JSON.stringify(ws));
        }
        set({
          isAuthenticated: true,
          user: registeredUser,
          workspaces: [ws],
          currentWorkspace: ws,
          isLoadingSession: false,
          authError: null,
        });
        return true;
      }
      throw new Error('Falha no cadastro.');
    } catch (err: any) {
      set({
        isLoadingSession: false,
        authError: err?.message || 'Falha ao registrar conta. E-mail já em uso.',
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch {
      // Swallow network errors — logout must always succeed client-side
    } finally {
      // BUG-002: Always clear token in finally to prevent zombie tokens
      // regardless of whether the API call succeeded, failed, or threw
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('diag_user');
        localStorage.removeItem('diag_workspace');
      }
      set({
        isAuthenticated: false,
        user: null,
        workspaces: [],
        currentWorkspace: null,
        authError: null,
        isLoadingSession: false,
      });
    }
  },

  switchWorkspace: async (workspaceId: string) => {
    const ws = get().workspaces.find((w) => w.id === workspaceId);
    if (!ws) return;

    // Optimistically update active workspace in state & localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('diag_workspace', JSON.stringify(ws));
    }
    set((state) => {
      const updatedUser = state.user ? { ...state.user, role: ws.role, plan: ws.plan } : null;
      if (updatedUser && typeof window !== 'undefined') {
        localStorage.setItem('diag_user', JSON.stringify(updatedUser));
      }
      return {
        currentWorkspace: ws,
        user: updatedUser,
      };
    });

    // Call API to switch server-side workspace, update token and sync lists
    try {
      const res = await api.workspaces.switch(workspaceId);
      if (res?.accessToken) {
        setAccessToken(res.accessToken);
      }
      const wsRes = await api.workspaces.list();
      if (wsRes && Array.isArray(wsRes.workspaces)) {
        const currentList = get().workspaces;
        const personalWs = currentList.find((w) => w.isPersonal) || currentList[0];
        const addedWorkspaces = wsRes.workspaces
          .filter((w: any) => w.id !== personalWs?.id)
          .map((w: any) => ({
            id: w.id,
            name: w.name,
            slug: w.slug,
            plan: (w.plan as SaaSPlan) || 'free',
            memberCount: w.memberCount || 1,
            role: (w.role as UserRole) || 'editor',
            isPersonal: false,
          }));
        if (personalWs) {
          set({ workspaces: [personalWs, ...addedWorkspaces] });
        }
      }
    } catch (err) {
      console.warn('[switchWorkspace API Error]:', err);
    }
  },

  updatePlan: (plan: SaaSPlan) => {
    set((state) => ({
      user: state.user ? { ...state.user, plan } : null,
      currentWorkspace: state.currentWorkspace ? { ...state.currentWorkspace, plan } : null,
    }));
  },

  updateUserRole: (role: UserRole) => {
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    }));
  },

  updateProfile: async (data) => {
    const res = await api.auth.updateProfile(data);
    if (res && res.user) {
      set((state) => {
        const updatedUser: SaaSUser = {
          id: res.user.id || state.user?.id || `usr-${Date.now()}`,
          name: res.user.name || state.user?.name || '',
          email: res.user.email || state.user?.email || '',
          avatarUrl: res.user.avatarUrl,
          role: res.user.role || state.user?.role || 'editor',
          plan: res.user.plan || state.user?.plan || 'free',
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('diag_user', JSON.stringify(updatedUser));
        }
        return { user: updatedUser };
      });
    }
  },
}));
