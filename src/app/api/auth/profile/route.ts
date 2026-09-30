import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser, verifyPassword, hashPassword } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';
import { sanitizeText } from '@/lib/security/sanitizer';

export const dynamic = 'force-dynamic';

const ProfileUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Nome não pode ser vazio')
      .max(100)
      .transform((val) => sanitizeText(val))
      .optional(),
    avatarUrl: z
      .string()
      .trim()
      .max(1000)
      .refine(
        (val) => {
          if (!val || val === '') return true;
          if (val.startsWith('https://') || val.startsWith('http://')) {
            try {
              const u = new URL(val);
              return u.protocol === 'https:' || u.protocol === 'http:';
            } catch {
              return false;
            }
          }
          if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(val)) {
            return true;
          }
          return false;
        },
        {
          message: 'URL de avatar inválida ou protocolo inseguro',
        }
      )
      .or(z.literal(''))
      .optional()
      .nullable(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres').optional(),
  })
  .strict();

// GET /api/auth/profile - Returns authenticated user profile data
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        organizationId: user.organizationId,
        workspace: user.organization,
      },
    });
  } catch (error) {
    console.error('[Profile GET Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve profile' }, { status: 500 });
  }
}

// PATCH /api/auth/profile - Update name, avatarUrl, and optionally password
export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = ProfileUpdateSchema.parse(body);

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let nextPasswordHash: string | undefined = undefined;

    // Handle password change if requested
    if (data.newPassword) {
      if (!data.currentPassword) {
        return NextResponse.json(
          { error: 'Para alterar a senha, forneça a senha atual.' },
          { status: 400 }
        );
      }

      if (dbUser.passwordHash) {
        const isValid = await verifyPassword(data.currentPassword, dbUser.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            { error: 'Senha atual incorreta.' },
            { status: 400 }
          );
        }
      }

      nextPasswordHash = await hashPassword(data.newPassword);
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
        ...(nextPasswordHash !== undefined && { passwordHash: nextPasswordHash }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        organizationId: updatedUser.organizationId,
        workspace: updatedUser.organization,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Entrada inválida' }, { status: 400 });
    }
    console.error('[Profile PATCH Error]:', error);
    return NextResponse.json({ error: 'Falha ao atualizar perfil' }, { status: 500 });
  }
}
