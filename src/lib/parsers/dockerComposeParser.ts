import { sanitizeText } from '@/lib/security/sanitizer';

export interface ParsedService {
  name: string;
  image?: string;
  build?: string;
  container_name?: string;
  depends_on: string[];
  links: string[];
  networks: string[];
  ports: string[];
}

export type DockerNodeType = 'database' | 'backend' | 'frontend' | 'queue' | 'service';

/**
 * Sanitizes strings with strict tag and attribute stripping.
 */
export function sanitizeYamlText(value: string | undefined | null): string {
  if (!value || typeof value !== 'string') return '';
  return sanitizeText(value);
}

/**
 * Validates YAML text to prevent recursion bombs, huge payloads, or unsafe script injections.
 */
export function validateYamlSafety(yamlText: string): boolean {
  if (!yamlText || typeof yamlText !== 'string') {
    throw new Error('Conteúdo YAML inválido');
  }
  if (yamlText.length > 1024 * 1024) {
    throw new Error('O arquivo Docker Compose excede o tamanho máximo permitido de 1MB.');
  }
  // Protect against billion laughs / recursive anchors / expansive aliases
  const anchorCount = (yamlText.match(/&[a-zA-Z0-9_-]+/g) || []).length;
  const aliasCount = (yamlText.match(/\*[a-zA-Z0-9_-]+/g) || []).length;
  if (
    (anchorCount >= 2 && aliasCount >= 2) ||
    anchorCount > 5 ||
    aliasCount > 5 ||
    /!\w+/i.test(yamlText) ||
    /(&[a-zA-Z0-9_-]+)[\s\S]*?\*\1[\s\S]*?&/i.test(yamlText)
  ) {
    throw new Error('Conteúdo YAML contém entidades ou referências recursivas inseguras.');
  }
  return true;
}

/**
 * Determines node type heuristically from service name and container image:
 * - 'db', 'postgres', 'redis', 'mysql', 'mongo', 'mariadb', 'sqlite', 'cockroach', 'cassandra', 'elastic' -> 'database'
 * - 'web', 'ui', 'frontend', 'client', 'spa', 'nginx', 'caddy', 'react', 'next' -> 'frontend'
 * - 'queue', 'kafka', 'rabbit', 'sqs', 'pubsub', 'celery', 'nats' -> 'queue'
 * - 'api', 'server', 'backend', 'app', 'core', 'graphql' -> 'backend'
 * - default -> 'service'
 */
export function inferDockerServiceType(name: string, image?: string): DockerNodeType {
  const target = `${name.toLowerCase()} ${(image || '').toLowerCase()}`;

  // Database heuristic
  if (
    target.includes('db') ||
    target.includes('postgres') ||
    target.includes('redis') ||
    target.includes('mysql') ||
    target.includes('mongo') ||
    target.includes('mariadb') ||
    target.includes('sqlite') ||
    target.includes('cockroach') ||
    target.includes('cassandra') ||
    target.includes('elastic')
  ) {
    return 'database';
  }

  // Frontend heuristic
  if (
    target.includes('web') ||
    target.includes('ui') ||
    target.includes('frontend') ||
    target.includes('client') ||
    target.includes('nginx') ||
    target.includes('caddy') ||
    target.includes('spa') ||
    target.includes('react') ||
    target.includes('next')
  ) {
    return 'frontend';
  }

  // Queue heuristic
  if (
    target.includes('queue') ||
    target.includes('kafka') ||
    target.includes('rabbit') ||
    target.includes('sqs') ||
    target.includes('pubsub') ||
    target.includes('celery') ||
    target.includes('nats')
  ) {
    return 'queue';
  }

  // Backend heuristic
  if (
    target.includes('api') ||
    target.includes('server') ||
    target.includes('backend') ||
    target.includes('app') ||
    target.includes('service') ||
    target.includes('core') ||
    target.includes('graphql')
  ) {
    return 'backend';
  }

  return 'service';
}

