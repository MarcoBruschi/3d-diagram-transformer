import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { Diagram, DiagramNode, DiagramConnection } from '@/types/diagram';
import { NODE_VISUALS } from '@/lib/mappings/nodeTypes';

export type DiagramData = Diagram;

/**
 * Exports a diagram into a real 3D .GLB binary file using Three.js GLTFExporter.
 * Builds an independent Three.js scene containing PBR node meshes, curved 3D connection
 * tubes, and realistic studio lighting. Automatically triggers a client-side file download.
 *
 * @param diagram The diagram data to export (nodes, connections, name)
 * @param fileName Optional custom filename (e.g. 'architecture.glb')
 * @returns Promise resolving to the binary GLB Blob
 */
export async function exportDiagramToGLB(
  diagram: DiagramData,
  fileName?: string
): Promise<Blob> {
  // 1. Build an isolated Three.js Scene for Export
  const exportScene = new THREE.Scene();
  exportScene.name = diagram.name || 'PRISM';

  // 2. Add realistic studio lighting so the GLB renders beautifully in any 3D viewer
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  ambientLight.name = 'AmbientLight';
  exportScene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.name = 'KeyLight';
  keyLight.position.set(8, 14, 10);
  exportScene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
  fillLight.name = 'FillLight';
  fillLight.position.set(-8, 6, -8);
  exportScene.add(fillLight);

  // 3. Render 3D Node Meshes
  const nodePositionMap = new Map<string, THREE.Vector3>();

  diagram.nodes.forEach((node: DiagramNode) => {
    const visual = NODE_VISUALS[node.type] || NODE_VISUALS.generic;
    const baseColorHex = visual?.color || '#38BDF8';
    const color = new THREE.Color(baseColorHex);

    const pos = node.position3D || { x: 0, y: 0, z: 0 };
    const positionVec = new THREE.Vector3(pos.x, pos.y, pos.z);
    nodePositionMap.set(node.id, positionVec);

    // Differentiate geometry based on node role / type
    let geometry: THREE.BufferGeometry;
    const isDatabase =
      node.type.includes('database') ||
      node.type.includes('storage') ||
      node.type.includes('redis') ||
      node.type.includes('s3') ||
      node.type.includes('lakehouse') ||
      node.layer === 'database';

    const isUserOrClient =
      node.type.includes('user') ||
      node.type.includes('actor') ||
      node.type.includes('client') ||
      node.layer === 'user';

    const isAI =
      node.type.includes('ai') ||
      node.type.includes('llm') ||
      node.type.includes('neural') ||
      node.type.includes('model');

    if (isDatabase) {
      geometry = new THREE.CylinderGeometry(0.85, 0.85, 1.2, 32);
    } else if (isUserOrClient) {
      geometry = new THREE.SphereGeometry(0.75, 24, 24);
    } else if (isAI) {
      geometry = new THREE.OctahedronGeometry(0.9, 1);
    } else {
      geometry = new THREE.BoxGeometry(1.6, 1.0, 1.6);
    }

    // High quality PBR Material
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      metalness: 0.4,
      emissive: color.clone().multiplyScalar(0.2),
      name: `mat_${node.id}`,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(positionVec);
    mesh.name = node.name || `Node_${node.id}`;
    mesh.userData = {
      id: node.id,
      name: node.name,
      type: node.type,
      status: node.status,
      description: node.description || '',
      layer: node.layer || 'software',
    };

    exportScene.add(mesh);
  });

  // 4. Render 3D Curved Connection Tubes
  diagram.connections.forEach((conn: DiagramConnection) => {
    const p1 = nodePositionMap.get(conn.source);
    const p2 = nodePositionMap.get(conn.target);

    if (p1 && p2) {
      // Natural 3D Bezier curve between nodes
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      mid.y += 0.4;
      mid.z += 0.15;

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const tubeGeometry = new THREE.TubeGeometry(curve, 24, 0.05, 8, false);

      const tubeMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#38BDF8'),
        roughness: 0.25,
        metalness: 0.5,
        emissive: new THREE.Color('#0284C7'),
        emissiveIntensity: 0.6,
        name: `conn_mat_${conn.id}`,
      });

      const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
      tubeMesh.name = conn.label
        ? `Conn_${conn.label}`
        : `Conn_${conn.source}_to_${conn.target}`;
      tubeMesh.userData = {
        id: conn.id,
        source: conn.source,
        target: conn.target,
        label: conn.label || '',
        protocol: conn.protocol || '',
      };

      exportScene.add(tubeMesh);
    }
  });

  // 5. Execute GLTFExporter to generate binary .GLB ArrayBuffer
  const exporter = new GLTFExporter();

  return new Promise<Blob>((resolve, reject) => {
    exporter.parse(
      exportScene,
      (result) => {
        let blob: Blob;

        if (result instanceof ArrayBuffer) {
          blob = new Blob([result], { type: 'model/gltf-binary' });
        } else {
          const jsonStr = JSON.stringify(result, null, 2);
          blob = new Blob([jsonStr], { type: 'model/gltf+json' });
        }

        // Automatic download trigger in browser environment
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const rawName =
            fileName ||
            `${(diagram.name || 'architecture').toLowerCase().replace(/\s+/g, '-')}.glb`;
          const finalFileName = rawName.endsWith('.glb') ? rawName : `${rawName}.glb`;

          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = finalFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
        }

        resolve(blob);
      },
      (error) => {
        console.error('[exportDiagramToGLB Error]:', error);
        reject(error);
      },
      {
        binary: true,
        embedImages: true,
        onlyVisible: true,
      }
    );
  });
}
