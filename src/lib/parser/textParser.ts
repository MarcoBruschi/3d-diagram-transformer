import { Diagram, DiagramNode, DiagramConnection, NodeType } from '@/types/diagram';
import { compute3DLayout } from '../layout/spatialLayout';

export function inferNodeType(name: string): NodeType {
  const lower = name.toLowerCase();

  // AI & Machine Learning
  if (lower.includes('llm') || lower.includes('gpt') || lower.includes('claude') || lower.includes('deepseek') || lower.includes('foundation model')) return 'llm';
  if (lower.includes('agent') || lower.includes('langchain') || lower.includes('autogen')) return 'ai-agent';
  if (lower.includes('neural') || lower.includes('cnn') || lower.includes('rnn') || lower.includes('transformer')) return 'neural-network';
  if (lower.includes('ml model') || lower.includes('scikit') || lower.includes('classifier') || lower.includes('regressor')) return 'ml-model';
  if (lower.includes('inference') || lower.includes('vllm') || lower.includes('tensorrt') || lower.includes('ollama')) return 'inference';
  if (lower.includes('vector db') || lower.includes('vector') || lower.includes('pinecone') || lower.includes('weaviate') || lower.includes('milvus') || lower.includes('chroma')) return 'vector-database';
  if (lower.includes('rag') || lower.includes('retrieval')) return 'rag';
  if (lower.includes('embedding')) return 'embedding';
  if (lower.includes('prompt')) return 'prompt';
  if (lower.includes('gpu') || lower.includes('h100') || lower.includes('a100') || lower.includes('cuda')) return 'gpu-cluster';
  if (lower.includes('model gateway')) return 'model-gateway';

  // Data Engineering & Big Data
  if (lower.includes('lakehouse') || lower.includes('delta lake') || lower.includes('iceberg')) return 'data-lakehouse';
  if (lower.includes('data lake') || lower.includes('datalake') || lower.includes('bronze') || lower.includes('silver')) return 'data-lake';
  if (lower.includes('warehouse') || lower.includes('snowflake') || lower.includes('bigquery') || lower.includes('redshift') || lower.includes('gold')) return 'data-warehouse';
  if (lower.includes('etl') || lower.includes('spark') || lower.includes('glue') || lower.includes('dbt')) return 'etl';
  if (lower.includes('elt')) return 'elt';
  if (lower.includes('pipeline')) return 'data-pipeline';
  if (lower.includes('stream') || lower.includes('flink')) return 'data-stream';
  if (lower.includes('kafka')) return 'kafka';
  if (lower.includes('power bi') || lower.includes('tableau') || lower.includes('bi dashboard') || lower.includes('analytics dashboard')) return 'bi-dashboard';
  if (lower.includes('data source') || lower.includes('raw ingest') || lower.includes('cdc')) return 'data-source';

  // IoT, Hardware & Embedded
  if (lower.includes('esp32') || lower.includes('esp8266')) return 'esp32';
  if (lower.includes('arduino')) return 'arduino';
  if (lower.includes('raspberry') || lower.includes('rpi')) return 'raspberry-pi';
  if (lower.includes('temp') || lower.includes('temperature') || lower.includes('ds18b20') || lower.includes('thermometer')) return 'temperature-sensor';
  if (lower.includes('humidity') || lower.includes('dht') || lower.includes('dht22') || lower.includes('dht11')) return 'humidity-sensor';
  if (lower.includes('motion') || lower.includes('pir') || lower.includes('presence')) return 'motion-sensor';
  if (lower.includes('camera') || lower.includes('vision sensor')) return 'camera-sensor';
  if (lower.includes('relay') || lower.includes('switch module')) return 'relay';
  if (lower.includes('actuator') || lower.includes('servo') || lower.includes('motor')) return 'actuator';
  if (lower.includes('mcu') || lower.includes('microcontroller') || lower.includes('pic') || lower.includes('stm32')) return 'microcontroller';
  if (lower.includes('plc') || lower.includes('scada')) return 'plc';

  // UML & Structural
  if (lower.includes('abstract class')) return 'uml-abstract-class';
  if (lower.includes('interface')) return 'uml-interface';
  if (lower.includes('enum')) return 'uml-enum';
  if (lower.includes('class')) return 'uml-class';
  if (lower.includes('table') || lower.includes('sql table')) return 'table';
  if (lower.includes('entity')) return 'entity';
  if (lower.includes('package')) return 'package';

  // BPMN & Workflow
  if (lower.includes('start event') || lower.includes('bpmn start')) return 'bpmn-start';
  if (lower.includes('end event') || lower.includes('bpmn end')) return 'bpmn-end';
  if (lower.includes('exclusive gateway') || lower.includes('xor') || lower.includes('decision gateway') || lower.includes('decision')) return 'bpmn-exclusive-gateway';
  if (lower.includes('parallel gateway') || lower.includes('and gateway') || lower.includes('fork')) return 'bpmn-parallel-gateway';
  if (lower.includes('inclusive gateway') || lower.includes('or gateway')) return 'bpmn-inclusive-gateway';
  if (lower.includes('service task') || lower.includes('automated task')) return 'bpmn-service-task';
  if (lower.includes('bpmn task') || lower.includes('user task') || lower.includes('process task')) return 'bpmn-task';

  // Security
  if (lower.includes('waf') || lower.includes('web application firewall')) return 'waf';
  if (lower.includes('firewall') || lower.includes('perimeter')) return 'firewall';
  if (lower.includes('vault') || lower.includes('secret')) return 'secret-vault';
  if (lower.includes('iam') || lower.includes('identity')) return 'iam';
  if (lower.includes('siem') || lower.includes('soc') || lower.includes('audit')) return 'siem';
  if (lower.includes('vpn') || lower.includes('tunnel')) return 'vpn';

  // Clients & Users
  if (lower.includes('user') || lower.includes('actor') || lower.includes('customer') || lower.includes('human')) return 'user';
  if (lower.includes('client') || lower.includes('browser') || lower.includes('frontend') || lower.includes('spa')) return 'client';
  if (lower.includes('laptop') || lower.includes('notebook') || lower.includes('workstation')) return 'laptop';
  if (lower.includes('mobile') || lower.includes('phone') || lower.includes('tablet') || lower.includes('app')) return 'mobile';

  // Persistence & Storage
  if (lower.includes('database') || lower.includes('postgres') || lower.includes('mysql') || lower.includes('mongo') || lower.includes('sql') || lower.includes('db') || lower.includes('repository')) return 'database';
  if (lower.includes('storage') || lower.includes('san') || lower.includes('nas') || lower.includes('s3') || lower.includes('bucket')) return 'storage';
  if (lower.includes('cache') || lower.includes('redis') || lower.includes('memcached')) return 'cache';

  // Networking & Edge
  if (lower.includes('gateway') || lower.includes('edge') || lower.includes('proxy') || lower.includes('envoy') || lower.includes('traefik')) return 'gateway';
  if (lower.includes('load balancer') || lower.includes('balancer') || lower.includes('alb') || lower.includes('nlb')) return 'load-balancer';
  if (lower.includes('queue') || lower.includes('rabbit') || lower.includes('sqs') || lower.includes('event')) return 'queue';
  if (lower.includes('router') || lower.includes('wifi') || lower.includes('switch')) return 'router';
  if (lower.includes('cloud') || lower.includes('aws') || lower.includes('gcp') || lower.includes('azure') || lower.includes('internet')) return 'cloud';

  // Auth & Payment
  if (lower.includes('auth') || lower.includes('login') || lower.includes('jwt') || lower.includes('security')) return 'authentication';
  if (lower.includes('pay') || lower.includes('billing') || lower.includes('checkout') || lower.includes('stripe')) return 'payment';

  // Compute & Containers
  if (lower.includes('k8s') || lower.includes('kubernetes') || lower.includes('cluster')) return 'kubernetes';
  if (lower.includes('container') || lower.includes('docker') || lower.includes('pod')) return 'container';
  if (lower.includes('api') || lower.includes('rest') || lower.includes('graphql') || lower.includes('grpc') || lower.includes('endpoint')) return 'api';
  if (lower.includes('service') || lower.includes('microservice')) return 'microservice';
  if (lower.includes('server') || lower.includes('node') || lower.includes('host') || lower.includes('blade')) return 'server';

  return 'service';
}


