import { Diagram, DiagramNode, DiagramConnection, NodeType } from '@/types/diagram';
import { inferNodeType, parseArchitectureText } from './textParser';
import { parseXMLDiagram } from './xmlParser';
import { parseMermaidOrPlantUML } from './mermaidParser';
import { compute3DLayout } from '../layout/spatialLayout';
import { GeminiApiKeyError } from '@/types/errors';

/**
 * Checks if the text has standard Draw.io XML structure
 */
export function isDrawioOrXML(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.includes('<mxGraphModel') ||
    trimmed.includes('<mxfile') ||
    trimmed.includes('<mxCell') ||
    trimmed.startsWith('<?xml') ||
    trimmed.startsWith('<definitions') ||
    trimmed.startsWith('<graphml')
  );
}

/**
 * Checks if the text matches Mermaid or PlantUML DSL syntax
 */
export function isMermaidOrPlantUML(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.startsWith('graph ') ||
    trimmed.startsWith('flowchart ') ||
    trimmed.startsWith('sequenceDiagram') ||
    trimmed.startsWith('classDiagram') ||
    trimmed.startsWith('stateDiagram') ||
    trimmed.startsWith('@startuml')
  );
}

/**
 * Interprets architecture text:
 * - If Draw.io XML or standard DSL: uses deterministic parser.
 * - Otherwise (natural language, unstructured text, prompt, non-standard text):
 *   Gemini 2.5 Flash interprets the architecture and extracts nodes and connections.
 *   If Gemini is unavailable or offline, gracefully falls back to local heuristic parsing.
 */
export async function interpretTextDiagram(text: string, title = 'Custom Architecture'): Promise<Diagram> {
  const trimmed = text.trim();

  // 1. Standard Draw.io / XML Parser
  if (isDrawioOrXML(trimmed)) {
    try {
      const parsed = parseXMLDiagram(text, title || 'Diagrama XML / Draw.io');
      return compute3DLayout(parsed);
    } catch (err) {
      console.warn('Draw.io XML parse error, falling back to AI text interpretation:', err);
    }
  }

  // 2. Standard Mermaid / PlantUML DSL Parser
  if (isMermaidOrPlantUML(trimmed)) {
    try {
      const parsed = parseMermaidOrPlantUML(text, title || 'Diagrama Mermaid / DSL');
      return compute3DLayout(parsed);
    } catch (err) {
      console.warn('Mermaid/PlantUML parse error, falling back to AI text interpretation:', err);
    }
  }


  // 3. AI Architecture Interpretation via Google Gemini API (Mandatory for non-conventional formats)
  const userApiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '';

  let aiRes: Response;
  try {
    aiRes = await fetch('/api/ai/interpret-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        fileName: title,
        userApiKey,
      }),
    });
  } catch (netErr: any) {
    throw new GeminiApiKeyError(
      'Não foi possível conectar ao serviço de interpretação por IA. Verifique sua conexão com o servidor.',
      'MODEL_ERROR',
      netErr?.message
    );
  }

  if (!aiRes.ok) {
    const errJson = await aiRes.json().catch(() => null);
    const code = errJson?.code || (aiRes.status === 401 ? 'MISSING_GEMINI_KEY' : 'INVALID_GEMINI_KEY');
    const message = errJson?.message || 'Falha na validação da Google Gemini API para interpretação de texto.';
    throw new GeminiApiKeyError(message, code, errJson?.error);
  }

  const json = await aiRes.json();
  if (!json.success || !json.data || !json.data.nodes || json.data.nodes.length === 0) {
    throw new GeminiApiKeyError(
      json.message || 'A Google Gemini API não identificou componentes suficientes para gerar o diagrama.',
      json.code || 'MODEL_ERROR'
    );
  }

  const data = json.data;

  const aiNodes: DiagramNode[] = data.nodes.map((n: any, i: number) => {
    const stereo = (n.stereotype || '').toLowerCase();
    const lowerName = (n.name || '').toLowerCase();

    let resolvedType: NodeType = n.type;
    if (!resolvedType || resolvedType === 'generic') {
      if (stereo === 'controller' || lowerName.includes('controlador')) resolvedType = 'uml-controller';
      else if (stereo === 'executable') resolvedType = 'executable';
      else if (stereo === 'secure' || lowerName.includes('cripto') || lowerName.includes('crypto')) resolvedType = 'security-module';
      else if (stereo === 'interface' || lowerName.includes('interface')) resolvedType = 'uml-interface';
      else if (stereo === 'service') resolvedType = 'service';
      else if (stereo === 'device') resolvedType = 'device';
      else if (stereo === 'database' || lowerName.includes('postgres') || lowerName.includes('sql') || lowerName.includes('db')) resolvedType = 'database';
      else resolvedType = inferNodeType(n.name || '');
    }

    let importance = n.importance;
    if (!importance) {
      if (resolvedType === 'device' || resolvedType === 'laptop' || resolvedType === 'client') importance = 5;
      else if (resolvedType === 'gateway' || resolvedType === 'load-balancer') importance = 4;
      else if (resolvedType === 'database' || resolvedType === 'storage') importance = 1;
      else importance = 3;
    }

    return {
      id: n.id || `ai-node-${i}`,
      name: n.name || `Component ${i + 1}`,
      type: resolvedType,
      status: 'active',
      importance,
      description: n.description || `Interpretado por Gemini AI (${json.engine}).`,
      position2D: {
        x: n.x2D || 200 + (i % 3) * 240,
        y: n.y2D || 100 + Math.floor(i / 3) * 160,
      },
      properties: {
        stereotype: n.stereotype || undefined,
        contained_by: n.contained_by || undefined,
      },
      metrics: {
        statusText: `IA Gemini (${json.engine})`,
      },
    };
  });

  const aiConnections: DiagramConnection[] = (data.connections || []).map((c: any, i: number) => ({
    id: c.id || `ai-conn-${i}`,
    source: c.source,
    target: c.target,
    type: c.type || (c.label?.includes('use') ? 'use' : 'sync'),
    label: c.label || undefined,
    protocol: c.protocol || c.label || undefined,
    style: c.style || (c.label?.includes('use') ? 'dashed' : 'solid'),
    trafficRate: 8,
    description: c.description || 'Relação arquitetural interpretada por IA.',
  }));

  const rawDiagram: Diagram = {
    id: `ai-text-${Date.now()}`,
    name: data.name || title.replace(/\.[^/.]+$/, ''),
    type: 'custom',
    description: `${data.description || 'Arquitetura interpretada a partir de especificação textual por IA Gemini.'} (${json.engine})`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: aiNodes,
    connections: aiConnections,
  };

  return compute3DLayout(rawDiagram);
}
