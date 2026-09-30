'use client';

import { useAuthStore, SaaSPlan, UserRole } from '@/store/useAuthStore';

export interface FeatureGatingRules {
  plan: SaaSPlan;
  role: UserRole;
  isAuthenticated: boolean;
  isFree: boolean;
  isPro: boolean;
  isEnterprise: boolean;
  
  // Permissions by Role
  canEdit: boolean;
  canManageBilling: boolean;
  canManageTeam: boolean;
  
  // Quotas & Features by Plan (Strictly matches SaaS pricing tiers)
  maxCloudDiagrams: number;
  canExportJSON: boolean;
  canExportGLTF: boolean;
  canExportDrawio: boolean;
  canExportPDF: boolean;
  canUseMultiplayer: boolean;
  canUseVersionsDiff: boolean;
  canUseCopilot: boolean;
  canUseCopilotMutations: boolean;
  canUseTelemetry: boolean;
  canUsePresenterMode: boolean;
  canUseSSO: boolean;
  canUseWhiteLabel: boolean;
}

export function useFeatureGating(): FeatureGatingRules {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  const plan: SaaSPlan = user?.plan || 'free';
  const role: UserRole = user?.role || 'viewer';

  const isFree = plan === 'free';
  const isPro = plan === 'pro' || plan === 'enterprise';
  const isEnterprise = plan === 'enterprise';

  return {
    plan,
    role,
    isAuthenticated,
    isFree,
    isPro,
    isEnterprise,
    
    // Role-based permissions (only authenticated editors/admins can edit)
    canEdit: isAuthenticated && (role === 'admin' || role === 'editor'),
    canManageBilling: isAuthenticated && role === 'admin',
    canManageTeam: isAuthenticated && role === 'admin',
    
    // Strict Plan feature gates
    maxCloudDiagrams: isFree ? 3 : Infinity,
    canExportJSON: true,
    canExportGLTF: isPro,
    canExportDrawio: isPro,
    canExportPDF: isPro,
    canUseMultiplayer: isPro,
    canUseVersionsDiff: isPro,
    canUseCopilot: isPro,
    canUseCopilotMutations: isPro,
    canUseTelemetry: isPro,
    canUsePresenterMode: isPro,
    canUseSSO: isEnterprise,
    canUseWhiteLabel: isEnterprise,
  };
}
