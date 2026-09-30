import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { checkPlanRateLimit } from '@/lib/server/ratelimit';
import { checkPlanFeature } from '@/lib/server/stripe';
import { checkAiSpendingCap, recordAiSpending } from '@/lib/server/spendingCap';
import { geminiCircuitBreaker } from '@/lib/server/circuitBreaker';

import { PRESET_DIAGRAMS } from '@/data/presets';

const CopilotRequestSchema = z.object({
  diagramId: z.string().min(1),
  prompt: z.string().min(3).max(2000),
  autoApply: z.boolean().default(false), // If true, saves updated graph into database as a new version
  diagramData: z.any().optional(),
});

// Zod Schema to validate AI Function Calling Mutation
const MutationResultSchema = z.object({
  action: z.enum([
    'ADD_NODE_AND_CONNECT',
    'ADD_NODE',
    'REMOVE_NODE',
    'UPDATE_NODE',
    'CONNECT_NODES',
    'GENERAL_MUTATION',
  ]),
  explanation: z.string(),
  newNode: z
    .object({
      id: z.string().optional(),
      name: z.string(),
      type: z.string().default('service'),
      importance: z.number().int().min(1).max(5).default(3),
      description: z.string().optional(),
      position3D: z
        .object({
          x: z.number(),
          y: z.number(),
          z: z.number(),
        })
        .optional(),
    })
    .optional()
    .nullable(),
  connections: z
    .array(
      z.object({
        id: z.string().optional(),
        source: z.string(),
        target: z.string(),
        type: z.string().default('sync'),
        label: z.string().optional(),
        protocol: z.string().optional().nullable(),
      })
    )
    .default([]),
  nodesToRemove: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // STRICT PLAN PERMISSION CHECK: AI Copilot is exclusive to Pro and Enterprise
    const check = await checkPlanFeature(authUser.organizationId, 'canUseCopilot');
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: 'AI Copilot para otimização de arquitetura é exclusivo dos planos Pro e Enterprise.',
          code: 'FEATURE_GATED_PLAN',
          currentPlan: check.plan,
          requiredPlan: 'pro',
        },
        { status: 403 }
      );
    }

    const rateCheck = await checkPlanRateLimit(authUser.userId, authUser.organizationId, 'ai');
    if (!rateCheck.success) {
      return NextResponse.json({ error: 'Rate limit exceeded for AI copilot operations' }, { status: 429 });
    }

    const body = await req.json();
    const { diagramId, prompt, autoApply, diagramData } = CopilotRequestSchema.parse(body);

    const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let userOrgId = authUser.organizationId;
    if (!UUID_REGEX.test(userOrgId)) {
      const dbUser = await prisma.user.findFirst({
        where: UUID_REGEX.test(authUser.userId) ? { id: authUser.userId } : { email: authUser.email },
        select: { organizationId: true },
      });
      if (dbUser?.organizationId) userOrgId = dbUser.organizationId;
    }

    // AI Spending Cap & Budget Check
    const spendingStatus = await checkAiSpendingCap(userOrgId, 2);
    if (!spendingStatus.allowed) {
      return NextResponse.json(
        {
          error: spendingStatus.message || 'Cota de gastos de IA atingida para o ciclo mensal.',
          code: 'AI_SPENDING_CAP_REACHED',
          currentSpentCents: spendingStatus.currentSpentCents,
          capCents: spendingStatus.capCents,
        },
        { status: 402 }
      );
    }

    let diagram: any = null;
    const isUuid = UUID_REGEX.test(diagramId);
    if (isUuid) {
      try {
        diagram = await prisma.diagram.findUnique({
          where: { id: diagramId },
        });
      } catch {}
    }

    let currentNodes: any[] = [];
    let currentConnections: any[] = [];
    let diagramName = 'Arquitetura';

    if (diagram) {
      if (userOrgId !== diagram.organizationId && !diagram.isPublic) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // STRICT CROSS-TENANT DEFENSE: Mutations (autoApply) strictly require ownership of the diagram
      if (autoApply) {
        if (authUser.organizationId !== diagram.organizationId) {
          return NextResponse.json(
            { error: 'Apenas membros da organização proprietária podem aplicar alterações no diagrama.' },
            { status: 403 }
          );
        }
      }

      if (autoApply && authUser.role === 'viewer') {
        return NextResponse.json({ error: 'Viewers cannot apply mutations to diagrams' }, { status: 403 });
      }

      diagramName = diagram.name;
      const currentGraph = (diagram.data as any) || { nodes: [], connections: [] };
      currentNodes = Array.isArray(currentGraph.nodes) ? currentGraph.nodes : [];
      currentConnections = Array.isArray(currentGraph.connections) ? currentGraph.connections : [];
    } else if (diagramData) {
      diagramName = diagramData.name || 'Arquitetura';
      currentNodes = Array.isArray(diagramData.nodes) ? diagramData.nodes : [];
      currentConnections = Array.isArray(diagramData.connections) ? diagramData.connections : [];
    } else {
      const preset = PRESET_DIAGRAMS.find((p) => p.id === diagramId);
      if (preset) {
        diagramName = preset.name;
        currentNodes = preset.nodes;
        currentConnections = preset.connections;
      } else {
        return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Chave GEMINI_API_KEY não configurada no servidor. Configure a variável no arquivo .env para executar mutações arquiteturais autônomas.',
      }, { status: 400 });
    }

    const systemPrompt = `You are an Autonomous Software Architecture Copilot with Function Calling capability.
You receive a 3D diagram graph and a user prompt requesting an architectural modification (e.g., "Adicione um cache Redis entre o gateway e o serviço de usuários", "Remova o ponto único de falha", "Conecte o banco de dados réplica").

Current Diagram Architecture:
${JSON.stringify({ nodes: currentNodes, connections: currentConnections }, null, 2)}

User Instruction: "${prompt}"

Your mission:
Analyze the nodes, topology, protocols, and intent. Generate the exact functional mutation.
Return ONLY a valid JSON object matching this schema:
{
  "action": "ADD_NODE_AND_CONNECT" | "ADD_NODE" | "REMOVE_NODE" | "UPDATE_NODE" | "CONNECT_NODES" | "GENERAL_MUTATION",
  "explanation": "Concise architectural rationale in Portuguese explaining what was changed and why",
  "newNode": {
    "name": "Component Name",
    "type": "cache" | "database" | "microservice" | "queue" | "load-balancer" | "server" | "gateway" | "security-module" | "cloud",
    "importance": 1 to 5 (5=client, 4=perimeter, 3=logic, 2=queue/cache, 1=storage),
    "description": "Short role summary",
    "position3D": { "x": number, "y": number, "z": number }
  },
  "connections": [
    {
      "source": "source_node_id",
      "target": "target_node_id",
      "type": "sync" | "async" | "cache" | "replica",
      "label": "«cache»" | "«query»" | "«forward»",
      "protocol": "TCP" | "HTTPS" | "gRPC" | "RESP"
    }
  ],
  "nodesToRemove": ["node_id_to_remove_if_any"]
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let data: any;
    try {
      data = await geminiCircuitBreaker.execute(async (signal) => {
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              temperature: 0.1,
              response_mime_type: 'application/json',
            },
          }),
          signal,
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(`Gemini API error (${response.status}): ${err}`);
        }

        return await response.json();
      });

      // Record successful AI consumption
      await recordAiSpending(userOrgId, 2);
    } catch (apiError: any) {
      console.error('[Gemini API Call Failed]:', apiError?.message || apiError);
      return NextResponse.json(
        { error: apiError?.message || 'Falha na comunicação com o serviço de IA' },
        { status: 502 }
      );
    }

    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const rawParsed = JSON.parse(candidateText);

    // Validate AI output with Zod
    const validatedMutation = MutationResultSchema.parse(rawParsed);

    // Apply mutation deterministically to graph
    let updatedNodes = [...currentNodes];
    let updatedConnections = [...currentConnections];

    // 1. Remove nodes if requested
    if (validatedMutation.nodesToRemove.length > 0) {
      const removeSet = new Set(validatedMutation.nodesToRemove);
      updatedNodes = updatedNodes.filter((n) => !removeSet.has(n.id));
      updatedConnections = updatedConnections.filter(
        (c) => !removeSet.has(c.source) && !removeSet.has(c.target)
      );
    }

    // 2. Add new node if present
    let finalNewNode: any = null;
    if (validatedMutation.newNode) {
      const generatedId =
        validatedMutation.newNode.id ||
        `node-${validatedMutation.newNode.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;

      finalNewNode = {
        ...validatedMutation.newNode,
        id: generatedId,
        position3D: validatedMutation.newNode.position3D || { x: 0, y: 0, z: 0 },
      };

      updatedNodes.push(finalNewNode);
    }

    // 3. Add connections
    if (validatedMutation.connections.length > 0) {
      for (const conn of validatedMutation.connections) {
        // Resolve newly generated node id if connection refers to it
        let sourceId = conn.source;
        let targetId = conn.target;

        if (finalNewNode) {
          if (sourceId === 'new-node' || sourceId === 'newNode' || sourceId === finalNewNode.name) {
            sourceId = finalNewNode.id;
          }
          if (targetId === 'new-node' || targetId === 'newNode' || targetId === finalNewNode.name) {
            targetId = finalNewNode.id;
          }
        }

        const newConnId = conn.id || `conn-${Math.random().toString(36).substring(2, 9)}`;
        updatedConnections.push({
          id: newConnId,
          source: sourceId,
          target: targetId,
          type: conn.type,
          label: conn.label || '',
          protocol: conn.protocol || null,
        });
      }
    }

    const updatedData = {
      nodes: updatedNodes,
      connections: updatedConnections,
    };

    // If autoApply requested and user has editor permissions, persist new version
    let newVersion = 0;
    if (autoApply && diagram && authUser && authUser.role !== 'viewer' && diagram.organizationId === userOrgId) {
      const latestVersion = await prisma.diagramVersion.findFirst({
        where: { diagramId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      newVersion = (latestVersion?.version || 0) + 1;

      await prisma.$transaction([
        prisma.diagram.update({
          where: { id: diagramId },
          data: {
            data: updatedData as any,
            nodeCount: updatedNodes.length,
          },
        }),
        prisma.diagramVersion.create({
          data: {
            diagramId,
            version: newVersion,
            data: updatedData as any,
            createdBy: authUser.userId,
          },
        }),
        prisma.auditLog.create({
          data: {
            userId: authUser.userId,
            orgId: userOrgId,
            action: 'ai.copilot_mutate',
            resourceId: diagramId,
            metadata: {
              prompt,
              action: validatedMutation.action,
              version: newVersion,
            },
          },
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      action: validatedMutation.action,
      explanation: validatedMutation.explanation,
      newNode: finalNewNode,
      connections: validatedMutation.connections,
      updatedData,
      applied: autoApply && newVersion > 0,
      version: newVersion > 0 ? newVersion : undefined,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: (error as any).issues?.[0]?.message || 'Invalid mutation schema' },
        { status: 400 }
      );
    }
    console.error('[AI Copilot Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
