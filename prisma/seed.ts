import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || `Pz_${crypto.randomBytes(12).toString('hex')}!`;
  const passwordHash = await bcrypt.hash(initialPassword, 10);

  // 0. Starter Organization & Welcome Admin
  let starterOrg = await prisma.organization.findUnique({
    where: { slug: 'starter-workspace' },
  });

  if (!starterOrg) {
    starterOrg = await prisma.organization.create({
      data: {
        name: 'Starter Organization',
        slug: 'starter-workspace',
        inviteToken: 'inv_starter_workspace_default',
        plan: 'free',
      },
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@diagram3d.com',
        name: 'Welcome Admin',
        role: 'admin',
        passwordHash,
        organizationId: starterOrg.id,
        emailVerified: true,
      },
    });

    // Default Starter Diagram
    const defaultDiagram = await prisma.diagram.create({
      data: {
        name: 'Cloud Microservices Core Architecture',
        description: 'Default starter 3D architecture twin featuring client ingress, API gateway, microservices, Redis cache and PostgreSQL database.',
        type: 'microservices',
        organizationId: starterOrg.id,
        createdBy: adminUser.id,
        isPublic: false,
        nodeCount: 5,
        data: {
          nodes: [
            { id: 'start-client', name: 'Web & Mobile Client', type: 'client', importance: 5, position3D: { x: 0, y: 0, z: 12 }, position2D: { x: 400, y: 80 } },
            { id: 'start-gw', name: 'API Gateway', type: 'gateway', importance: 4, position3D: { x: 0, y: 0, z: 6 }, position2D: { x: 400, y: 180 } },
            { id: 'start-svc', name: 'Core Microservices', type: 'microservice', importance: 3, position3D: { x: 0, y: 0, z: 0 }, position2D: { x: 400, y: 300 } },
            { id: 'start-cache', name: 'Redis Cache Cluster', type: 'server', importance: 2, position3D: { x: -6, y: 0, z: -6 }, position2D: { x: 260, y: 440 } },
            { id: 'start-db', name: 'PostgreSQL Primary DB', type: 'database', importance: 1, position3D: { x: 6, y: 0, z: -6 }, position2D: { x: 540, y: 440 } },
          ],
          connections: [
            { id: 'sc1', source: 'start-client', target: 'start-gw', type: 'sync', label: 'HTTPS' },
            { id: 'sc2', source: 'start-gw', target: 'start-svc', type: 'sync', label: 'gRPC' },
            { id: 'sc3', source: 'start-svc', target: 'start-cache', type: 'sync', label: 'Cache Hits' },
            { id: 'sc4', source: 'start-svc', target: 'start-db', type: 'sync', label: 'SQL Transactions' },
          ],
        },
      },
    });

    await prisma.diagramVersion.create({
      data: {
        diagramId: defaultDiagram.id,
        version: 1,
        createdBy: adminUser.id,
        data: defaultDiagram.data as any,
      },
    });

    console.log('✅ Created Starter Organization, Welcome Admin, and Default Diagram');
  }

  // 1. AWS 3-Tier Web Architecture
  const awsTemplate = {
    name: 'AWS 3-Tier Scalable Cloud Architecture',
    description: 'Enterprise high-availability architecture featuring CloudFront CDN, ALB, auto-scaling ECS Fargate container tasks, ElastiCache Redis, and Multi-AZ Aurora PostgreSQL.',
    category: 'aws',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60',
    isPublic: true,
    downloadsCount: 142,
    data: {
      nodes: [
        {
          id: 'aws-client',
          name: 'Global Users & Clients',
          type: 'client',
          importance: 5,
          description: 'Global web and mobile client applications',
          position3D: { x: 0, y: 0, z: 24 },
          x2D: 450,
          y2D: 80,
        },
        {
          id: 'aws-cloudfront',
          name: 'Amazon CloudFront Edge CDN',
          type: 'cloud',
          importance: 4,
          description: 'Low-latency edge caching and SSL termination with AWS Shield DDoS protection',
          position3D: { x: 0, y: 0, z: 18 },
          x2D: 450,
          y2D: 180,
        },
        {
          id: 'aws-alb',
          name: 'Application Load Balancer (ALB)',
          type: 'load-balancer',
          importance: 4,
          description: 'Layer 7 load balancer distributing traffic across availability zones',
          position3D: { x: 0, y: 0, z: 12 },
          x2D: 450,
          y2D: 280,
        },
        {
          id: 'aws-ecs-api',
          name: 'ECS Fargate API Services',
          type: 'microservice',
          importance: 3,
          description: 'Containerized Node.js & Go backend microservices running in private subnets',
          position3D: { x: -6, y: 0, z: 4 },
          x2D: 300,
          y2D: 400,
        },
        {
          id: 'aws-ecs-worker',
          name: 'ECS Background Workers',
          type: 'server',
          importance: 3,
          description: 'Asynchronous task workers processing batch jobs and image transformations',
          position3D: { x: 6, y: 0, z: 4 },
          x2D: 600,
          y2D: 400,
        },
        {
          id: 'aws-elasticache',
          name: 'ElastiCache Redis Cluster',
          type: 'server',
          importance: 2,
          description: 'In-memory sub-millisecond cache for user sessions and hot diagram graphs',
          position3D: { x: -6, y: 0, z: -4 },
          x2D: 300,
          y2D: 540,
        },
        {
          id: 'aws-rds-aurora',
          name: 'Aurora PostgreSQL (Multi-AZ)',
          type: 'database',
          importance: 1,
          description: 'Relational ACID store with automated cross-AZ failover and continuous backups',
          position3D: { x: 6, y: 0, z: -6 },
          x2D: 600,
          y2D: 540,
        },
      ],
      connections: [
        { id: 'c1', source: 'aws-client', target: 'aws-cloudfront', type: 'sync', label: 'HTTPS / TLS 1.3', protocol: 'HTTPS' },
        { id: 'c2', source: 'aws-cloudfront', target: 'aws-alb', type: 'sync', label: 'Origin Traffic', protocol: 'HTTPS' },
        { id: 'c3', source: 'aws-alb', target: 'aws-ecs-api', type: 'sync', label: 'Dynamic API Requests', protocol: 'HTTP/2' },
        { id: 'c4', source: 'aws-ecs-api', target: 'aws-ecs-worker', type: 'async', label: 'Async Queue Dispatch', protocol: 'gRPC' },
        { id: 'c5', source: 'aws-ecs-api', target: 'aws-elasticache', type: 'sync', label: 'Session & Cache Hits', protocol: 'TCP / RESP' },
        { id: 'c6', source: 'aws-ecs-api', target: 'aws-rds-aurora', type: 'sync', label: 'SQL Transactions', protocol: 'PostgreSQL' },
        { id: 'c7', source: 'aws-ecs-worker', target: 'aws-rds-aurora', type: 'sync', label: 'Batch Writes', protocol: 'PostgreSQL' },
      ],
    },
  };

  // 2. Kubernetes Microservices Cluster
  const k8sTemplate = {
    name: 'Kubernetes Production Microservices Mesh',
    description: 'Cloud-native Istio service mesh with Envoy sidecars, Kafka event broker, decoupled polyglot domain services, and sharded MongoDB cluster.',
    category: 'kubernetes',
    thumbnailUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=60',
    isPublic: true,
    downloadsCount: 98,
    data: {
      nodes: [
        { id: 'k8s-ingress', name: 'NGINX Ingress Controller', type: 'k8s-ingress', importance: 5, description: 'SSL ingress and path-based routing', position3D: { x: 0, y: 0, z: 20 }, x2D: 450, y2D: 80 },
        { id: 'k8s-mesh', name: 'Istio Service Mesh Gateway', type: 'gateway', importance: 4, description: 'mTLS security, canary deployments and telemetry injection', position3D: { x: 0, y: 0, z: 14 }, x2D: 450, y2D: 180 },
        { id: 'k8s-auth', name: 'Auth & IAM Pods (3x)', type: 'security-module', importance: 3, description: 'JWT authentication, role authorization and rate limiting', position3D: { x: -8, y: 0, z: 6 }, x2D: 220, y2D: 320 },
        { id: 'k8s-orders', name: 'Order Processing Pods (5x)', type: 'microservice', importance: 3, description: 'Saga orchestrator managing checkout and billing flows', position3D: { x: 0, y: 0, z: 6 }, x2D: 450, y2D: 320 },
        { id: 'k8s-catalog', name: 'Product Catalog Pods (4x)', type: 'microservice', importance: 3, description: 'High-throughput read-heavy catalog service', position3D: { x: 8, y: 0, z: 6 }, x2D: 680, y2D: 320 },
        { id: 'k8s-kafka', name: 'Apache Kafka Event Bus', type: 'queue', importance: 2, description: 'Distributed event streaming log for choreography', position3D: { x: 0, y: 0, z: -2 }, x2D: 450, y2D: 460 },
        { id: 'k8s-mongo', name: 'MongoDB ReplicaSet', type: 'database', importance: 1, description: 'NoSQL document store for orders and catalog documents', position3D: { x: -6, y: 0, z: -10 }, x2D: 300, y2D: 580 },
        { id: 'k8s-redis', name: 'Redis Cache Cluster', type: 'server', importance: 1, description: 'Token store and catalog warm cache', position3D: { x: 6, y: 0, z: -10 }, x2D: 600, y2D: 580 },
      ],
      connections: [
        { id: 'kc1', source: 'k8s-ingress', target: 'k8s-mesh', type: 'sync', label: 'HTTP/2', protocol: 'mTLS' },
        { id: 'kc2', source: 'k8s-mesh', target: 'k8s-auth', type: 'sync', label: 'Verify Bearer', protocol: 'gRPC' },
        { id: 'kc3', source: 'k8s-mesh', target: 'k8s-orders', type: 'sync', label: '/api/v1/orders', protocol: 'gRPC' },
        { id: 'kc4', source: 'k8s-mesh', target: 'k8s-catalog', type: 'sync', label: '/api/v1/catalog', protocol: 'gRPC' },
        { id: 'kc5', source: 'k8s-orders', target: 'k8s-kafka', type: 'async', label: 'OrderPlacedEvent', protocol: 'Kafka Protocol' },
        { id: 'kc6', source: 'k8s-catalog', target: 'k8s-redis', type: 'sync', label: 'Cache Query', protocol: 'TCP' },
        { id: 'kc7', source: 'k8s-orders', target: 'k8s-mongo', type: 'sync', label: 'Order Persist', protocol: 'Mongo Wire' },
      ],
    },
  };

  // 3. AI RAG Pipeline
  const ragTemplate = {
    name: 'Enterprise AI RAG & LLM Reasoning Engine',
    description: 'Production Generative AI architecture combining vector embedding search, LangChain orchestrator, Qdrant vector database, and Google Gemini 2.5 Flash reasoning model.',
    category: 'ai-rag',
    thumbnailUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60',
    isPublic: true,
    downloadsCount: 215,
    data: {
      nodes: [
        { id: 'rag-user', name: 'Chat Interface / Studio', type: 'client', importance: 5, description: 'Conversational UI and architectural diagram workspace', position3D: { x: 0, y: 0, z: 22 }, x2D: 450, y2D: 70 },
        { id: 'rag-gateway', name: 'FastAPI / Next.js Gateway', type: 'gateway', importance: 4, description: 'Rate limiter, auth verifier, and streaming SSE proxy', position3D: { x: 0, y: 0, z: 14 }, x2D: 450, y2D: 180 },
        { id: 'rag-engine', name: 'LangChain / RAG Orchestrator', type: 'microservice', importance: 3, description: 'Hybrid search, query decomposition and prompt re-ranking', position3D: { x: 0, y: 0, z: 6 }, x2D: 450, y2D: 300 },
        { id: 'rag-embeddings', name: 'Embedding Generator (text-embedding-004)', type: 'model-gateway', importance: 3, description: '768-dimensional dense vector generator', position3D: { x: -8, y: 0, z: 0 }, x2D: 220, y2D: 420 },
        { id: 'rag-vector', name: 'Qdrant Vector Database', type: 'database', importance: 2, description: 'HNSW index vector store with metadata filtering', position3D: { x: -8, y: 0, z: -8 }, x2D: 220, y2D: 550 },
        { id: 'rag-gemini', name: 'Google Gemini 2.5 Flash LLM', type: 'model-gateway', importance: 2, description: 'Fast multimodal reasoning, function calling and synthesis', position3D: { x: 8, y: 0, z: -2 }, x2D: 680, y2D: 420 },
        { id: 'rag-cache', name: 'Semantic Response Cache (Redis)', type: 'server', importance: 1, description: 'Zero-latency cached responses for frequent architectural queries', position3D: { x: 8, y: 0, z: -10 }, x2D: 680, y2D: 550 },
      ],
      connections: [
        { id: 'rc1', source: 'rag-user', target: 'rag-gateway', type: 'sync', label: 'SSE Stream', protocol: 'HTTPS' },
        { id: 'rc2', source: 'rag-gateway', target: 'rag-engine', type: 'sync', label: 'Prompt Pipeline', protocol: 'HTTP/2' },
        { id: 'rc3', source: 'rag-engine', target: 'rag-embeddings', type: 'sync', label: 'Vectorize Query', protocol: 'REST' },
        { id: 'rc4', source: 'rag-embeddings', target: 'rag-vector', type: 'sync', label: 'Cosine Similarity Query', protocol: 'gRPC' },
        { id: 'rc5', source: 'rag-vector', target: 'rag-engine', type: 'sync', label: 'Relevant Context Chunks', protocol: 'gRPC' },
        { id: 'rc6', source: 'rag-engine', target: 'rag-gemini', type: 'sync', label: 'Context + System Prompt', protocol: 'HTTPS' },
        { id: 'rc7', source: 'rag-gemini', target: 'rag-cache', type: 'async', label: 'Cache Output', protocol: 'TCP' },
      ],
    },
  };

  // 4. Event-Driven Microservices
  const eventTemplate = {
    name: 'Serverless Event-Driven E-Commerce Infrastructure',
    description: 'High-throughput event sourcing architecture utilizing Amazon EventBridge, distributed SQS queues, serverless Lambda processors, and DynamoDB single-table design.',
    category: 'microservices',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60',
    isPublic: true,
    downloadsCount: 167,
    data: {
      nodes: [
        { id: 'ed-client', name: 'Checkout Frontend Client', type: 'client', importance: 5, description: 'Next.js checkout flow', position3D: { x: 0, y: 0, z: 20 }, x2D: 450, y2D: 80 },
        { id: 'ed-api', name: 'API Gateway HTTP API', type: 'gateway', importance: 4, description: 'Lightweight low-latency API entry point', position3D: { x: 0, y: 0, z: 12 }, x2D: 450, y2D: 200 },
        { id: 'ed-bus', name: 'Amazon EventBridge Event Bus', type: 'queue', importance: 3, description: 'Central routing fabric filtering and matching architectural events', position3D: { x: 0, y: 0, z: 4 }, x2D: 450, y2D: 320 },
        { id: 'ed-queue-orders', name: 'Orders SQS FIFO Queue', type: 'queue', importance: 3, description: 'Guarantees strictly once in-order processing', position3D: { x: -8, y: 0, z: -4 }, x2D: 250, y2D: 440 },
        { id: 'ed-queue-pay', name: 'Payment SQS Queue', type: 'queue', importance: 3, description: 'Buffers transactions against payment gateway rate limits', position3D: { x: 8, y: 0, z: -4 }, x2D: 650, y2D: 440 },
        { id: 'ed-lambda', name: 'Serverless Order Worker (Lambda)', type: 'microservice', importance: 2, description: 'Scales from 0 to 10k concurrent executions', position3D: { x: -8, y: 0, z: -12 }, x2D: 250, y2D: 570 },
        { id: 'ed-dynamo', name: 'Amazon DynamoDB (Global Table)', type: 'database', importance: 1, description: 'Single-digit millisecond latency single-table key-value store', position3D: { x: 0, y: 0, z: -16 }, x2D: 450, y2D: 620 },
      ],
      connections: [
        { id: 'ec1', source: 'ed-client', target: 'ed-api', type: 'sync', label: 'POST /orders', protocol: 'HTTPS' },
        { id: 'ec2', source: 'ed-api', target: 'ed-bus', type: 'async', label: 'Publish OrderEvent', protocol: 'AWS SDK' },
        { id: 'ec3', source: 'ed-bus', target: 'ed-queue-orders', type: 'async', label: 'Route: order.created', protocol: 'SQS' },
        { id: 'ec4', source: 'ed-bus', target: 'ed-queue-pay', type: 'async', label: 'Route: payment.process', protocol: 'SQS' },
        { id: 'ec5', source: 'ed-queue-orders', target: 'ed-lambda', type: 'sync', label: 'Event Source Mapping', protocol: 'Batch' },
        { id: 'ec6', source: 'ed-lambda', target: 'ed-dynamo', type: 'sync', label: 'PutItem Transaction', protocol: 'HTTPS' },
      ],
    },
  };

  // 5. IoT Smart Factory Digital Twin
  const iotTemplate = {
    name: 'IoT Smart Factory & Industrial Digital Twin',
    description: 'Real-time telemetry pipeline capturing sensor metrics from CNC machines and robotic arms via MQTT, streaming into TimescaleDB with 3D telemetry visualization.',
    category: 'iot',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=60',
    isPublic: true,
    downloadsCount: 84,
    data: {
      nodes: [
        { id: 'iot-sensors', name: 'Industrial ESP32 & Vibration Sensors', type: 'device', importance: 5, description: 'Calibrated factory floor telemetry collection nodes', position3D: { x: -8, y: 0, z: 20 }, x2D: 250, y2D: 90 },
        { id: 'iot-robots', name: 'Robotic Assembly Arms (PLC)', type: 'device', importance: 5, description: 'Autonomous factory manipulators with CAN bus interfaces', position3D: { x: 8, y: 0, z: 20 }, x2D: 650, y2D: 90 },
        { id: 'iot-edge', name: 'Edge Gateway & MQTT Broker (EMQX)', type: 'gateway', importance: 4, description: 'High concurrency local MQTT ingestion and protocol normalization', position3D: { x: 0, y: 0, z: 12 }, x2D: 450, y2D: 220 },
        { id: 'iot-stream', name: 'Kafka / Redpanda Real-Time Stream', type: 'queue', importance: 3, description: '100,000 events/second fault-tolerant ingestion buffer', position3D: { x: 0, y: 0, z: 4 }, x2D: 450, y2D: 340 },
        { id: 'iot-timescale', name: 'TimescaleDB (Hypertable)', type: 'database', importance: 2, description: 'Time-series optimized PostgreSQL engine for sensor aggregates', position3D: { x: -6, y: 0, z: -6 }, x2D: 320, y2D: 480 },
        { id: 'iot-digitaltwin', name: '3D Live Ops Digital Twin Canvas', type: 'bi-dashboard', importance: 1, description: 'Real-time WebGL twin highlighting faulty nodes with red pulsating alerts', position3D: { x: 6, y: 0, z: -6 }, x2D: 580, y2D: 480 },
      ],
      connections: [
        { id: 'ic1', source: 'iot-sensors', target: 'iot-edge', type: 'wireless', label: 'MQTT over TLS', protocol: 'MQTT' },
        { id: 'ic2', source: 'iot-robots', target: 'iot-edge', type: 'sync', label: 'OPC-UA / Modbus', protocol: 'TCP' },
        { id: 'ic3', source: 'iot-edge', target: 'iot-stream', type: 'async', label: 'Publish Telemetry', protocol: 'Kafka Wire' },
        { id: 'ic4', source: 'iot-stream', target: 'iot-timescale', type: 'sync', label: 'Continuous Aggregates', protocol: 'PostgreSQL' },
        { id: 'ic5', source: 'iot-timescale', target: 'iot-digitaltwin', type: 'sync', label: 'WebSocket Stream', protocol: 'WSS' },
      ],
    },
  };

  const templates = [awsTemplate, k8sTemplate, ragTemplate, eventTemplate, iotTemplate];

  for (const t of templates) {
    const existing = await prisma.diagramTemplate.findFirst({
      where: { name: t.name },
    });

    if (!existing) {
      await prisma.diagramTemplate.create({
        data: {
          name: t.name,
          description: t.description,
          category: t.category,
          thumbnailUrl: t.thumbnailUrl,
          isPublic: t.isPublic,
          downloadsCount: t.downloadsCount,
          data: t.data,
        },
      });
      console.log(`✅ Seeded template: ${t.name}`);
    } else {
      console.log(`⚡ Template already exists: ${t.name}`);
    }
  }

  console.log('🎉 Database seed completed successfully with 5 official architectural templates!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
