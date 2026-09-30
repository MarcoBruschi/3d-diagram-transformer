import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/server/auth';
import { redis } from '@/lib/server/redis';

// GET /api/collaborate/workspace/presenter - Check if anyone in user's organization is presenting
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !authUser.organizationId) {
      return NextResponse.json({ active: false });
    }

    const orgKey = `presenter:org:${authUser.organizationId}`;
    const raw = await redis.get(orgKey);
    if (!raw) {
      return NextResponse.json({ active: false });
    }

    const session = JSON.parse(raw);
    return NextResponse.json({
      active: true,
      presenter: session,
    });
  } catch (error) {
    return NextResponse.json({ active: false }, { status: 500 });
  }
}