function cleanToken(token: string): string {
  return token.replace(/^\[+|\]+$/g, '').replace(/^\(+|\)+$/g, '').trim();
}

export function parseArchitectureText(text: string, title = 'Imported Architecture'): Diagram {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const nodesMap = new Map<string, DiagramNode>();
  const connections: DiagramConnection[] = [];

  const getOrCreateNode = (rawName: string): DiagramNode => {
    const name = cleanToken(rawName);
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (nodesMap.has(id)) {
      return nodesMap.get(id)!;
    }

    const type = inferNodeType(name);
    const node: DiagramNode = {
      id,
      name,
      type,
      status: 'active',
      description: `Inferred as ${type.toUpperCase()} from diagram specification.`,
      position2D: { x: 400, y: 100 + nodesMap.size * 80 },
      metrics: {
        statusText: 'Operational',
      },
    };

    nodesMap.set(id, node);
    return node;
  };

  let prevNode: DiagramNode | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Ignore comment lines
    if (line.startsWith('#') || line.startsWith('//')) continue;

    // Check for inline arrows: A -> B -> C or A --> B
    if (line.includes('->') || line.includes('-->') || line.includes('==>')) {
      const parts = line.split(/->|-->|==>/).map((p) => p.trim()).filter(Boolean);
      for (let p = 0; p < parts.length - 1; p++) {
        const source = getOrCreateNode(parts[p]);
        const target = getOrCreateNode(parts[p + 1]);
        const connId = `conn-${source.id}-${target.id}-${connections.length}`;
        if (!connections.some((c) => c.source === source.id && c.target === target.id)) {
          connections.push({
            id: connId,
            source: source.id,
            target: target.id,
            type: 'sync',
            trafficRate: 6,
          });
        }
      }
      prevNode = null;
      continue;
    }

    // Check for vertical arrow characters: ↓, |, v, V
    if (line === '↓' || line === '|' || line.toLowerCase() === 'v' || line === '+') {
      continue; // Handled by consecutive lines
    }

    // Single token line
    const cleaned = cleanToken(line);
    if (cleaned.length > 0) {
      const currentNode = getOrCreateNode(cleaned);
      if (prevNode && prevNode.id !== currentNode.id) {
        const connId = `conn-${prevNode.id}-${currentNode.id}-${connections.length}`;
        if (!connections.some((c) => c.source === prevNode!.id && c.target === currentNode.id)) {
          connections.push({
            id: connId,
            source: prevNode.id,
            target: currentNode.id,
            type: 'sync',
            trafficRate: 5,
          });
        }
      }
      prevNode = currentNode;
    }
  }

  // If no nodes found, create a fallback demonstration
  if (nodesMap.size === 0) {
    const client = getOrCreateNode('Client Workstation');
    const api = getOrCreateNode('API Gateway');
    const db = getOrCreateNode('Primary Database');
    connections.push(
      { id: 'c1', source: client.id, target: api.id, type: 'http', trafficRate: 6 },
      { id: 'c2', source: api.id, target: db.id, type: 'query', trafficRate: 6 }
    );
  }

  const rawDiagram: Diagram = {
    id: `diagram-${Date.now()}`,
    name: title,
    type: 'custom',
    description: `Generated from text input with ${nodesMap.size} nodes and ${connections.length} connections.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: Array.from(nodesMap.values()),
    connections,
  };

  return compute3DLayout(rawDiagram);
}

