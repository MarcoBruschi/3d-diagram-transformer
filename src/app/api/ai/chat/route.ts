import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { checkRateLimit, checkPlanRateLimit } from '@/lib/server/ratelimit';

import { PRESET_DIAGRAMS } from '@/data/presets';

const ChatSchema = z.object({
  diagramId: z.string().min(1),
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
  diagramData: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    const identifier = authUser?.userId || req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate limiting scaled by plan tier (fallback to 10 req/min for unauthenticated)
    const rateCheck = authUser
      ? await checkPlanRateLimit(authUser.userId, authUser.organizationId, 'ai')
      : await checkRateLimit(identifier, 'ai-chat', 10, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { diagramId, message, history, diagramData } = ChatSchema.parse(body);

    let diagram: any = null;
    try {
      diagram = await prisma.diagram.findUnique({
        where: { id: diagramId },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          data: true,
          organizationId: true,
          isPublic: true,
        },
      });
    } catch {}

    if (diagram) {
      const hasAccess = authUser && authUser.organizationId === diagram.organizationId;
      if (!hasAccess && !diagram.isPublic) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else if (diagramData) {
      diagram = {
        id: diagramId,
        name: diagramData.name || 'Arquitetura',
        description: diagramData.description || '',
        data: diagramData,
      };
    } else {
      const preset = PRESET_DIAGRAMS.find((p) => p.id === diagramId);
      if (preset) {
        diagram = {
          id: preset.id,
          name: preset.name,
          description: preset.description,
          data: preset,
        };
      } else {
        return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
      }
    }

    // Regra de Ouro: Somente GEMINI_API_KEY no server-side
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: `Assistente de Arquitetura: O diagrama "${diagram.name}" possui ${Array.isArray((diagram.data as any)?.nodes) ? (diagram.data as any).nodes.length : 0} componentes mapeados na topologia. Para ativar o chat conversacional generativo completo, configure a chave GEMINI_API_KEY no arquivo .env.`,
      });
    }

    const diagramContext = JSON.stringify(diagram.data);

    const systemPrompt = `You are an AI software architect and technical assistant discussing the 3D technical diagram named "${diagram.name}".
Diagram Description: ${diagram.description || 'N/A'}.
Diagram Architectural Graph Data:
${diagramContext}

Answer the user's questions clearly, concisely, and accurately based on the architecture, nodes, connections, and flow in the diagram. Suggest improvements, explain security implications, or describe data flows when relevant.`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: `Understood! I have analyzed the architecture of "${diagram.name}". How can I help you explore or refine it?` }],
      },
      ...(history || []).map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Gemini Chat error:', response.status, errText);
      return NextResponse.json({ error: 'Failed to contact Gemini model' }, { status: 502 });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).issues?.[0]?.message || 'Invalid chat payload' }, { status: 400 });
    }
    console.error('[AI Chat Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
