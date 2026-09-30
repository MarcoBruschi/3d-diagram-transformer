import Stripe from 'stripe';
import { prisma } from './db';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_for_dev_mode';

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia' as any,
  typescript: true,
});

export const PLAN_LIMITS = {
  free: {
    maxDiagrams: 3,
    canCollaborate: false,
    canExport3D: false,
    canExportDrawio: false,
    canExportPDF: false,
    canUseVersionsDiff: false,
    canUseCopilot: false,
    canUseTelemetry: false,
    canUseSSO: false,
    aiRateLimitPerMin: 10,
    generalRateLimitPerMin: 60,
    telemetryRateLimitPerMin: 60,
  },
  pro: {
    maxDiagrams: 50,
    canCollaborate: true,
    canExport3D: true,
    canExportDrawio: true,
    canExportPDF: true,
    canUseVersionsDiff: true,
    canUseCopilot: true,
    canUseTelemetry: true,
    canUseSSO: false,
    aiRateLimitPerMin: 60,
    generalRateLimitPerMin: 300,
    telemetryRateLimitPerMin: 300,
  },
  enterprise: {
    maxDiagrams: 500,
    canCollaborate: true,
    canExport3D: true,
    canExportDrawio: true,
    canExportPDF: true,
    canUseVersionsDiff: true,
    canUseCopilot: true,
    canUseTelemetry: true,
    canUseSSO: true,
    aiRateLimitPerMin: 200,
    generalRateLimitPerMin: 1000,
    telemetryRateLimitPerMin: 1200,
  },
} as const;

export type PlanFeature = keyof typeof PLAN_LIMITS['free'];

/**
 * Returns the subscription plan of an organization ('free' | 'pro' | 'enterprise')
 */
export async function getOrgPlan(orgId: string): Promise<keyof typeof PLAN_LIMITS> {
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(orgId);
  const org = isUuid
    ? await prisma.organization.findUnique({
        where: { id: orgId },
        select: { plan: true },
      })
    : await prisma.organization.findFirst({
        where: { slug: orgId },
        select: { plan: true },
      });

  const plan = (org?.plan || 'free') as keyof typeof PLAN_LIMITS;
  return PLAN_LIMITS[plan] ? plan : 'free';
}

/**
 * Checks if an organization plan allows a specific feature
 */
export async function checkPlanFeature(
  orgId: string,
  feature: PlanFeature
): Promise<{ allowed: boolean; plan: keyof typeof PLAN_LIMITS }> {
  const plan = await getOrgPlan(orgId);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  return {
    allowed: Boolean(limits[feature]),
    plan,
  };
}

/**
 * Checks if an organization is allowed to create a new diagram based on subscription plan
 */
export async function checkDiagramQuota(orgId: string): Promise<{ allowed: boolean; currentCount: number; maxAllowed: number; plan: string }> {
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(orgId);
  const org = isUuid
    ? await prisma.organization.findUnique({
        where: { id: orgId },
        select: { plan: true },
      })
    : await prisma.organization.findFirst({
        where: { slug: orgId },
        select: { plan: true },
      });

  const plan = (org?.plan || 'free') as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const currentCount = isUuid
    ? await prisma.diagram.count({
        where: { organizationId: orgId },
      })
    : 0;

  const allowed = currentCount < limits.maxDiagrams;

  return {
    allowed,
    currentCount,
    maxAllowed: limits.maxDiagrams,
    plan,
  };
}