/**
 * Robust line-by-line YAML parser for Docker Compose files without requiring heavy external dependencies.
 * Extracts all services, images, dependencies, links, networks, and ports.
 */
export function parseRawDockerComposeServices(yamlText: string): Map<string, ParsedService> {
  const servicesMap = new Map<string, ParsedService>();
  const rawLines = yamlText.split(/\r?\n/);

  let inServicesBlock = false;
  let servicesBaseIndent = 0;
  let currentServiceName: string | null = null;
  let currentServiceIndent = 0;
  let currentSubSection: string | null = null;
  let subSectionIndent = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    
    // Remove comments and trim trailing whitespace
    const lineWithoutComment = rawLine.replace(/#.*$/, '').trimEnd();
    if (!lineWithoutComment.trim()) continue;

    const indent = lineWithoutComment.search(/\S/);
    const trimmed = lineWithoutComment.trim();

    // Check entry into top-level 'services:'
    if (!inServicesBlock) {
      const servicesMatch = trimmed.match(/^services\s*:\s*$/);
      if (servicesMatch) {
        inServicesBlock = true;
        servicesBaseIndent = indent;
        continue;
      }
    } else {
      // If we are in services block and encounter a new top-level unindented block (e.g. version:, networks:, volumes:)
      if (indent <= servicesBaseIndent && /^[a-zA-Z0-9_-]+\s*:\s*.*$/.test(trimmed) && !trimmed.startsWith('-')) {
        inServicesBlock = false;
        currentServiceName = null;
        currentSubSection = null;
        continue;
      }

      // Inside services block: check for service declaration (e.g., '  web:')
      if (!currentServiceName || indent <= currentServiceIndent) {
        const serviceHeaderMatch = trimmed.match(/^["']?([^"':\r\n]+)["']?\s*:\s*$/);
        if (serviceHeaderMatch && indent > servicesBaseIndent) {
          const rawName = serviceHeaderMatch[1].trim();
          const cleanName = sanitizeYamlText(rawName);
          if (!cleanName) continue;
          currentServiceName = cleanName;
          currentServiceIndent = indent;
          currentSubSection = null;

          if (!servicesMap.has(currentServiceName)) {
            servicesMap.set(currentServiceName, {
              name: currentServiceName,
              depends_on: [],
              links: [],
              networks: [],
              ports: [],
            });
          }
          continue;
        }
      }

      // Inside a specific service
      if (currentServiceName && indent > currentServiceIndent) {
        const svc = servicesMap.get(currentServiceName)!;

        // Check for sub-section headers (e.g. '    depends_on:', '    links:', '    networks:', '    ports:')
        const subSectionMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
        if (subSectionMatch) {
          const key = subSectionMatch[1].toLowerCase();
          const inlineVal = subSectionMatch[2].trim();

          if (key === 'image' && inlineVal) {
            svc.image = sanitizeYamlText(inlineVal.replace(/['"]/g, ''));
            currentSubSection = null;
            continue;
          } else if (key === 'container_name' && inlineVal) {
            svc.container_name = sanitizeYamlText(inlineVal.replace(/['"]/g, ''));
            currentSubSection = null;
            continue;
          } else if (key === 'build' && inlineVal) {
            svc.build = sanitizeYamlText(inlineVal.replace(/['"]/g, ''));
            currentSubSection = null;
            continue;
          } else if (['depends_on', 'links', 'networks', 'ports'].includes(key)) {
            currentSubSection = key;
            subSectionIndent = indent;

            // Handle inline array syntax: depends_on: [db, redis]
            if (inlineVal.startsWith('[') && inlineVal.endsWith(']')) {
              const items = inlineVal
                .slice(1, -1)
                .split(',')
                .map((s) => sanitizeYamlText(s.replace(/['"]/g, '')))
                .filter(Boolean);
              if (key === 'depends_on') svc.depends_on.push(...items);
              if (key === 'links') svc.links.push(...items.map((l) => l.split(':')[0]));
              if (key === 'networks') svc.networks.push(...items);
              if (key === 'ports') svc.ports.push(...items);
              currentSubSection = null;
            }
            continue;
          } else {
            currentSubSection = null;
          }
        }

        // Inside a sub-section (depends_on, links, networks, ports)
        if (currentSubSection && indent > subSectionIndent) {
          // List item syntax: - db or - "db"
          if (trimmed.startsWith('-')) {
            const rawVal = trimmed.replace(/^-\s*/, '').replace(/['"]/g, '').trim();
            const val = sanitizeYamlText(rawVal);
            if (val) {
              if (currentSubSection === 'depends_on') svc.depends_on.push(val);
              else if (currentSubSection === 'links') svc.links.push(val.split(':')[0]);
              else if (currentSubSection === 'networks') svc.networks.push(val);
              else if (currentSubSection === 'ports') svc.ports.push(val);
            }
          } else {
            // Dictionary syntax in depends_on: db: condition: service_healthy
            const dictKeyMatch = trimmed.match(/^["']?([^"':\r\n]+)["']?\s*:/);
            if (dictKeyMatch && currentSubSection === 'depends_on') {
              const depName = sanitizeYamlText(dictKeyMatch[1]);
              if (depName && !svc.depends_on.includes(depName)) {
                svc.depends_on.push(depName);
              }
            } else if (dictKeyMatch && currentSubSection === 'networks') {
              const netName = sanitizeYamlText(dictKeyMatch[1]);
              if (netName && !svc.networks.includes(netName)) {
                svc.networks.push(netName);
              }
            }
          }
        }
      }
    }
  }

  return servicesMap;
}

/**
 * Parses Docker Compose YAML content into 3D Diagram format.
 * - Extracts services and infers types (database, backend, frontend, queue, service).
 * - Maps depends_on, links, and shared networks to connections.
 * - Positions nodes in 3D space with spatial depth layering (frontend: z=-3, backend: z=0, db: z=3).
 */
export function parseDockerComposeToDiagram(yamlText: string): { nodes: any[]; connections: any[] } {
  validateYamlSafety(yamlText);
  const servicesMap = parseRawDockerComposeServices(yamlText);

  if (servicesMap.size === 0) {
    return { nodes: [], connections: [] };
  }

  // Spatial layer depth configurations
  const LAYER_SPECS: Record<DockerNodeType, { z: number; y: number; layer: string }> = {
    frontend: { z: -3.0, y: 1.5, layer: 'user' },
    backend: { z: 0.0, y: 0.5, layer: 'software' },
    service: { z: 0.0, y: 0.5, layer: 'software' },
    queue: { z: 1.8, y: -0.5, layer: 'network' },
    database: { z: 3.0, y: -1.5, layer: 'database' },
  };

  // Group services by inferred type
  const typeBuckets: Record<DockerNodeType, ParsedService[]> = {
    frontend: [],
    backend: [],
    service: [],
    queue: [],
    database: [],
  };

  for (const svc of servicesMap.values()) {
    const inferred = inferDockerServiceType(svc.name, svc.image);
    typeBuckets[inferred].push(svc);
  }

  const nodes: any[] = [];
  const connections: any[] = [];
  const connectionSet = new Set<string>();

  // Distribute nodes in 3D space by spatial layer
  const order: DockerNodeType[] = ['frontend', 'backend', 'service', 'queue', 'database'];

  for (const type of order) {
    const bucket = typeBuckets[type];
    const spec = LAYER_SPECS[type];
    const count = bucket.length;
    const spacingX = count > 3 ? 3.0 : 3.6;

    bucket.forEach((svc, index) => {
      const x = count === 1 ? 0 : -((count - 1) * spacingX) / 2 + index * spacingX;
      const y = spec.y + (index % 2 === 1 ? 0.3 : 0); // slight elevation jitter to avoid line-of-sight occlusion
      const z = spec.z;

      // 2D position centered at (400, 300)
      const posX2D = Math.round(400 + x * 45);
      const posY2D = Math.round(150 + (z + 3) * 65);

      const rawId = svc.name;
      const rawName = svc.container_name || svc.name;
      const safeId = sanitizeYamlText(rawId) || `service_${index}`;
      const safeName = sanitizeYamlText(rawName) || `Service ${index + 1}`;
      const safeImage = sanitizeYamlText(svc.image || '');
      const rawDesc = svc.image ? `Docker Image: ${svc.image}` : `Docker service ${svc.name}`;
      const safeDesc = sanitizeYamlText(rawDesc);

      nodes.push({
        id: safeId,
        name: safeName,
        type,
        layer: spec.layer,
        status: 'active',
        description: safeDesc,
        importance: type === 'frontend' ? 5 : type === 'backend' ? 4 : type === 'service' ? 3 : type === 'queue' ? 2 : 1,
        position3D: { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), z: Number(z.toFixed(2)) },
        position2D: { x: posX2D, y: posY2D },
        properties: {
          image: safeImage,
          ports: svc.ports.map((p) => sanitizeYamlText(p)),
          networks: svc.networks.map((n) => sanitizeYamlText(n)),
          dependsOn: svc.depends_on.map((d) => sanitizeYamlText(d)),
          containerName: sanitizeYamlText(svc.container_name || svc.name),
        },
        metrics: {
          statusText: 'Running',
          replicas: 1,
        },
      });
    });
  }

  // Helper to add unique connections
  const addConnection = (source: string, target: string, type: string, label: string, protocol = 'TCP') => {
    if (!servicesMap.has(source) || !servicesMap.has(target) || source === target) return;
    const safeSource = sanitizeYamlText(source);
    const safeTarget = sanitizeYamlText(target);
    const safeLabel = sanitizeYamlText(label);
    const key = `${safeSource}->${safeTarget}:${safeLabel}`;
    if (connectionSet.has(key)) return;
    connectionSet.add(key);

    connections.push({
      id: `conn_${safeSource}_${safeTarget}_${type}`,
      source: safeSource,
      target: safeTarget,
      type,
      label: safeLabel,
      protocol,
      trafficRate: 5,
    });
  };

  // Map dependencies and links to 3D connections
  for (const svc of servicesMap.values()) {
    // 1. depends_on
    for (const dep of svc.depends_on) {
      addConnection(svc.name, dep, 'dependency', 'depends on');
    }

    // 2. links
    for (const link of svc.links) {
      addConnection(svc.name, link, 'link', 'links to');
    }
  }

  // 3. Shared non-default networks: connect services on custom networks
  const networkToServices = new Map<string, string[]>();
  for (const svc of servicesMap.values()) {
    for (const net of svc.networks) {
      if (net === 'default') continue;
      if (!networkToServices.has(net)) {
        networkToServices.set(net, []);
      }
      networkToServices.get(net)!.push(svc.name);
    }
  }

  for (const [netName, netServices] of networkToServices.entries()) {
    if (netServices.length >= 2 && netServices.length <= 6) {
      for (let i = 0; i < netServices.length - 1; i++) {
        const s1 = netServices[i];
        const s2 = netServices[i + 1];
        addConnection(s1, s2, 'network-flow', netName);
      }
    }
  }

  return { nodes, connections };
}

/**
 * Standard diagram wrapper function for backward compatibility.
 */
export function parseDockerCompose(yamlText: string, name = 'Docker Compose Architecture') {
  validateYamlSafety(yamlText);
  const result = parseDockerComposeToDiagram(yamlText);
  return {
    name,
    description: 'Arquitetura gerada a partir de arquivo Docker Compose',
    nodes: result.nodes,
    connections: result.connections,
  };
}
