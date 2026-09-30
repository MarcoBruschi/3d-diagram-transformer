import { Diagram, DiagramNode, DiagramConnection, NodeType } from '@/types/diagram';
import { PRESET_DIAGRAMS } from '@/data/presets';
import { parseArchitectureText } from '@/lib/parser/textParser';
import { parseXMLDiagram } from '@/lib/parser/xmlParser';
import { parseMermaidOrPlantUML } from '@/lib/parser/mermaidParser';
import { analyzeImageDiagram } from '@/lib/parser/imageAnalyzer';
import { compute3DLayout } from '@/lib/layout/spatialLayout';
import { TelemetryHistory, MetricPoint } from '@/types/telemetry';

import { interpretTextDiagram } from '@/lib/parser/aiTextInterpreter';

export interface IDiagramService {
  getPresets(): Diagram[];
  getDiagramById(id: string): Diagram | undefined;
  analyzeFile(file: File): Promise<Diagram>;
  parseText(text: string): Promise<Diagram>;
  generateMockTelemetry(node: DiagramNode): TelemetryHistory | null;
}

class DiagramService implements IDiagramService {
  getPresets(): Diagram[] {
    return PRESET_DIAGRAMS;
  }

  getDiagramById(id: string): Diagram | undefined {
    return PRESET_DIAGRAMS.find((d) => d.id === id);
  }

  async analyzeFile(file: File): Promise<Diagram> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // 1. Image Formats (PNG, JPG, WEBP, SVG, BMP, GIF)
    if (
      file.type.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp', 'gif'].includes(ext)
    ) {
      const diagram = await analyzeImageDiagram(file);
      return compute3DLayout(diagram);
    }

    const text = await file.text();
    const trimmed = text.trim();

    // 2. XML / Draw.io / BPMN / GraphML
    if (
      ['xml', 'drawio', 'bpmn', 'graphml'].includes(ext) ||
      trimmed.startsWith('<?xml') ||
      trimmed.startsWith('<mxGraphModel') ||
      trimmed.startsWith('<mxfile') ||
      trimmed.startsWith('<definitions') ||
      trimmed.startsWith('<graphml')
    ) {
      try {
        const diagram = parseXMLDiagram(text, file.name);
        return compute3DLayout(diagram);
      } catch (e) {
        console.warn('XML Parser error, falling back to AI text interpretation', e);
      }
    }

    // 3. JSON Structured format
    if (ext === 'json' || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.nodes && Array.isArray(parsed.nodes)) {
          const diagram: Diagram = {
            id: parsed.id || `diag-${Date.now()}`,
            name: parsed.name || file.name.replace(/\.[^/.]+$/, ''),
            type: parsed.type || 'custom',
            description: parsed.description || `Imported from ${file.name}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes: parsed.nodes,
            connections: parsed.connections || [],
          };
          return compute3DLayout(diagram);
        }
      } catch (e) {
        console.warn('JSON Parser error, falling back to AI text interpretation', e);
      }
    }

    // 4. Mermaid / PlantUML DSL
    if (
      ['mmd', 'mermaid', 'puml', 'plantuml'].includes(ext) ||
      trimmed.startsWith('graph ') ||
      trimmed.startsWith('flowchart ') ||
      trimmed.startsWith('@startuml')
    ) {
      try {
        const diagram = parseMermaidOrPlantUML(text, file.name);
        return compute3DLayout(diagram);
      } catch (e) {
        console.warn('Mermaid/PlantUML error, falling back to AI text interpretation', e);
      }
    }

    // 5. Text needing interpretation / Non-Draw.io formats -> Gemini AI Interpretation
    return interpretTextDiagram(text, file.name);
  }

  async parseText(text: string): Promise<Diagram> {
    const trimmed = text.trim();

    // 1. Draw.io / XML
    if (
      trimmed.includes('<mxGraphModel') ||
      trimmed.includes('<mxfile') ||
      trimmed.includes('<mxCell') ||
      trimmed.startsWith('<?xml') ||
      trimmed.startsWith('<definitions') ||
      trimmed.startsWith('<graphml')
    ) {
      try {
        return compute3DLayout(parseXMLDiagram(text, 'Diagrama XML / Draw.io'));
      } catch (e) {
        console.warn('Draw.io XML parse failed, routing to AI interpretation', e);
      }
    }

    // 2. Mermaid / PlantUML
    if (
      trimmed.startsWith('graph ') ||
      trimmed.startsWith('flowchart ') ||
      trimmed.startsWith('sequenceDiagram') ||
      trimmed.startsWith('@startuml')
    ) {
      try {
        return compute3DLayout(parseMermaidOrPlantUML(text, 'Custom DSL Architecture'));
      } catch (e) {
        console.warn('DSL parse failed, routing to AI interpretation', e);
      }
    }

    // 3. Unstructured text, natural language or non-standard format -> Gemini AI Interpretation
    return interpretTextDiagram(text, 'Custom Architecture');
  }

  generateMockTelemetry(node: DiagramNode): TelemetryHistory | null {
    if (!node.metrics) return null;
    const baseRps = node.metrics.requestsPerSec;
    const baseLatency = node.metrics.latency;
    const baseCpu = node.metrics.cpu;

    if (baseRps === undefined && baseLatency === undefined && baseCpu === undefined) {
      return null;
    }

    const rps = baseRps ?? 0;
    const latency = baseLatency ?? 0;
    const cpu = baseCpu ?? 0;

    const points: MetricPoint[] = [];
    for (let i = 10; i >= 0; i--) {
      const timeStr = i === 0 ? 'Now' : `${i * 3}s ago`;
      points.push({
        time: timeStr,
        rps,
        latency,
        errors: node.metrics.errorRate ? Math.round(node.metrics.errorRate * 100) : 0,
        cpu,
      });
    }

    return {
      nodeId: node.id,
      points,
      avgLatency: latency,
      p99Latency: Math.round(latency * 1.5),
      peakRps: rps,
    };
  }
}

export const diagramService = new DiagramService();
