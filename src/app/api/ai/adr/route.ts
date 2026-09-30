import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { checkPlanRateLimit } from '@/lib/server/ratelimit';

const AdrSchema = z.object({
  diagramId: z.string().uuid(),
  decisionTitle: z.string().min(3).max(255),
  userRationale: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateCheck = await checkPlanRateLimit(authUser.userId, authUser.organizationId, 'ai');
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Rate limit exceeded for AI operations' }, { status: 429 });
    }

    const body = await req.json();
    const { diagramId, decisionTitle, userRationale } = AdrSchema.parse(body);

    const diagram = await prisma.diagram.findUnique({
      where: { id: diagramId },
    });

    if (!diagram || diagram.organizationId !== authUser.organizationId) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    let context = 'System architecture requires explicit decision records for maintainability.';
    let decision = `Adopt ${decisionTitle} to improve system scalability and resilience.`;
    let consequences = 'Positive: Clear architectural alignment. Negative: Migration overhead.';

    if (apiKey) {
      const prompt = `Generate a formal Architecture Decision Record (ADR) based on this system:
Diagram: "${diagram.name}" (${diagram.description})
Architecture Data: ${JSON.stringify(diagram.data)}
Decision Title: "${decisionTitle}"
Additional Context: "${userRationale || 'Standard architectural best practices'}"

Return ONLY a JSON object:
{
  "title": "${decisionTitle}",
  "status": "accepted",
  "context": "Clear technical background and motivation",
  "decision": "Detailed technical architectural choice and implementation approach",
  "consequences": "Benefits, trade-offs, and downstream impacts"
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
        console.warn('[ADR Generation] Fallback to standard ADR format:', err);
      }
    }

    const adr = await prisma.diagramAdr.create({
      data: {
        diagramId,
        title: decisionTitle,
        status: 'accepted',
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

    const markdownDoc = `# ADR: ${adr.title}

* **Status:** ${adr.status.toUpperCase()}
* **Date:** ${new Date(adr.createdAt).toLocaleDateString()}
* **Author:** ${adr.creator?.name || authUser.email}
* **Diagram:** ${diagram.name}

## Context
${adr.context}

## Decision
${adr.decision}

## Consequences
${adr.consequences}
`;

    return NextResponse.json({
      success: true,
      adr,
      markdown: markdownDoc,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid ADR request' }, { status: 400 });
    }
    console.error('[ADR Generation Error]:', error);
    return NextResponse.json({ error: 'Failed to generate ADR' }, { status: 500 });
  }
}
