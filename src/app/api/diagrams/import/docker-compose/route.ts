import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/ratelimit';
import { parseDockerComposeToDiagram, parseDockerCompose, validateYamlSafety, sanitizeYamlText } from '@/lib/parsers/dockerComposeParser';
import { prisma } from '@/lib/server/db';
import { checkDiagramQuota } from '@/lib/server/stripe';

export const dynamic = 'force-dynamic';

const DockerComposeImportSchema = z.object({
  yamlContent: z.string().min(1, 'O conteúdo do Docker Compose não pode estar vazio'),
  diagramName: z.string().max(255).optional(),
  saveToCloud: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 1. Strict Rate Limiting (20 requests per minute)
    const rateCheck = await checkRateLimit(clientIp, 'import-docker-compose', 20, 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Muitas requisições de importação. Aguarde um momento antes de tentar novamente.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { yamlContent, diagramName, saveToCloud } = DockerComposeImportSchema.parse(body);

    // 2. Strict Payload Size Check (1MB limit)
    if (yamlContent.length > 1024 * 1024) {
      return NextResponse.json(
        { error: 'O arquivo Docker Compose excede o tamanho máximo permitido de 1MB.' },
        { status: 413 }
      );
    }

    // 3. YAML Bomb & Code Execution Guard
    try {
      validateYamlSafety(yamlContent);
    } catch (safetyErr: any) {
      return NextResponse.json(
        { error: safetyErr.message || 'Conteúdo YAML rejeitado por motivos de segurança.' },
        { status: 400 }
      );
    }

    // 4. Safe Parsing with XSS Sanitization & Spatial Layering
    let diagramData: { nodes: any[]; connections: any[] };
    const resolvedName = (diagramName ? sanitizeYamlText(diagramName) : '') || 'Docker Compose Architecture';
    try {
      diagramData = parseDockerComposeToDiagram(yamlContent);
    } catch (parseErr: any) {
      return NextResponse.json(
        { error: parseErr.message || 'Falha ao processar a estrutura do Docker Compose.' },
        { status: 400 }
      );
    }

    if (diagramData.nodes.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum serviço válido encontrado no arquivo Docker Compose. Verifique a seção services.' },
        { status: 400 }
      );
    }

    const diagram = {
      name: resolvedName,
      description: 'Arquitetura gerada a partir de arquivo Docker Compose',
      nodes: diagramData.nodes,
      connections: diagramData.connections,
    };

    // 5. Optional cloud persistence if requested & user authenticated
    const authUser = await getAuthUser(req);
    let savedDiagram = null;

    if (saveToCloud) {
      if (!authUser) {
        return NextResponse.json(
          { error: 'Autenticação necessária para salvar o diagrama importado na nuvem.' },
          { status: 401 }
        );
      }

      if (authUser.role === 'viewer') {
        return NextResponse.json(
          { error: 'Visualizadores não possuem permissão para criar ou importar novos diagramas.' },
          { status: 403 }
        );
      }

      // Check organization quota
      const quota = await checkDiagramQuota(authUser.organizationId);
      if (!quota.allowed) {
        return NextResponse.json(
          {
            error: `Limite do plano ${quota.plan.toUpperCase()} atingido (máx. ${quota.maxAllowed} diagramas). Faça upgrade para criar novos diagramas.`,
            code: 'PLAN_LIMIT_REACHED',
          },
          { status: 403 }
        );
      }

      savedDiagram = await prisma.diagram.create({
        data: {
          organizationId: authUser.organizationId,
          createdBy: authUser.userId,
          name: diagram.name,
          description: diagram.description,
          type: 'microservices',
          data: diagram,
          nodeCount: diagram.nodes.length,
          isPublic: false,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: authUser.userId,
          orgId: authUser.organizationId,
          action: 'diagram.import_docker_compose',
          resourceId: savedDiagram.id,
          metadata: {
            diagramName: diagram.name,
            nodeCount: diagram.nodes.length,
            connectionCount: diagram.connections.length,
          },
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      name: resolvedName,
      diagramData,
      diagram,
      savedDiagram,
      message: 'Docker Compose importado e analisado com sucesso.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Dados de requisição inválidos.' },
        { status: 400 }
      );
    }
    console.error('[Import Docker Compose Error]:', error);
    return NextResponse.json(
      { error: 'Falha interna ao processar o arquivo Docker Compose.' },
      { status: 500 }
    );
  }
}
