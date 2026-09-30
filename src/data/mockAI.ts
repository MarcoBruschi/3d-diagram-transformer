export interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  progressStart: number;
  progressEnd: number;
  durationMs: number;
  logs: string[];
}

export const AI_PROCESSING_STAGES: ProcessingStage[] = [
  {
    id: 'ingestion',
    name: 'Ingesting & Tokenizing',
    description: 'Parsing diagram file, extracting structural vector elements and text nodes.',
    progressStart: 0,
    progressEnd: 22,
    durationMs: 700,
    logs: [
      '[SYSTEM] Reading binary payload buffer...',
      '[TOKENIZER] Identified 8 geometric entities and 9 connection contours',
      '[OCR/NLP] Extracted raw labels: Client, API Gateway, Services, DB',
      '[CLEANUP] Normalized coordinates to 1000x800 bounding viewport',
    ],
  },
  {
    id: 'semantic-detection',
    name: 'Neural Semantic Mapping',
    description: 'Identifying infrastructure components, cloud roles, and database types.',
    progressStart: 22,
    progressEnd: 54,
    durationMs: 900,
    logs: [
      '[INFERENCE] Classifying node "Web & Mobile Users" -> type: "user"',
      '[INFERENCE] Classifying node "API Gateway" -> type: "gateway" (confidence: 99.4%)',
      '[INFERENCE] Classifying node "PostgreSQL Primary" -> type: "database" (confidence: 98.7%)',
      '[INFERENCE] Classifying node "Kafka Event Bus" -> type: "queue" (confidence: 97.2%)',
      '[SEMANTICS] Bound 3D physical asset definitions to recognized roles',
    ],
  },
  {
    id: 'relationship-analysis',
    name: 'Topological Flow Synthesis',
    description: 'Resolving directional graph edges, synchronous calls, and event streams.',
    progressStart: 54,
    progressEnd: 78,
    durationMs: 800,
    logs: [
      '[TOPOLOGY] Computing directed acyclic graph (DAG) dependencies...',
      '[EDGE-ROUTING] Resolved 9 communication channels (HTTP/2, gRPC, Event, SQL)',
      '[FLOW] Configured directional particle flow rates based on bandwidth hints',
      '[GRAPH] Cycle detection check: Graph is stable without unbounded recursion',
    ],
  },
  {
    id: 'spatial-3d-layout',
    name: '3D Spatial Graph Synthesis',
    description: 'Computing hierarchical Z-depth, elevation tiers, and collision-free bounds.',
    progressStart: 78,
    progressEnd: 95,
    durationMs: 700,
    logs: [
      '[SPATIAL] Calculating 3-tier elevation matrix (Clients Y=+3.5, Core Y=+0.5, Storage Y=-2.5)',
      '[PHYSICS] Simulating spring-repulsion force field for optimal node separation',
      '[BOUNDS] Bounding frustum verified: [12.4 x 8.6 x 14.0] WebGL units',
      '[CAMERA] Generating optimal cinematic overview vector: [0, 8, 14] -> lookAt [0, 0, 0]',
    ],
  },
  {
    id: 'scene-assembly',
    name: 'Assembling WebGL Scene',
    description: 'Instantiating procedural 3D meshes, particle shaders, and live telemetry channels.',
    progressStart: 95,
    progressEnd: 100,
    durationMs: 500,
    logs: [
      '[RENDERER] Compiling custom pulse shaders and LED emissive materials...',
      '[PIPELINE] Initializing telemetry historical buffer for 8 nodes',
      '[READY] 3D System online. Transitioning to interactive viewport...',
    ],
  },
];
