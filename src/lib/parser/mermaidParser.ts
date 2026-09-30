import { Diagram, DiagramNode, DiagramConnection, NodeType } from '@/types/diagram';
import { inferNodeType } from './textParser';

/**
 * Parses Mermaid flowcharts and PlantUML DSL strings.
 */
export function parseMermaidOrPlantUML(content: string, fileName = 'Architecture DSL'): Diagram {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const nodesMap = new Map<string, DiagramNode>();
  const connections: DiagramConnection[] = [];

  const getOrCreateNode = (id: string, label?: string, shapeHint?: string): DiagramNode => {
    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const name = label ? label.trim() : id.trim();

    if (nodesMap.has(cleanId)) {
      const existing = nodesMap.get(cleanId)!;
      if (label && existing.name === cleanId) {
        existing.name = name;
      }
      return existing;
    }

    let type: NodeType = inferNodeType(name);
    if (shapeHint === 'cylinder' || shapeHint === '[(') type = 'database';
    else if (shapeHint === 'circle' || shapeHint === '((') type = 'user';
    else if (shapeHint === 'diamond' || shapeHint === '{') type = 'load-balancer';

    const node: DiagramNode = {
      id: cleanId,
      name,
      type,
      status: 'active',
      description: `Inferred from DSL structure.`,
      position2D: { x: 400, y: 100 + nodesMap.size * 80 },
      metrics: {
        statusText: 'Active',
      },
    };

    nodesMap.set(cleanId, node);
    return node;
  };

  lines.forEach((line) => {
    // Skip headers / directives
    if (
      line.startsWith('graph') ||
      line.startsWith('flowchart') ||
      line.startsWith('subgraph') ||
      line.startsWith('end') ||
      line.startsWith('@startuml') ||
      line.startsWith('@enduml') ||
      line.startsWith('%%') ||
      line.startsWith('//')
    ) {
      return;
    }

    // 1. Mermaid Arrow matches: A --> B, A[Client] -->|http| B[(Database)]
    const arrowMatch = line.match(/^(.+?)\s*(-->|-->\|.*?\||-.->|==>|->)\s*(.+)$/);
    if (arrowMatch) {
      const sourceRaw = arrowMatch[1].trim();
      const connectorRaw = arrowMatch[2].trim();
      const targetRaw = arrowMatch[3].trim();

      // Extract node label & shape from e.g. A[Client Name] or DB[(Postgres)]
      const parseNodePart = (part: string) => {
        const bracketMatch = part.match(/^([a-zA-Z0-9_-]+)\s*(\[\[|\[\(|\(\(|\{|\[|\()(.+?)(\]\]|\)\]|\)\)|\}|\]|\))$/);
        if (bracketMatch) {
          const id = bracketMatch[1];
          const shape = bracketMatch[2];
          const label = bracketMatch[3];
          return getOrCreateNode(id, label, shape);
        }
        return getOrCreateNode(part, part);
      };

      const sourceNode = parseNodePart(sourceRaw);
      const targetNode = parseNodePart(targetRaw);

      // Extract label if e.g. -->|label|
      const labelMatch = connectorRaw.match(/\|(.*?)\|/);
      const connLabel = labelMatch ? labelMatch[1] : undefined;

      connections.push({
        id: `conn-${sourceNode.id}-${targetNode.id}-${connections.length}`,
        source: sourceNode.id,
        target: targetNode.id,
        label: connLabel,
        type: 'sync',
        trafficRate: 6,
      });
      return;
    }

    // 2. PlantUML entity definitions: e.g. node "Server 1" as s1, database "Users DB" as db
    const plantUmlDef = line.match(/^(actor|node|database|cloud|component|queue)\s+"?([^"]+)"?\s+(as\s+([a-zA-Z0-9_-]+))?$/i);
    if (plantUmlDef) {
      const pType = plantUmlDef[1].toLowerCase();
      const pName = plantUmlDef[2];
      const pId = plantUmlDef[4] || pName;
      const node = getOrCreateNode(pId, pName);
      if (pType === 'database') node.type = 'database';
      else if (pType === 'actor') node.type = 'user';
      else if (pType === 'cloud') node.type = 'cloud';
      else if (pType === 'queue') node.type = 'queue';
    }
  });

  return {
    id: `dsl-${Date.now()}`,
    name: fileName.replace(/\.[^/.]+$/, ''),
    type: 'custom',
    description: `Synthesized from Mermaid/PlantUML syntax with ${nodesMap.size} components.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: Array.from(nodesMap.values()),
    connections,
  };
}
