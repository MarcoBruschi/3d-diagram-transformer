import { Diagram, DiagramNode, DiagramConnection, NodeType } from '@/types/diagram';
import { inferNodeType } from './textParser';
import { compute3DLayout } from '../layout/spatialLayout';
import { sanitizeSVG } from '@/lib/security/sanitizer';
import { GeminiApiKeyError } from '@/types/errors';

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

/**
 * Image Diagram Analyzer
 * Supports SVG vector DOM extraction as well as PNG, JPG, WEBP raster computer-vision OCR
 * with full catalog archetype recognition (UML Deployment, AI/RAG, Data Lakehouse, IoT, BPMN, Security, ER, Cloud).
 */
export async function analyzeImageDiagram(file: File): Promise<Diagram> {
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    throw new Error(`File exceeds maximum allowed size of 10MB (${Math.round(file.size / 1024 / 1024)}MB).`);
  }

  const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');

  // 1. If SVG, attempt sanitized vector parsing via DOMParser
  if (isSvg) {
    try {
      const rawText = await file.text();
      const sanitizedSvgText = sanitizeSVG(rawText);
      const parser = new DOMParser();
      const doc = parser.parseFromString(sanitizedSvgText, 'image/svg+xml');
      const textNodes = Array.from(doc.querySelectorAll('text'))
        .map((t) => t.textContent?.trim())
        .filter((t): t is string => Boolean(t && t.length > 1));


      if (textNodes.length >= 2) {
        const nodes: DiagramNode[] = [];
        const connections: DiagramConnection[] = [];

        textNodes.slice(0, 12).forEach((txt, i) => {
          const name = txt;
          const id = `svg-${i}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          nodes.push({
            id,
            name,
            type: inferNodeType(name),
            status: 'active',
            description: `Extraído diretamente da camada vetorial do SVG.`,
            position2D: { x: 200 + (i % 3) * 200, y: 80 + Math.floor(i / 3) * 130 },
            metrics: { latency: 8, requestsPerSec: 650, cpu: 32, memory: 48 },
          });

          if (i > 0) {
            connections.push({
              id: `svg-conn-${i}`,
              source: nodes[i - 1].id,
              target: id,
              type: 'sync',
              trafficRate: 6,
              label: 'Link',
            });
          }
        });

        const rawDiagram: Diagram = {
          id: `svg-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: 'custom',
          description: `Extraídos ${nodes.length} nós vetoriais diretamente do SVG.`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          nodes,
          connections,
        };

        return compute3DLayout(rawDiagram);
      }
    } catch (e) {
      console.warn('SVG text layer parsing failed, fallback to computer vision analyzer', e);
    }
  }

  // 2. Multimodal AI Vision Inspection (Google Gemini Vision API - Mandatory for diagrams)
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const userApiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '';

  let aiRes: Response;
  try {
    aiRes = await fetch('/api/ai/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType: file.type || 'image/png',
        fileName: file.name,
        userApiKey,
      }),
    });
  } catch (netErr: any) {
    throw new GeminiApiKeyError(
      'Não foi possível conectar ao serviço de visão computacional da Google Gemini API. Verifique sua conexão com o servidor.',
      'MODEL_ERROR',
      netErr?.message
    );
  }

  if (!aiRes.ok) {
    const errJson = await aiRes.json().catch(() => null);
    const code = errJson?.code || (aiRes.status === 401 ? 'MISSING_GEMINI_KEY' : 'INVALID_GEMINI_KEY');
    const message = errJson?.message || 'Falha na validação da Google Gemini API para interpretação de imagem.';
    throw new GeminiApiKeyError(message, code, errJson?.error);
  }

  const json = await aiRes.json();
  if (!json.success || !json.data || !json.data.nodes || json.data.nodes.length === 0) {
    throw new GeminiApiKeyError(
      json.message || 'A Google Gemini Vision API não identificou componentes arquiteturais válidos na imagem enviada.',
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
      else if (stereo === 'artifact') resolvedType = 'artifact-registry';
      else if (stereo === 'server') resolvedType = 'server';
      else if (stereo === 'component') resolvedType = 'uml-component';
      else if (stereo === 'database' || lowerName.includes('postgres') || lowerName.includes('sql') || lowerName.includes('database')) resolvedType = 'database';
      else resolvedType = inferNodeType(n.name || '');
    }

    let importance = n.importance;
    if (!importance) {
      if (resolvedType === 'device' || resolvedType === 'laptop') importance = 4;
      else if (resolvedType === 'database') importance = 1;
      else if (resolvedType === 'server' || resolvedType === 'microservice') importance = 3;
      else importance = 3;
    }

    return {
      id: n.id || `ai-node-${i}`,
      name: n.name || `Component ${i + 1}`,
      type: resolvedType,
      status: 'active',
      importance,
      description: n.description || `Identificado por IA Vision (${json.engine}).`,
      position2D: {
        x: n.x2D || 200 + (i % 3) * 240,
        y: n.y2D || 100 + Math.floor(i / 3) * 160,
      },
      properties: {
        stereotype: n.stereotype || undefined,
        contained_by: n.contained_by || undefined,
      },
      metrics: {
        statusText: `IA Vision (${json.engine})`,
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
    description: c.description || 'Relação estruturada por IA.',
  }));

  // Adiciona conexões de contenção automática (ex: artefatos contidos em servidores/dispositivos)
  data.nodes.forEach((n: any) => {
    if (
      n.contained_by &&
      !aiConnections.some(
        (c) =>
          (c.source === n.id && c.target === n.contained_by) ||
          (c.source === n.contained_by && c.target === n.id)
      )
    ) {
      aiConnections.push({
        id: `ai-contained-${n.id}`,
        source: n.contained_by,
        target: n.id,
        type: 'composition',
        label: '«manifests»',
        style: 'solid',
        trafficRate: 5,
        description: `Artefato ${n.name} contido em ${n.contained_by}`,
      });
    }
  });

  const rawDiagram: Diagram = {
    id: `ai-img-${Date.now()}`,
    name: data.name || file.name.replace(/\.[^/.]+$/, ''),
    type: 'custom',
    description: `${data.description || 'Arquitetura extraída por IA de Visão Computacional Multimodal.'} (${json.engine})`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: aiNodes,
    connections: aiConnections,
  };

  return compute3DLayout(rawDiagram);
}
