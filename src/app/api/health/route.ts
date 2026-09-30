import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { redis } from '@/lib/server/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const mem = process.memoryUsage();

  const healthData: Record<string, any> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: '2.4.0',
    memory: {
      heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
      heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
      rssMb: Math.round(mem.rss / (1024 * 1024)),
    },
    services: {
      database: { status: 'unknown', latencyMs: 0 },
      redis: { status: 'unknown', latencyMs: 0 },
    },
  };

  // 1. Database Probe (PostgreSQL via Prisma)
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthData.services.database = {
      status: 'connected',
      latencyMs: Date.now() - dbStart,
    };
  } catch (err: any) {
    healthData.services.database = {
      status: 'disconnected',
      latencyMs: Date.now() - dbStart,
      error: err.message,
    };
    healthData.status = 'degraded';
  }

  // 2. Redis Cache Probe
  const redisStart = Date.now();
  try {
    const pong = await redis.set('health:ping', String(Date.now()), 'EX', 10);
    healthData.services.redis = {
      status: pong === 'OK' ? 'connected' : 'degraded',
      latencyMs: Date.now() - redisStart,
    };
  } catch (err: any) {
    healthData.services.redis = {
      status: 'disconnected',
      latencyMs: Date.now() - redisStart,
      error: err.message,
    };
    healthData.status = 'degraded';
  }

  healthData.totalLatencyMs = Date.now() - startTime;

  const httpStatus =
    healthData.status === 'healthy'
      ? 200
      : healthData.services.database.status === 'disconnected'
      ? 503
      : 207;

  return NextResponse.json(healthData, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Health-Status': healthData.status,
    },
  });
}
