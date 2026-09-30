import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  category: z.string().default('general'),
  data: z.object({
    nodes: z.array(z.any()),
    connections: z.array(z.any()),
  }),
  thumbnailUrl: z.string().url().optional(),
  isPublic: z.boolean().default(true),
});

import { PRESET_DIAGRAMS } from '@/data/presets';

// GET /api/templates - Browse templates gallery with auto-seed
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();

    // Check if templates need to be seeded into database
    let count = 0;
    try {
      count = await prisma.diagramTemplate.count();
      if (count === 0) {
        // Auto-seed database from PRESET_DIAGRAMS
        for (const preset of PRESET_DIAGRAMS) {
          await prisma.diagramTemplate.create({
            data: {
              name: preset.name,
              description: preset.description,
              category: preset.type || 'cloud',
              data: preset as any,
              isPublic: true,
              downloadsCount: 0,
            },
          });
        }
      }
    } catch {
      // Prisma offline or table empty, will use fallback
    }

    const whereClause: any = {
      OR: [
        { isPublic: true },
        ...(authUser ? [{ organizationId: authUser.organizationId }] : []),
      ],
    };

    if (category && category !== 'all') {
      whereClause.category = category;
    }

    if (search) {
      whereClause.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    let templates: any[] = [];
    try {
      templates = await prisma.diagramTemplate.findMany({
        where: whereClause,
        orderBy: { downloadsCount: 'desc' },
      });
    } catch {
      // Fallback
      templates = PRESET_DIAGRAMS.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.type || 'cloud',
        data: p,
        downloadsCount: 120,
        createdAt: new Date().toISOString(),
        isPublic: true,
      }));
    }

    if (templates.length === 0) {
      templates = PRESET_DIAGRAMS.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.type || 'cloud',
        data: p,
        downloadsCount: 0,
        createdAt: new Date().toISOString(),
        isPublic: true,
      }));
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[Templates GET Error]:', error);
    return NextResponse.json({
      templates: PRESET_DIAGRAMS.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.type || 'cloud',
        data: p,
        downloadsCount: 0,
        isPublic: true,
      })),
    });
  }
}

// POST /api/templates - Publish a new template
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = CreateTemplateSchema.parse(body);

    const template = await prisma.diagramTemplate.create({
      data: {
        name: validated.name,
        description: validated.description,
        category: validated.category,
        data: validated.data as any,
        thumbnailUrl: validated.thumbnailUrl,
        isPublic: validated.isPublic,
        organizationId: authUser.organizationId,
        createdBy: authUser.userId,
      },
    });

    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid template data' }, { status: 400 });
    }
    console.error('[Templates POST Error]:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
