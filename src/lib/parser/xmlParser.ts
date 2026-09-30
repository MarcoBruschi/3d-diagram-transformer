import { Diagram, DiagramNode, DiagramConnection, NodeType } from '@/types/diagram';
import { inferNodeType } from './textParser';

// Security limits to prevent Billion Laughs / DoS / XXE
const MAX_XML_SIZE = 5 * 1024 * 1024; // 5MB limit
const XXE_PATTERNS = [
  /<!ENTITY\s+/i,
  /<!DOCTYPE[^>]*\[/i,
  /SYSTEM\s+["'][^"']+["']/i,
  /PUBLIC\s+["'][^"']+["']/i,
];

/**
 * Universal XML Parser
 * Handles Draw.io (<mxGraphModel>), BPMN 2.0, GraphML, and generic structured XML.
 * Includes XXE, Billion Laughs, and XML bomb security defenses.
 */
export function parseXMLDiagram(xmlString: string, fileName = 'Imported XML Architecture'): Diagram {
  // 1. Enforce payload size limit
  if (!xmlString || xmlString.length > MAX_XML_SIZE) {
    throw new Error('XML file too large (max 5MB)');
  }

  // 2. Reject XXE / External Entity injections
  for (const pattern of XXE_PATTERNS) {
    if (pattern.test(xmlString)) {
      throw new Error('Security Error: XML with external entities or custom DOCTYPE definitions is not allowed');
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  // Check for XML parsing errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`XML Parsing error: ${parseError.textContent}`);
  }

  // 1. Check if Draw.io (<mxGraphModel> or <mxfile>)
  if (doc.querySelector('mxGraphModel') || doc.querySelector('mxfile')) {
    return parseDrawIO(doc, fileName);
  }

  // 2. Check if BPMN 2.0 (<bpmn:definitions> or <definitions>)
  if (doc.querySelector('definitions') || doc.querySelector('bpmn\\:definitions')) {
    return parseBPMN(doc, fileName);
  }

  // 3. Check if GraphML (<graphml>)
  if (doc.querySelector('graphml')) {
    return parseGraphML(doc, fileName);
  }

  // 4. Fallback: Generic XML nodes
  return parseGenericXML(doc, fileName);
}


function decodeXmlHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»');
}

function parseDrawIO(doc: Document, fileName: string): Diagram {
  const nodes: DiagramNode[] = [];
  const connections: DiagramConnection[] = [];
  const cells = Array.from(doc.querySelectorAll('mxCell'));

  // Separate valid cells
  const validCells = cells.filter((c) => {
    const id = c.getAttribute('id');
    return id && id !== '0' && id !== '1';
  });

  const vertexCells = validCells.filter((c) => c.getAttribute('vertex') === '1');
  const edgeCells = validCells.filter((c) => c.getAttribute('edge') === '1' || (c.getAttribute('source') && c.getAttribute('target')));

  // 1. Identify sub-icons/decorations (e.g. shape=module child inside a component)
  const childDecorators = new Set<string>();
  const parentHasIcon = new Set<string>();

  vertexCells.forEach((cell) => {
    const parentId = cell.getAttribute('parent');
    const style = cell.getAttribute('style') || '';
    const value = cell.getAttribute('value') || '';
    const isInsideParent = parentId && parentId !== '0' && parentId !== '1';

    if (isInsideParent && (style.includes('shape=module') || !value.trim())) {
      childDecorators.add(cell.getAttribute('id')!);
      parentHasIcon.add(parentId);
    }
  });

  // 2. Identify standalone text labels and match with unlabeled interface circles
  const textLabels = vertexCells.filter((c) => {
    const style = c.getAttribute('style') || '';
    return style.includes('text;') || style.includes('strokeColor=none;fillColor=none');
  });

  const interfaceCircles = vertexCells.filter((c) => {
    const style = c.getAttribute('style') || '';
    const val = c.getAttribute('value') || '';
    return style.includes('ellipse;') && !val.trim();
  });

  const labelConsumed = new Set<string>();
  const interfaceLabelMap = new Map<string, string>();

  interfaceCircles.forEach((circle) => {
    const geom = circle.querySelector('mxGeometry');
    const cx = geom ? parseFloat(geom.getAttribute('x') || '0') : 0;
    const cy = geom ? parseFloat(geom.getAttribute('y') || '0') : 0;

    let closestLabel: Element | null = null;
    let minDist = 180;

    textLabels.forEach((lbl) => {
      const lGeom = lbl.querySelector('mxGeometry');
      if (!lGeom) return;
      const lx = parseFloat(lGeom.getAttribute('x') || '0');
      const ly = parseFloat(lGeom.getAttribute('y') || '0');
      const dist = Math.hypot(cx - lx, cy - ly);
      if (dist < minDist) {
        minDist = dist;
        closestLabel = lbl;
      }
    });

    if (closestLabel) {
      const lblEl = closestLabel as Element;
      const rawVal = lblEl.getAttribute('value') || '';
      const clean = decodeXmlHtml(rawVal).replace(/<[^>]*>/g, '').trim();
      interfaceLabelMap.set(circle.getAttribute('id')!, clean);
      labelConsumed.add(lblEl.getAttribute('id')!);
    }
  });

  // 3. Process all semantic components into DiagramNodes
  vertexCells.forEach((cell) => {
    const id = cell.getAttribute('id')!;
    if (childDecorators.has(id)) return; // Skip child icon
    if (labelConsumed.has(id)) return; // Skip consumed label

    const style = cell.getAttribute('style') || '';
    let rawValue = cell.getAttribute('value') || '';

    // If interface circle had an adjacent label
    if (interfaceLabelMap.has(id)) {
      rawValue = interfaceLabelMap.get(id)!;
    }

    const decoded = decodeXmlHtml(rawValue);

    // Extract stereotype
    const stereoMatch = decoded.match(/«([^»]+)»|&laquo;([^&]+)&raquo;/);
    const stereotype = stereoMatch ? (stereoMatch[1] || stereoMatch[2]).trim() : undefined;

    // Clean name: strip HTML tags and stereotypes
    let cleanName = decoded.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (stereotype) {
      cleanName = cleanName.replace(/«[^»]+»|&laquo;[^&]+&raquo;/g, '').trim();
    }
    if (!cleanName) cleanName = `Node-${id}`;

    // Infer node type and anti-collision importance
    let nodeType: NodeType = 'uml-component';
    let importance = 3;

    const lowerStereo = (stereotype || '').toLowerCase();
    const lowerName = cleanName.toLowerCase();

    if (style.includes('ellipse;') || lowerName.includes('interface')) {
      nodeType = 'uml-interface';
      importance = 4;
    } else if (lowerStereo.includes('controller') || lowerName.includes('controlador')) {
      nodeType = 'uml-controller';
      importance = 4;
    } else if (lowerStereo.includes('executable') || lowerName.includes('gerenciador')) {
      nodeType = 'executable';
      importance = 3;
    } else if (lowerStereo.includes('service') || lowerName.includes('conta')) {
      nodeType = 'service';
      importance = 3;
    } else if (lowerStereo.includes('secure') || lowerName.includes('cripto') || lowerName.includes('seguran')) {
      nodeType = 'security-module';
      importance = 3;
    } else if (style.includes('cylinder') || lowerStereo.includes('database') || lowerName.includes('banco')) {
      nodeType = 'database';
      importance = 1;
    } else if (style.includes('actor') || lowerStereo.includes('actor')) {
      nodeType = 'actor';
      importance = 5;
    } else if (style.includes('cloud')) {
      nodeType = 'cloud';
      importance = 4;
    } else {
      nodeType = inferNodeType(cleanName);
    }

    // Geometry position
    const geometry = cell.querySelector('mxGeometry');
    const x = geometry ? parseFloat(geometry.getAttribute('x') || '300') : 300;
    const y = geometry ? parseFloat(geometry.getAttribute('y') || '200') : 200;

    nodes.push({
      id,
      name: cleanName,
      type: nodeType,
      status: 'active',
      importance,
      description: stereotype ? `«${stereotype}» ${cleanName}` : `Componente ${cleanName}`,
      position2D: { x, y },
      properties: {
        stereotype: stereotype || '',
        rawStyle: style,
      },
      metrics: {
        statusText: 'XML Importado',
      },
    });
  });

  // 4. Process all edges and connections
  edgeCells.forEach((edge, i) => {
    const id = edge.getAttribute('id') || `conn-${i}`;
    const source = edge.getAttribute('source');
    const target = edge.getAttribute('target');
    if (!source || !target) return;

    const style = edge.getAttribute('style') || '';
    const rawVal = edge.getAttribute('value') || '';
    const cleanLabel = decodeXmlHtml(rawVal).replace(/<[^>]*>/g, '').trim();

    let edgeType: DiagramConnection['type'] = 'association';
    let lineStyle: DiagramConnection['style'] = 'solid';
    let protocol = cleanLabel || undefined;

    if (style.includes('dashed=1') || cleanLabel.includes('use') || cleanLabel.includes('dependency')) {
      edgeType = 'use';
      lineStyle = 'dashed';
      protocol = cleanLabel || '«use»';
    } else if (style.includes('endArrow=halfCircle')) {
      // Required interface (Socket)
      edgeType = 'use';
      protocol = cleanLabel || '«requires»';
      lineStyle = 'solid';
    } else if (style.includes('endArrow=none') && target.toLowerCase().includes('if_')) {
      // Provided interface (Ball / Lollipop)
      edgeType = 'realization';
      protocol = cleanLabel || '«provides»';
      lineStyle = 'solid';
    } else if (style.includes('endArrow=block') || style.includes('endArrow=classic')) {
      edgeType = 'dependency';
    }

    connections.push({
      id,
      source,
      target,
      type: edgeType,
      label: protocol || cleanLabel || 'Link',
      protocol,
      style: lineStyle,
      trafficRate: 7,
      description: `Ligação ${protocol || edgeType} entre ${source} e ${target}.`,
    });
  });

  return {
    id: `drawio-${Date.now()}`,
    name: fileName.replace(/\.[^/.]+$/, ''),
    type: 'custom',
    description: `Diagrama importado com ${nodes.length} componentes e ${connections.length} conexões estruturadas.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    connections,
  };
}

function parseBPMN(doc: Document, fileName: string): Diagram {
  const nodes: DiagramNode[] = [];
  const connections: DiagramConnection[] = [];

  // Tasks and data stores
  const tasks = doc.querySelectorAll('task, serviceTask, userTask, dataStoreReference');
  tasks.forEach((el, i) => {
    const id = el.getAttribute('id') || `task-${i}`;
    const name = el.getAttribute('name') || el.tagName;
    const isStore = el.tagName.toLowerCase().includes('datastore');

    nodes.push({
      id,
      name,
      type: isStore ? 'database' : inferNodeType(name),
      status: 'active',
      description: `BPMN ${el.tagName}`,
      position2D: { x: 200 + (i % 4) * 180, y: 100 + Math.floor(i / 4) * 120 },
      metrics: { latency: 10, requestsPerSec: 500, cpu: 30, memory: 40 },
    });
  });

  // Sequence flows
  const flows = doc.querySelectorAll('sequenceFlow');
  flows.forEach((flow, i) => {
    const source = flow.getAttribute('sourceRef');
    const target = flow.getAttribute('targetRef');
    if (source && target) {
      connections.push({
        id: `flow-${i}`,
        source,
        target,
        label: flow.getAttribute('name') || undefined,
        type: 'sync',
        trafficRate: 5,
      });
    }
  });

  return {
    id: `bpmn-${Date.now()}`,
    name: fileName.replace(/\.[^/.]+$/, ''),
    type: 'custom',
    description: `Parsed from BPMN 2.0 XML specification.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    connections,
  };
}

function parseGraphML(doc: Document, fileName: string): Diagram {
  const nodes: DiagramNode[] = [];
  const connections: DiagramConnection[] = [];

  doc.querySelectorAll('node').forEach((nodeEl, i) => {
    const id = nodeEl.getAttribute('id') || `node-${i}`;
    const labelEl = nodeEl.querySelector('data');
    const name = labelEl?.textContent?.trim() || id;

    nodes.push({
      id,
      name,
      type: inferNodeType(name),
      status: 'active',
      position2D: { x: 200 + (i % 4) * 180, y: 100 + Math.floor(i / 4) * 120 },
      metrics: { latency: 8, requestsPerSec: 600, cpu: 35, memory: 45 },
    });
  });

  doc.querySelectorAll('edge').forEach((edgeEl, i) => {
    const source = edgeEl.getAttribute('source');
    const target = edgeEl.getAttribute('target');
    if (source && target) {
      connections.push({
        id: `edge-${i}`,
        source,
        target,
        type: 'sync',
        trafficRate: 6,
      });
    }
  });

  return {
    id: `graphml-${Date.now()}`,
    name: fileName.replace(/\.[^/.]+$/, ''),
    type: 'custom',
    description: `Parsed from GraphML structure with ${nodes.length} nodes.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    connections,
  };
}

function parseGenericXML(doc: Document, fileName: string): Diagram {
  const nodes: DiagramNode[] = [];
  const connections: DiagramConnection[] = [];
  const elements = Array.from(doc.querySelectorAll('*')).filter((el) => {
    return el.children.length === 0 || el.getAttribute('id') || el.getAttribute('name');
  });

  elements.slice(0, 16).forEach((el, i) => {
    const id = el.getAttribute('id') || `elem-${i}`;
    const name = el.getAttribute('name') || el.getAttribute('label') || el.tagName;
    nodes.push({
      id,
      name,
      type: inferNodeType(name),
      status: 'active',
      position2D: { x: 200 + (i % 3) * 200, y: 80 + Math.floor(i / 3) * 120 },
      metrics: { latency: 12, requestsPerSec: 400, cpu: 28, memory: 50 },
    });

    if (i > 0) {
      connections.push({
        id: `conn-${i}`,
        source: nodes[i - 1].id,
        target: id,
        type: 'sync',
        trafficRate: 5,
      });
    }
  });

  return {
    id: `xml-${Date.now()}`,
    name: fileName.replace(/\.[^/.]+$/, ''),
    type: 'custom',
    description: `Generic XML parsed structure.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes,
    connections,
  };
}
