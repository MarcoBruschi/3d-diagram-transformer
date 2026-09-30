/**
 * Comprehensive Client-Side API Service for 3D Diagram Transformer SaaS
 * Covers Tier 1 (Core SaaS) and Tier 2 (Competitive Differentiators)
 */

let cachedAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('diag_access_token', token);
    } else {
      localStorage.removeItem('diag_access_token');
    }
  }
}

export function getAccessToken(): string | null {
  if (cachedAccessToken) return cachedAccessToken;
  if (typeof window !== 'undefined') {
    cachedAccessToken = localStorage.getItem('diag_access_token');
  }
  return cachedAccessToken;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshRes = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          return data.accessToken;
        }
      }
      setAccessToken(null);
      return null;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle token refresh with single-flight deduplication
  if (res.status === 401 && !endpoint.includes('/api/auth/')) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      const retryRes = await fetch(endpoint, { ...options, headers, credentials: 'include' });
      if (!retryRes.ok) {
        const errData = await retryRes.json().catch(() => ({}));
        const err: any = new Error(errData.error || errData.message || `HTTP ${retryRes.status}`);
        err.status = retryRes.status;
        throw err;
      }
      return retryRes.json();
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const err: any = new Error(errorBody.error || errorBody.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export const api = {
  // Tier 1.1: Auth & Multi-Tenancy
  auth: {
    register: (data: { email: string; password: string; name: string; orgName?: string; inviteCode?: string }) =>
      request<{ success: boolean; user: any; accessToken: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string; inviteCode?: string }) =>
      request<{ success: boolean; user: any; accessToken: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<{ user: any }>('/api/auth/me'),
    logout: () =>
      request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }).then((res) => {
        setAccessToken(null);
        return res;
      }),
    updateProfile: (data: { name?: string; avatarUrl?: string; currentPassword?: string; newPassword?: string }) =>
      request<{ success: boolean; user: any; message: string }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Workspaces & Team Members
  workspaces: {
    list: () =>
      request<{ workspaces: any[]; personalWorkspace?: any; addedWorkspaces?: any[]; currentWorkspaceId?: string }>('/api/workspaces'),
    create: (name: string) =>
      request<{ success: boolean; workspace: any; accessToken?: string; message?: string }>('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    switch: (workspaceId: string) =>
      request<{ success: boolean; workspace: any; accessToken: string; user: any; message?: string }>('/api/workspaces/switch', {
        method: 'POST',
        body: JSON.stringify({ workspaceId }),
      }),
    getMembers: () =>
      request<{
        workspace: { id: string; name: string; slug: string; plan: string };
        members: Array<{ id: string; name: string; email: string; role: string; avatarUrl?: string; createdAt: string }>;
        inviteUrl: string;
      }>('/api/workspaces/members'),
    inviteMember: (data: { email: string; role?: 'admin' | 'editor' | 'viewer' }) =>
      request<{ success: boolean; message: string; isPendingAccount?: boolean; member?: any; inviteUrl: string }>('/api/workspaces/members', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateMemberRole: (memberId: string, role: 'admin' | 'editor' | 'viewer') =>
      request<{ success: boolean; message: string; member?: any }>('/api/workspaces/members', {
        method: 'PATCH',
        body: JSON.stringify({ memberId, role }),
      }),
    removeMember: (memberId: string) =>
      request<{ success: boolean; message: string }>('/api/workspaces/members', {
        method: 'DELETE',
        body: JSON.stringify({ memberId }),
      }),
    join: (inviteCode: string) =>
      request<{ success: boolean; message: string; accessToken: string; workspace: any; user: any }>('/api/workspaces/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode }),
      }),
  },

  // Tier 1.2: Diagram Persistence & Versions
  diagrams: {
    list: (params?: { page?: number; limit?: number; search?: string; type?: string; filter?: 'personal' | 'workspace' | 'all' }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.search) query.set('search', params.search);
      if (params?.type) query.set('type', params.type);
      if (params?.filter) query.set('filter', params.filter);
      return request<{ data: any[]; pagination: any }>(`/api/diagrams?${query.toString()}`);
    },

    getById: (id: string) => request<{ diagram: any }>(`/api/diagrams/${id}`),

    create: (data: { name: string; description?: string; type?: string; data: any; isPublic?: boolean }) =>
      request<{ success: boolean; diagram: any }>('/api/diagrams', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<{ name: string; description: string; type: string; data: any; isPublic: boolean }>) =>
      request<{ success: boolean; diagram: any }>(`/api/diagrams/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/diagrams/${id}`, {
        method: 'DELETE',
      }),

    duplicate: (id: string) =>
      request<{ success: boolean; diagram: any }>(`/api/diagrams/${id}/duplicate`, {
        method: 'POST',
      }),

    getVersions: (id: string) =>
      request<{ versions: any[] }>(`/api/diagrams/${id}/versions`),

    getVersionSnapshot: (id: string, version: number) =>
      request<{ snapshot: any }>(`/api/diagrams/${id}/versions/${version}`),

    setShare: (id: string, isPublic: boolean) =>
      request<{ success: boolean; diagram: any; shareUrl: string | null }>(`/api/diagrams/${id}/share`, {
        method: 'POST',
        body: JSON.stringify({ isPublic }),
      }),

    getShared: (token: string) =>
      request<{ diagram: any; source: string }>(`/api/diagrams/shared/${token}`),

    // Tier 2.10: Architecture Diff between versions
    getDiff: (id: string, v1: number, v2: number) =>
      request<{ v1: number; v2: number; summary: any; diff: any }>(`/api/diagrams/${id}/diff?v1=${v1}&v2=${v2}`),

    // Tier 2.6: Advanced Multi-Format Export
    getExportUrl: (id: string, format: 'mermaid' | 'drawio' | 'markdown' | 'json') =>
      `/api/diagrams/${id}/export?format=${format}`,

    // Tier 3.14: Automated Architecture Decision Record (ADR)
    createAdr: (id: string, data: { decisionTitle: string; userRationale?: string; status?: string; diagramData?: any; diagramName?: string }) =>
      request<{ success: boolean; adr: any; markdown: string; diagramId?: string }>(`/api/diagrams/${id}/adr`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    listAdrs: (id: string) =>
      request<{ success: boolean; adrs: any[] }>(`/api/diagrams/${id}/adr`),

    // Collaborative Node Comments
    createComment: (id: string, data: { content: string; nodeId?: string; position3D?: any; mentions?: string[] }) =>
      request<{ success: boolean; comment: any }>(`/api/diagrams/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    listComments: (id: string) =>
      request<{ comments: any[] }>(`/api/diagrams/${id}/comments`),
  },

  // Tier 1.3: Plans & Stripe Billing
  billing: {
    createCheckout: (options?: { priceId?: string; billingCycle?: 'monthly' | 'yearly'; plan?: string }) =>
      request<{ url: string; sessionId?: string }>('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify(options || {}),
      }),
    sync: (sessionId?: string) =>
      request<{ success: boolean; plan: string; message: string }>('/api/billing/sync', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }),
    openPortal: () =>
      request<{ url: string }>('/api/billing/portal', {
        method: 'POST',
      }),
  },

  // Tier 1.4 & Tier 2.7 & Tier 3.14: AI Gateway & Copilot & ADRs
  ai: {
    analyzeImage: (imageBase64: string, mimeType?: string, fileName?: string, userApiKey?: string) =>
      request<{ success: boolean; data: any; engine: string; source?: string }>('/api/ai/vision', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, mimeType, fileName, userApiKey }),
      }),

    chat: (diagramId: string, message: string, history?: { role: 'user' | 'model'; content: string }[], diagramData?: any) =>
      request<{ reply: string }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ diagramId, message, history, diagramData }),
      }),

    // AI Copilot Graph Mutation
    copilotMutate: (diagramId: string, prompt: string, autoApply: boolean = false, diagramData?: any) =>
      request<{ success: boolean; explanation: string; actions: any; updatedData: any; applied: boolean }>('/api/ai/copilot', {
        method: 'POST',
        body: JSON.stringify({ diagramId, prompt, autoApply, diagramData }),
      }),

    // Auto-generate Architecture Decision Records (ADR)
    generateAdr: (diagramId: string, decisionTitle: string, userRationale?: string) =>
      request<{ success: boolean; adr: any; markdown: string }>('/api/ai/adr', {
        method: 'POST',
        body: JSON.stringify({ diagramId, decisionTitle, userRationale }),
      }),
  },

  // Tier 2.5: Real-time 3D Multiplayer, Comments & Presenter Mode
  collaborate: {
    sendHeartbeat: (
      diagramId: string,
      cursor?: { x: number; y: number; z: number },
      color?: string,
      diagramMutation?: any,
      currentDiagramName?: string,
      activeNodeId?: string
    ) =>
      request<{
        success: boolean;
        participants: any[];
        liveDiagramMutation?: any;
        canonicalDiagramId?: string;
      }>(`/api/collaborate/${diagramId}`, {
        method: 'POST',
        body: JSON.stringify({ cursor, color, diagramMutation, currentDiagramName, activeNodeId }),
      }),

    getParticipants: (diagramId: string) =>
      request<{
        participants: any[];
        liveDiagramMutation?: any;
        canonicalDiagramId?: string;
      }>(`/api/collaborate/${diagramId}`),

    leaveRoom: (diagramId: string) =>
      request<{ success: boolean }>(`/api/collaborate/${diagramId}`, {
        method: 'DELETE',
      }),

    // Presenter Mode Camera Sync
    broadcastCamera: (diagramId: string, position: number[], target: number[], fov?: number) =>
      request<{ success: boolean }>(`/api/collaborate/${diagramId}/presenter`, {
        method: 'POST',
        body: JSON.stringify({ position, target, fov }),
      }),

    getPresenterCamera: (diagramId: string) =>
      request<{ active: boolean; presenter?: any }>(`/api/collaborate/${diagramId}/presenter`),

    stopPresenterMode: (diagramId: string) =>
      request<{ success: boolean }>(`/api/collaborate/${diagramId}/presenter`, {
        method: 'DELETE',
      }),

    getWorkspacePresenter: () =>
      request<{ active: boolean; presenter?: any }>(`/api/collaborate/workspace/presenter`),
  },

  // Tier 2.5: Anchored 3D Comments
  comments: {
    list: (diagramId: string) =>
      request<{ comments: any[] }>(`/api/diagrams/${diagramId}/comments`),

    create: (diagramId: string, data: { nodeId?: string; position3D?: { x: number; y: number; z: number }; content: string; mentions?: string[] }) =>
      request<{ success: boolean; comment: any }>(`/api/diagrams/${diagramId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    patch: (diagramId: string, commentId: string, data: { resolved?: boolean; content?: string }) =>
      request<{ success: boolean; comment: any }>(`/api/diagrams/${diagramId}/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (diagramId: string, commentId: string) =>
      request<{ success: boolean }>(`/api/diagrams/${diagramId}/comments/${commentId}`, {
        method: 'DELETE',
      }),
  },

  // Tier 2.8: Templates & Marketplace
  templates: {
    list: (params?: { category?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.search) query.set('search', params.search);
      return request<{ templates: any[] }>(`/api/templates?${query.toString()}`);
    },

    publish: (data: { name: string; description?: string; category?: string; data: any; thumbnailUrl?: string; isPublic?: boolean }) =>
      request<{ success: boolean; template: any }>('/api/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    instantiate: (templateId: string, name?: string) =>
      request<{ success: boolean; diagram: any }>(`/api/templates/${templateId}/instantiate`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),

    clone: (templateId: string, name?: string) =>
      request<{ success: boolean; diagram: any }>(`/api/templates/${templateId}/clone`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
  },

  // Tier 2.9: Live Telemetry & Monitoring
  telemetry: {
    getSources: () =>
      request<{ sources: any[] }>('/api/telemetry/sources'),

    listSources: () =>
      request<{ sources: any[] }>('/api/telemetry/sources'),

    createSource: (name: string) =>
      request<{ success: boolean; source: any }>('/api/telemetry/sources', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),

    deleteSource: (id: string) =>
      request<{ success: boolean }>(`/api/telemetry/sources?id=${id}`, {
        method: 'DELETE',
      }),

    getLiveMetrics: (diagramId: string) =>
      request<{ metrics: any[] }>(`/api/telemetry/${diagramId}`),
  },
};
