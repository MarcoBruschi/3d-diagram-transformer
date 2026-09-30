import { Diagram, DiagramNode, NodeType } from '@/types/diagram';

/**
 * Returns importance rank (1 to 5):
 * 5 = User / Client / Ingress (Highest foreground priority)
 * 4 = Perimeter / Ingress / Gateway / Cloud / Router / Firewall
 * 3 = Compute / Application / Microservices / Business Logic
 * 2 = Message Queues / Caches / Event Streaming
 * 1 = Databases / SAN Storage / Persistence Layer (Deepest foundation)
 */
export function getNodeImportance(node: DiagramNode): number {
  if (node.importance && node.importance >= 1 && node.importance <= 5) {
    return node.importance;
  }

  switch (node.type) {
    // Tier 5: Clients, Actors, Sensors, Dashboards, Prompts, BPMN Start/End
    case 'user':
    case 'actor':
    case 'secondary-actor':
    case 'client':
    case 'laptop':
    case 'desktop':
    case 'mobile':
    case 'device':
    case 'prompt':
    case 'bi-dashboard':
    case 'monitoring-dashboard':
    case 'temperature-sensor':
    case 'humidity-sensor':
    case 'motion-sensor':
    case 'camera-sensor':
    case 'actuator':
    case 'motor':
    case 'relay':
    case 'bpmn-start':
    case 'bpmn-end':
      return 5;

    // Tier 4: Perimeter, Cloud Regions, Routers, Gateways, Firewalls
    case 'cloud':
    case 'cloud-region':
    case 'firewall':
    case 'waf':
    case 'router':
    case 'switch':
    case 'gateway':
    case 'proxy':
    case 'reverse-proxy':
    case 'vpn':
    case 'load-balancer':
    case 'k8s-ingress':
    case 'model-gateway':
    case 'internet':
    case 'data-source':
    case 'bpmn-pool':
    case 'bpmn-lane':
      return 4;

    // Tier 3: Compute, Logic, AI/LLM, IoT Microcontrollers, UML Classes, BPMN Tasks/Gateways
    case 'server':
    case 'server-rack':
    case 'blade-server':
    case 'api':
    case 'service':
    case 'microservice':
    case 'container':
    case 'docker':
    case 'kubernetes':
    case 'k8s-pod':
    case 'serverless-function':
    case 'authentication':
    case 'payment':
    case 'external-service':
    case 'llm':
    case 'ai-agent':
    case 'ml-model':
    case 'neural-network':
    case 'inference':
    case 'gpu-cluster':
    case 'esp32':
    case 'arduino':
    case 'raspberry-pi':
    case 'microcontroller':
    case 'uml-class':
    case 'uml-abstract-class':
    case 'uml-interface':
    case 'uml-enum':
    case 'uml-object':
    case 'uml-component':
    case 'bpmn-task':
    case 'bpmn-service-task':
    case 'bpmn-exclusive-gateway':
    case 'bpmn-parallel-gateway':
    case 'bpmn-inclusive-gateway':
    case 'decision':
    case 'activity':
    case 'secret-vault':
    case 'iam':
    case 'siem':
      return 3;

    // Tier 2: State, Queues, Streams, Pipelines, RAG, Caches
    case 'queue':
    case 'kafka':
    case 'rabbitmq':
    case 'cache':
    case 'message-broker':
    case 'event-bus':
    case 'event-stream':
    case 'pubsub':
    case 'etl':
    case 'elt':
    case 'data-pipeline':
    case 'data-stream':
    case 'rag':
      return 2;

    // Tier 1: Persistence, Lakehouses, Warehouses, Vector DBs, Storage, Tables
    case 'database':
    case 'storage':
    case 'table':
    case 'entity':
    case 'data-warehouse':
    case 'data-lake':
    case 'data-lakehouse':
    case 'vector-database':
    case 'embedding':
    case 'agent-memory':
    case 'san':
    case 'nas':
    case 'managed-database':
      return 1;

    default:
      return 3;
  }
}


// Coordinate mappings based on importance tier
const TIER_MAPPINGS: Record<number, { y3D: number; z3D: number; y2D: number }> = {
  5: { y3D: 3.8, z3D: -4.5, y2D: 70 },
  4: { y3D: 2.0, z3D: -2.2, y2D: 180 },
  3: { y3D: 0.5, z3D: 0.0, y2D: 300 },
  2: { y3D: -1.2, z3D: 2.2, y2D: 420 },
  1: { y3D: -2.6, z3D: 4.5, y2D: 540 },
};

