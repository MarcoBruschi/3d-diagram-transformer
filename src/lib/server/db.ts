import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple Prisma instances in development (Hot Module Replacement)
  var prismaGlobal: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });
};

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Always persist to globalThis to reuse connection pools across warm serverless lambdas on Vercel
globalThis.prismaGlobal = prisma;

/**
 * Executes a callback within a scoped tenant transaction
 * setting `app.current_org_id` for PostgreSQL Row-Level Security (RLS).
 */
export async function withTenantContext<T>(
  orgId: string,
  fn: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Set tenant session context for RLS
    await tx.$executeRawUnsafe(`SELECT set_tenant_context($1::uuid)`, orgId);
    return await fn(tx as unknown as PrismaClient);
  });
}
