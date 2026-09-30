import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/db';
import { getAuthUser } from '@/lib/server/auth';
import { checkPlanFeature } from '@/lib/server/stripe';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format')?.toLowerCase() || 'json';

    const authUser = await getAuthUser(req);

    const diagram = await prisma.diagram.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    const hasAccess = authUser && authUser.organizationId === diagram.organizationId;
    if (!hasAccess && !diagram.isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // STRICT PLAN PERMISSION CHECK
    // Free: JSON, Mermaid only
    // Pro / Enterprise: .drawio, .glTF 3D, PDF, etc.
    const isAdvancedFormat = ['drawio', 'gltf', 'glb', 'pdf'].includes(format);
    if (isAdvancedFormat) {
      if (!authUser) {
        return NextResponse.json(
          { error: 'Autenticação necessária para exportação em formatos avançados', code: 'AUTH_REQUIRED' },
          { status: 401 }
        );
      }

      let featureToCheck: 'canExport3D' | 'canExportDrawio' | 'canExportPDF' = 'canExportDrawio';
      if (format === 'pdf') {
        featureToCheck = 'canExportPDF';
      } else if (['gltf', 'glb'].includes(format)) {
        featureToCheck = 'canExport3D';
      } else if (format === 'drawio') {
        featureToCheck = 'canExportDrawio';
      }

      const check = await checkPlanFeature(authUser.organizationId, featureToCheck);
      if (!check.allowed) {
        return NextResponse.json(
          {
            error: `A exportação em formato ${format.toUpperCase()} é exclusiva dos planos Pro e Enterprise. O plano Free permite apenas JSON e Mermaid.`,
            code: 'FEATURE_GATED_PLAN',
            currentPlan: check.plan,
            requiredPlan: 'pro',
          },
          { status: 403 }
        );
      }
    }

    const graph = diagram.data as any;
    const nodes: any[] = Array.isArray(graph?.nodes) ? graph.nodes : [];
    const connections: any[] = Array.isArray(graph?.connections) ? graph.connections : [];

    switch (format) {
      case 'mermaid': {
        let mermaidCode = 'graph TD\n';
        for (const node of nodes) {
          const cleanId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
          const cleanName = (node.name || node.id).replace(/"/g, "'");
          mermaidCode += `  ${cleanId}["${cleanName} (${node.type || 'service'})"]\n`;
        }
        for (const conn of connections) {
          const source = (conn.source || '').replace(/[^a-zA-Z0-9_]/g, '_');
          const target = (conn.target || '').replace(/[^a-zA-Z0-9_]/g, '_');
          const label = conn.label ? `|"${conn.label}"|` : '';
          mermaidCode += `  ${source} -->${label} ${target}\n`;
        }

        return new NextResponse(mermaidCode, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${diagram.name.toLowerCase().replace(/\s+/g, '_')}.mermaid"`,
          },
        });
      }

      case 'drawio': {
        const safeDiagramName = escapeXml(diagram.name);
        const safeDiagramId = escapeXml(diagram.id);
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="3D Diagram Transformer" version="21.0.0">
  <diagram name="${safeDiagramName}" id="${safeDiagramId}">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="850">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
`;
        nodes.forEach((n, idx) => {
          const x = 100 + (idx % 4) * 220;
          const y = 100 + Math.floor(idx / 4) * 140;
          const safeId = escapeXml(String(n.id ?? ''));
          const safeName = escapeXml(String(n.name || n.id || ''));
          const safeType = escapeXml(String(n.type || 'service'));
          xml += `        <mxCell id="${safeId}" value="${safeName}&#xa;(${safeType})" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#2563eb;fontColor=#ffffff;strokeColor=#1d4ed8;" vertex="1" parent="1">
          <mxGeometry x="${x}" y="${y}" width="160" height="70" as="geometry"/>
        </mxCell>\n`;
        });

        connections.forEach((c) => {
          const safeId = escapeXml(String(c.id ?? ''));
          const safeLabel = escapeXml(String(c.label || ''));
          const safeSource = escapeXml(String(c.source ?? ''));
          const safeTarget = escapeXml(String(c.target ?? ''));
          xml += `        <mxCell id="${safeId}" value="${safeLabel}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="${safeSource}" target="${safeTarget}">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>\n`;
        });

        xml += `      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

        return new NextResponse(xml, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="${diagram.name.toLowerCase().replace(/\s+/g, '_')}.drawio"`,
          },
        });
      }

      case 'markdown': {
        let md = `# Architecture Report: ${diagram.name}\n\n`;
        md += `* **Workspace:** ${diagram.organization?.name || 'Default'}\n`;
        md += `* **Generated:** ${new Date().toLocaleDateString()}\n`;
        md += `* **Total Components:** ${nodes.length}\n`;
        md += `* **Total Connections:** ${connections.length}\n\n`;
        md += `## Overview\n${diagram.description || 'No description provided.'}\n\n`;

        md += `## Component Catalog\n\n`;
        md += `| Name | Type | Importance | Description |\n`;
        md += `| :--- | :--- | :--- | :--- |\n`;
        for (const n of nodes) {
          md += `| **${n.name}** | \`${n.type}\` | ${n.importance || 3}/5 | ${n.description || '-'} |\n`;
        }

        md += `\n## Data Flow & Relationships\n\n`;
        md += `| Source | Target | Relationship | Protocol |\n`;
        md += `| :--- | :--- | :--- | :--- |\n`;
        for (const c of connections) {
          const s = nodes.find((n) => n.id === c.source)?.name || c.source;
          const t = nodes.find((n) => n.id === c.target)?.name || c.target;
          md += `| ${s} | ${t} | ${c.label || 'connects to'} | ${c.protocol || '-'} |\n`;
        }

        return new NextResponse(md, {
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Disposition': `attachment; filename="${diagram.name.toLowerCase().replace(/\s+/g, '_')}_report.md"`,
          },
        });
      }

      case 'gltf':
      case 'glb': {
        const gltfNodes = nodes.map((node, index) => {
          const pos = node.position3D || {
            x: (index % 5) * 3 - 6,
            y: Math.floor(index / 5) * 2,
            z: 0,
          };
          return {
            name: String(node.name || node.id),
            translation: [
              Number(pos.x) || 0,
              Number(pos.y) || 0,
              Number(pos.z) || 0,
            ],
            extras: {
              id: node.id,
              type: node.type || 'service',
              description: node.description || '',
              importance: node.importance || 3,
              status: node.status || 'healthy',
            },
          };
        });

        const gltfData = {
          asset: {
            version: '2.0',
            generator: '3D Diagram Transformer - glTF 2.0 Exporter',
          },
          scene: 0,
          scenes: [
            {
              name: diagram.name,
              nodes: gltfNodes.map((_, i) => i),
            },
          ],
          nodes: gltfNodes,
          materials: [
            {
              name: 'NodeMaterialDefault',
              pbrMetallicRoughness: {
                baseColorFactor: [0.22, 0.74, 0.97, 1.0],
                metallicFactor: 0.3,
                roughnessFactor: 0.4,
              },
            },
          ],
          extras: {
            diagramId: diagram.id,
            diagramName: diagram.name,
            totalNodes: nodes.length,
            totalConnections: connections.length,
            connections: connections.map((c) => ({
              source: c.source,
              target: c.target,
              label: c.label || '',
              protocol: c.protocol || '',
              type: c.type || 'default',
            })),
          },
        };

        const cleanFilename = diagram.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
        return new NextResponse(JSON.stringify(gltfData, null, 2), {
          headers: {
            'Content-Type': 'model/gltf+json',
            'Content-Disposition': `attachment; filename="${cleanFilename}.gltf"`,
          },
        });
      }

      case 'pdf': {
        return NextResponse.json(
          {
            error: 'A renderização nativa de PDF no servidor requer módulo headless. Utilize a opção de impressão/exportação de relatório PDF do navegador no Studio (Ctrl+P / Cmd+P) ou exporte o relatório em formato Markdown.',
            code: 'PDF_PRINT_RECOMMENDED',
            suggestedAction: 'CLIENT_PRINT',
          },
          { status: 501 }
        );
      }

      case 'json': {
        return NextResponse.json({
          meta: {
            id: diagram.id,
            name: diagram.name,
            description: diagram.description,
            type: diagram.type,
            exportedAt: new Date().toISOString(),
          },
          graph: diagram.data,
        });
      }

      default: {
        return NextResponse.json(
          { error: `Formato de exportação '${format}' não suportado. Formatos suportados: json, mermaid, drawio, markdown, gltf, glb, pdf.` },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('[Export Error]:', error);
    return NextResponse.json({ error: 'Failed to export diagram' }, { status: 500 });
  }
}