/**
 * Computes 3D and 2D spatial layouts with depth priority and collision avoidance.
 */
export function compute3DLayout(diagram: Diagram): Diagram {
  // Group nodes by importance (1 to 5)
  const tierBuckets: Record<number, DiagramNode[]> = {
    5: [],
    4: [],
    3: [],
    2: [],
    1: [],
  };

  diagram.nodes.forEach((node) => {
    const importance = getNodeImportance(node);
    tierBuckets[importance].push(node);
  });

  const updatedNodes = diagram.nodes.map((node) => {
    const importance = getNodeImportance(node);
    const nodesInTier = tierBuckets[importance];
    const indexInTier = nodesInTier.findIndex((n) => n.id === node.id);
    const count = nodesInTier.length;

    const tierSpec = TIER_MAPPINGS[importance] || TIER_MAPPINGS[3];

    // Compute base X spacing to avoid collisions
    // Minimum 3D clearance: 3.2 units; Minimum 2D clearance: 200px
    const spacing3D = count > 3 ? 3.0 : 3.6;
    const spacing2D = count > 3 ? 190 : 220;

    // Stagger single nodes in different tiers so they never collapse into a single vertical column
    const tierStaggerX = importance === 5 ? -2.2 : importance === 4 ? 2.0 : importance === 3 ? -0.8 : importance === 2 ? 1.4 : 0;
    let x3D = count === 1 ? tierStaggerX : -((count - 1) * spacing3D) / 2 + indexInTier * spacing3D;
    let x2D = count === 1 ? 400 + tierStaggerX * 35 : 400 - ((count - 1) * spacing2D) / 2 + indexInTier * spacing2D;

    // Stagger depth (Z) and elevation (Y) within the tier to prevent line-of-sight occlusion
    const zJitter = count > 1 ? ((indexInTier % 2 === 1) ? 0.45 : -0.45) : 0;
    const yJitter = count > 1 ? ((indexInTier % 2 === 1) ? 0.25 : 0) : 0;

    const y3D = tierSpec.y3D + yJitter;
    const z3D = tierSpec.z3D + zJitter;
    const y2D = tierSpec.y2D + (indexInTier % 2 === 1 ? 20 : 0);

    // If node already has explicit 3D position from preset or user, PRESERVE it!
    const hasPreset3D = node.position3D && (node.position3D.x !== 0 || node.position3D.y !== 0 || node.position3D.z !== 0);
    const pos3D = hasPreset3D ? node.position3D! : { x: x3D, y: y3D, z: z3D };

    // If node already has user-dragged or preset 2D position, preserve it
    const hasValid2D = node.position2D && typeof node.position2D.x === 'number' && typeof node.position2D.y === 'number';
    const pos2D = hasValid2D ? node.position2D : { x: x2D, y: y2D };

    return {
      ...node,
      importance,
      position3D: pos3D,
      position2D: pos2D,
    };
  });

  // Collision resolution pass in 3D: enforce minimum distance between all node pairs
  const MIN_DIST_3D = 2.4;
  for (let i = 0; i < updatedNodes.length; i++) {
    for (let j = i + 1; j < updatedNodes.length; j++) {
      const n1 = updatedNodes[i];
      const n2 = updatedNodes[j];
      if (n1.position3D && n2.position3D) {
        const dx = n1.position3D.x - n2.position3D.x;
        const dy = n1.position3D.y - n2.position3D.y;
        const dz = n1.position3D.z - n2.position3D.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < MIN_DIST_3D && dist > 0.0001) {
          const overlap = (MIN_DIST_3D - dist) / 2;
          const nx = (dx / dist) * overlap;
          const nz = (dz / dist) * overlap;
          n1.position3D.x += nx;
          n1.position3D.z += nz;
          n2.position3D.x -= nx;
          n2.position3D.z -= nz;
        }

        // Line-of-sight camera anti-collision: if projected horizontal clearance is too tight (< 1.6 units), push apart
        const xDist = Math.abs(n1.position3D.x - n2.position3D.x);
        const yDist = Math.abs(n1.position3D.y - n2.position3D.y);
        if (xDist < 1.6 && yDist < 1.2) {
          const push = (1.6 - xDist) / 2;
          if (n1.position3D.x >= n2.position3D.x) {
            n1.position3D.x += push;
            n2.position3D.x -= push;
          } else {
            n1.position3D.x -= push;
            n2.position3D.x += push;
          }
        }
      }
    }
  }

  return {
    ...diagram,
    nodes: updatedNodes,
  };
}

