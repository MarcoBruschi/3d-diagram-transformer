import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';

const AdrCreateSchema = z.object({
  decisionTitle: z.string().min(3).max(255),
  userRationale: z.string().optional(),
  status: z.enum(['proposed', 'accepted', 'deprecated', 'superseded']).default('accepted'),
  diagramData: z.any().optional(),
  diagramName: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/diagrams/:id/adr - List ADRs for diagram
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);

    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const diagram = await prisma.diagram.findUnique({
      where: { id },
    });

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    // Access control: must belong to user's org or be public
    let userOrgId = authUser?.organizationId;
    if (authUser && userOrgId && !UUID_REGEX.test(userOrgId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { organizationId: true },
      });
      if (dbUser?.organizationId) userOrgId = dbUser.organizationId;
    }

    const hasAccess = (authUser && userOrgId === diagram.organizationId) || diagram.isPublic;
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: authUser ? 403 : 401 });
    }

    const adrs = await prisma.diagramAdr.findMany({
      where: { diagramId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, adrs });
  } catch (error: any) {
    console.error('[ADR GET Route Error]:', error);
    return NextResponse.json({ error: 'Failed to fetch ADRs' }, { status: 500 });
  }
}

// POST /api/diagrams/:id/adr - Generate & persist Architecture Decision Record
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { decisionTitle, userRationale, status, diagramData, diagramName } = AdrCreateSchema.parse(body);

    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let diagram = null;

    if (UUID_REGEX.test(id)) {
      diagram = await prisma.diagram.findUnique({
        where: { id },
      });
    }

    if (!diagram && diagramData) {
      diagram = await prisma.diagram.create({
        data: {
          organizationId: authUser.organizationId,
          name: diagramName || diagramData.name || 'Arquitetura do Sistema',
          description: diagramData.description || 'Criado via AI Copilot / ADR',
          type: diagramData.type || 'c4',
          data: diagramData,
          createdBy: authUser.userId,
        },
      });
    }

    if (!diagram || diagram.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    let context = 'System architecture requires explicit decision records for maintainability and team alignment.';
    let decision = `Adopt "${decisionTitle}" to optimize scalability, resilience, and operational simplicity.`;
    let consequences = 'Pros: Improved architectural clarity and performance. Cons: Initial implementation and migration effort.';

    if (apiKey) {
      const prompt = `You are a Principal Software Architect drafting an Architecture Decision Record (ADR) in the Michael Nygard format.
System: "${diagram.name}" (${diagram.description || 'Enterprise Cloud Application'})
Current Architecture Graph:
${JSON.stringify(diagram.data)}

Architectural Decision Topic: "${decisionTitle}"
Additional Team Notes: "${userRationale || 'Adopt standard cloud-native best practices'}"

Analyze the graph components, protocols, and bottlenecks. Return ONLY a valid JSON object matching:
{
  "context": "Clear, deep technical context explaining the problem or driving architectural forces",
  "decision": "The precise architectural decision, technologies chosen, and topology changes",
  "consequences": "Comprehensive breakdown of positive trade-offs (pros), negative trade-offs (cons), and operational risks"
}`;

      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: 'application/json' },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
          if (parsed.context) context = parsed.context;
          if (parsed.decision) decision = parsed.decision;
          if (parsed.consequences) consequences = parsed.consequences;
        }
      } catch (err) {
        console.warn('[ADR Generation] Fallback to default template:', err);
      }
    }

    // Persist in DiagramAdr table
    const adr = await prisma.diagramAdr.create({
      data: {
        diagramId: diagram.id,
        title: decisionTitle,
        status,
        context,
        decision,
        consequences,
        createdBy: authUser.userId,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Generate Notion/Confluence compatible Markdown
    const markdown = `# ADR: ${adr.title}

* **Status:** \`${adr.status.toUpperCase()}\`
* **Date:** ${new Date(adr.createdAt).toLocaleDateString('pt-BR')}
* **Author:** ${adr.creator?.name || authUser.email}
* **Diagram Ref:** [${diagram.name}](/studio?id=${diagram.id})

---

## 1. Contexto & Desafio de Arquitetura
${adr.context}

## 2. Decisão Técnica Adotada
${adr.decision}

## 3. Consequências & Riscos Operacionais
${adr.consequences}

---
*Gerado automaticamente pelo 3D Diagram Transformer AI Copilot.*
`;

    return NextResponse.json({
      success: true,
      adr,
      markdown,
      diagramId: diagram.id,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid ADR request' }, { status: 400 });
    }
    console.error('[ADR Route Error]:', error);
    return NextResponse.json({ error: 'Failed to generate ADR' }, { status: 500 });
  }
}
