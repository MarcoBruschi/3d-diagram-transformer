import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';
import { sanitizeText } from '@/lib/security/sanitizer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
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

  return NextResponse.json({ user });
}

const FORBIDDEN_FIELDS = [
  'role',
  'organizationId',
  'organization',
  'plan',
  'emailVerified',
  'id',
  'passwordHash',
  'createdAt',
  'updatedAt',
  'provider',
  'providerId',
  'email',
];

const UpdateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nome deve ter no mínimo 2 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .refine((val) => !/<[^>]*>/i.test(val) && !/script/i.test(val), {
        message: 'Nome contém tags HTML ou scripts não permitidos',
      })
      .transform((val) => sanitizeText(val))
      .optional(),
    avatarUrl: z
      .string()
      .trim()
      .max(1000, 'URL do avatar não pode exceder 1000 caracteres')
      .refine(
        (val) => {
          if (!val || val === '') return true;
          if (val.startsWith('https://')) {
            try {
              new URL(val);
              return true;
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
          message: 'Avatar deve ser uma URL segura com https:// ou data URI de imagem seguro',
        }
      )
      .optional()
      .nullable(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Mass Assignment Protection: explicitly reject forbidden fields
    for (const field of FORBIDDEN_FIELDS) {
      if (field in body) {
        return NextResponse.json(
          { error: `Tentativa de atribuição em massa detectada: campo '${field}' não pode ser alterado.` },
          { status: 400 }
        );
      }
    }

    const data = UpdateProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
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

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Entrada inválida' }, { status: 400 });
    }
    console.error('[Auth Me Update Error]:', error);
    return NextResponse.json({ error: 'Falha ao atualizar dados de perfil' }, { status: 500 });
  }
}
