'use client';

import React, { useRef } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { DiagramNode } from '@/types/diagram';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useCameraStore } from '@/store/useCameraStore';
import { NODE_VISUALS } from '@/lib/mappings/nodeTypes';
import { NodeLabel } from './NodeLabel';

import { ServerRackModel } from '../Models/ServerRackModel';
import { DatabaseModel } from '../Models/DatabaseModel';
import { WorkstationModel } from '../Models/WorkstationModel';
import { CloudModel } from '../Models/CloudModel';
import { RouterModel } from '../Models/RouterModel';
import { ApiGatewayModel } from '../Models/ApiGatewayModel';
import { MicroserviceModel } from '../Models/MicroserviceModel';
import { QueueModel } from '../Models/QueueModel';
import { UserModel } from '../Models/UserModel';
import { GenericNodeModel } from '../Models/GenericNodeModel';
import { UMLClassModel } from '../Models/UMLClassModel';
import { NeuralNetworkModel } from '../Models/NeuralNetworkModel';
import { IoTBoardModel } from '../Models/IoTBoardModel';
import { DataLakehouseModel } from '../Models/DataLakehouseModel';
import { BPMNGatewayModel } from '../Models/BPMNGatewayModel';
import { UMLComponentModel } from '../Models/UMLComponentModel';
import { InterfaceLollipopModel } from '../Models/InterfaceLollipopModel';
import { Controller3DModel } from '../Models/Controller3DModel';
import { SecurityVaultModel } from '../Models/SecurityVaultModel';
import { useLiveMonitoringStore } from '@/store/useLiveMonitoringStore';
import { useFeatureGating } from '@/hooks/useFeatureGating';

interface NodeMeshProps {
  node: DiagramNode;
}

export function NodeMesh({ node }: NodeMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const selectedNodeId = useDiagramStore((s) => s.selectedNodeId);
  const hoveredNodeId = useDiagramStore((s) => s.hoveredNodeId);
  const selectNode = useDiagramStore((s) => s.selectNode);
  const hoverNode = useDiagramStore((s) => s.hoverNode);
  const updateNodePosition3D = useDiagramStore((s) => s.updateNodePosition3D);
  const setIsDraggingNode = useDiagramStore((s) => s.setIsDraggingNode);
  const focusOnNode = useCameraStore((s) => s.focusOnNode);
  const isFreeCamera = useCameraStore((s) => s.isFreeCamera);
  const viewMode = useDiagramStore((s) => s.viewMode);
  const connectingSourceId = useDiagramStore((s) => s.connectingSourceId);
  const setConnectingSourceId = useDiagramStore((s) => s.setConnectingSourceId);
  const addConnection = useDiagramStore((s) => s.addConnection);

  const isMonitoringActive = useLiveMonitoringStore((s) => s.isMonitoringActive);
  const alerts = useLiveMonitoringStore((s) => s.alerts);
  const telemetryRingRef = useRef<THREE.Mesh>(null);
  const { canEdit } = useFeatureGating();

  const isSelected = selectedNodeId === node.id;
  const isHovered = hoveredNodeId === node.id;

  const matchedAlert = alerts.find(
    (a) =>
      a.nodeName.toLowerCase().includes(node.name.toLowerCase()) ||
      node.name.toLowerCase().includes(a.nodeName.toLowerCase())
  );
  const telemetryStatus: 'critical' | 'warning' | 'healthy' | null = isMonitoringActive
    ? matchedAlert?.severity === 'critical' || node.status === 'error'
      ? 'critical'
      : matchedAlert?.severity === 'warning' || node.status === 'warning'
      ? 'warning'
      : 'healthy'
    : null;

  const visual = NODE_VISUALS[node.type] || NODE_VISUALS.generic;
  const pos = node.position3D || { x: 0, y: 0, z: 0 };

  // 3D Dragging State Refs
  const isDraggingRef = useRef(false);
  const dragPlane = useRef(new THREE.Plane());
  const planeIntersectPoint = useRef(new THREE.Vector3());
  const dragOffset = useRef(new THREE.Vector3());
  const hasMovedRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });

  // Idle floating phase based on node id hash
  const phase = (node.id.charCodeAt(0) * 0.5) % Math.PI;

  // Kinetic & physics refs for high-end micro-interactions
  const currentLiftRef = useRef(0);
  const reboundScaleRef = useRef(1.0);
  const reboundVelocityRef = useRef(0);
  const shadowRef = useRef<THREE.Mesh>(null);
  const shockwaveRingRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // 1. Spring-lift interpolation on hover
    const targetLift = isHovered && !isDraggingRef.current ? 0.22 : 0;
    currentLiftRef.current += (targetLift - currentLiftRef.current) * Math.min(delta * 10, 1);

    // 2. Elastic rebound dampening
    reboundScaleRef.current += reboundVelocityRef.current;
    reboundVelocityRef.current += (1.0 - reboundScaleRef.current) * 0.28;
    reboundVelocityRef.current *= 0.72; // friction/damping

    // 3. Composite Y positioning
    let yOffset = 0;
    if (!isDraggingRef.current && !isSelected) {
      yOffset = Math.sin(t * 1.5 + phase) * 0.08;
    }
    const finalY = pos.y + yOffset + currentLiftRef.current;

    if (groupRef.current) {
      groupRef.current.position.set(pos.x, finalY, pos.z);
      const s = isHovered ? reboundScaleRef.current * 1.04 : reboundScaleRef.current;
      groupRef.current.scale.set(s, s, s);
    }

    // 4. Dynamic ground contact shadow projected onto CAD grid (Y = -3.48)
    if (shadowRef.current) {
      const distFromFloor = Math.max(0.2, finalY - (-3.48));
      shadowRef.current.position.y = -3.48 - finalY;
      const shadowScale = Math.min(1.8, 0.85 + distFromFloor * 0.08);
      shadowRef.current.scale.set(shadowScale, shadowScale, shadowScale);
      const shadowMat = shadowRef.current.material as THREE.MeshBasicMaterial;
      if (shadowMat) {
        shadowMat.opacity = Math.max(0.04, 0.28 - distFromFloor * 0.04);
      }
    }

    // 5. Telemetry pulse & shockwave ring
    if (telemetryRingRef.current && telemetryStatus) {
      if (telemetryStatus === 'critical') {
        const s = 1.0 + Math.sin(t * 6) * 0.25;
        telemetryRingRef.current.scale.set(s, s, s);
      } else if (telemetryStatus === 'warning') {
        const s = 1.0 + Math.sin(t * 3) * 0.12;
        telemetryRingRef.current.scale.set(s, s, s);
      } else {
        telemetryRingRef.current.scale.set(1.0, 1.0, 1.0);
      }
    }

    // 6. Expanding shockwave ring for alert signals
    if (shockwaveRingRef.current && (telemetryStatus === 'critical' || telemetryStatus === 'warning')) {
      const shockwaveProg = (t * 1.4) % 1; // 0 to 1
      const s = 1.0 + shockwaveProg * 1.3;
      shockwaveRingRef.current.scale.set(s, s, s);
      const mat = shockwaveRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (1 - shockwaveProg) * 0.7;
      }
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;

    // Movement is ONLY allowed in builder mode (viewMode === 'editor') and if user can edit
    if (viewMode !== 'editor' || !canEdit) {
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = true;

    // Create a plane parallel to the camera view passing through the node's position
    const normal = new THREE.Vector3();
    camera.getWorldDirection(normal).negate();
    dragPlane.current.setFromNormalAndCoplanarPoint(normal, new THREE.Vector3(pos.x, pos.y, pos.z));

    if (e.ray.intersectPlane(dragPlane.current, planeIntersectPoint.current)) {
      dragOffset.current.subVectors(planeIntersectPoint.current, new THREE.Vector3(pos.x, pos.y, pos.z));
    } else {
      dragOffset.current.set(0, 0, 0);
    }

    setIsDraggingNode(true);
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDraggingRef.current || viewMode !== 'editor') return;
    e.stopPropagation();

    const distSq = (e.clientX - pointerStartRef.current.x) ** 2 + (e.clientY - pointerStartRef.current.y) ** 2;
    if (distSq > 9) {
      hasMovedRef.current = true;
    }

    if (e.ray.intersectPlane(dragPlane.current, planeIntersectPoint.current)) {
      const newX = Math.round((planeIntersectPoint.current.x - dragOffset.current.x) * 10) / 10;
      const newY = Math.round((planeIntersectPoint.current.y - dragOffset.current.y) * 10) / 10;
      const newZ = Math.round((planeIntersectPoint.current.z - dragOffset.current.z) * 10) / 10;

      updateNodePosition3D(node.id, { x: newX, y: newY, z: newZ });
    }
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDraggingNode(false);
      (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
      reboundVelocityRef.current = -0.06; // subtle settling bounce on drop
    }

    document.body.style.cursor = isHovered ? (viewMode === 'editor' && canEdit ? 'grab' : 'pointer') : 'auto';

    const distSq = (e.clientX - pointerStartRef.current.x) ** 2 + (e.clientY - pointerStartRef.current.y) ** 2;
    // If movement was minimal (click rather than drag), execute node selection / connection
    if (distSq < 16) {
      reboundVelocityRef.current = 0.12; // satisfying tactile bounce on click
      // If we are in connecting mode in the builder, connect to this target node and open its editor!
      if (connectingSourceId) {
        if (connectingSourceId !== node.id) {
          addConnection({
            id: `conn-${connectingSourceId}-${node.id}-${Date.now()}`,
            source: connectingSourceId,
            target: node.id,
            type: 'association',
            trafficRate: 6,
            label: 'Link',
            style: 'solid',
          });
        }
        setConnectingSourceId(null);
        selectNode(node.id);
      } else {
        selectNode(node.id);
        if (!hasMovedRef.current && !isFreeCamera && viewMode !== 'editor') {
          focusOnNode(pos);
        }
      }
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoverNode(node.id);
    if (!isDraggingRef.current) {
      document.body.style.cursor = viewMode === 'editor' ? 'grab' : 'pointer';
    }
  };

  const handlePointerOut = () => {
    hoverNode(null);
    if (!isDraggingRef.current) {
      document.body.style.cursor = 'auto';
    }
  };

  const renderModel = () => {
    // Dynamically adjust node material color based on live telemetry status
    let activeColor = visual.color;
    if (telemetryStatus === 'critical' || node.status === 'error') {
      activeColor = '#EF4444'; // Red alert for active incidents
    } else if (telemetryStatus === 'warning' || node.status === 'warning') {
      activeColor = '#F59E0B'; // Amber alert for degradation
    }

    const props = {
      color: activeColor,
      isHovered,
      isSelected,
      status: node.status,
    };

    // 1. Analyze semantic context & stereotypes from diagrams
    const stereo = ((node.properties?.stereotype as string) || '').toLowerCase();
    const lowerName = node.name.toLowerCase();

    // UML Interface (Ball & Socket / Lollipop)
    if (
      node.type === 'uml-interface' ||
      node.type === 'provided-interface' ||
      node.type === 'required-interface' ||
      stereo === 'interface' ||
      lowerName.includes('interface')
    ) {
      return <InterfaceLollipopModel {...props} />;
    }

    // Controller Hardware / Embedded Unit
    if (
      node.type === 'uml-controller' ||
      node.type === 'controller' ||
      stereo === 'controller' ||
      lowerName.includes('controlador')
    ) {
      return <Controller3DModel {...props} />;
    }

    // Security & Cryptographic Vault
    if (
      node.type === 'security-module' ||
      node.type === 'secret-vault' ||
      stereo === 'secure' ||
      lowerName.includes('cripto') ||
      lowerName.includes('crypto')
    ) {
      return <SecurityVaultModel {...props} />;
    }

    // UML 2.0 Component (Classic dual-tab module)
    if (
      node.type === 'uml-component' ||
      node.type === 'executable' ||
      stereo === 'component' ||
      stereo === 'executable' ||
      String(node.properties?.rawStyle || '').includes('shape=module')
    ) {
      return <UMLComponentModel {...props} />;
    }

    switch (node.type) {
      // UML & Classes & Database Tables
      case 'uml-class':
      case 'uml-abstract-class':
      case 'uml-enum':
      case 'uml-datatype':
      case 'uml-primitive':
      case 'uml-object':
      case 'table':
      case 'entity':
        return <UMLClassModel {...props} />;

      // AI, LLM & Neural Networks
      case 'llm':
      case 'ai-agent':
      case 'ml-model':
      case 'neural-network':
      case 'inference':
      case 'ai-tool':
      case 'fine-tuning':
        return <NeuralNetworkModel {...props} />;

      // IoT, Hardware & Microcontrollers
      case 'esp32':
      case 'arduino':
      case 'raspberry-pi':
      case 'iot-device':
      case 'microcontroller':
      case 'embedded-system':
      case 'temperature-sensor':
      case 'humidity-sensor':
      case 'motion-sensor':
      case 'camera-sensor':
      case 'actuator':
      case 'motor':
      case 'relay':
      case 'plc':
        return <IoTBoardModel {...props} />;

      // Big Data, Lakehouse & Vector Databases
      case 'data-lakehouse':
      case 'data-lake':
      case 'data-warehouse':
      case 'vector-database':
      case 'embedding':
      case 'data-mart':
      case 'agent-memory':
        return <DataLakehouseModel {...props} />;

      // BPMN Gateways & Decisions
      case 'bpmn-exclusive-gateway':
      case 'bpmn-parallel-gateway':
      case 'bpmn-inclusive-gateway':
      case 'bpmn-complex-gateway':
      case 'bpmn-event-gateway':
      case 'decision':
        return <BPMNGatewayModel {...props} />;

      // Compute blades & racks
      case 'server':
      case 'server-rack':
      case 'blade-server':
      case 'gpu-cluster':
        return <ServerRackModel {...props} />;

      // Databases & SAN/NAS
      case 'database':
      case 'storage':
      case 'managed-database':
      case 'object-storage':
      case 'san':
      case 'nas':
        return <DatabaseModel {...props} />;

      // Workstations, screens, mobile
      case 'client':
      case 'laptop':
      case 'desktop':
      case 'mobile':
      case 'device':
      case 'bi-dashboard':
      case 'monitoring-dashboard':
        return <WorkstationModel {...props} />;

      // Cloud regions
      case 'cloud':
      case 'cloud-region':
      case 'vpc':
        return <CloudModel {...props} />;

      // Routers & Firewalls
      case 'router':
      case 'switch':
      case 'firewall':
      case 'waf':
      case 'vpn':
      case 'network-hub':
        return <RouterModel {...props} />;

      // Gateways & Ingress
      case 'gateway':
      case 'api':
      case 'load-balancer':
      case 'k8s-ingress':
      case 'model-gateway':
      case 'proxy':
      case 'reverse-proxy':
        return <ApiGatewayModel {...props} />;

      // Microservices & Logic
      case 'service':
      case 'microservice':
      case 'container':
      case 'docker':
      case 'kubernetes':
      case 'k8s-pod':
      case 'serverless-function':
      case 'authentication':
      case 'payment':
      case 'bpmn-task':
      case 'bpmn-service-task':
      case 'activity':
      case 'etl':
      case 'elt':
      case 'rag':
        return <MicroserviceModel {...props} />;

      // Queues & Streaming
      case 'queue':
      case 'kafka':
      case 'rabbitmq':
      case 'data-stream':
      case 'event-bus':
      case 'event-stream':
      case 'pubsub':
      case 'cache':
        return <QueueModel {...props} />;

      // Users & Actors
      case 'user':
      case 'actor':
      case 'secondary-actor':
      case 'customer':
      case 'employee':
      case 'manager':
        return <UserModel {...props} />;

      default:
        return <GenericNodeModel {...props} />;
    }
  };

  return (
    <group
      ref={groupRef}
      position={[pos.x, pos.y, pos.z]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* 3D Semantic Model */}
      {renderModel()}

      {/* Holographic Selection Brackets & 3D Gizmo */}
      {isSelected && (
        <group>
          {/* Wireframe Bounding Cube */}
          <mesh>
            <boxGeometry args={[1.8, 1.8, 1.8]} />
            <meshBasicMaterial color="#38BDF8" wireframe transparent opacity={0.35} />
          </mesh>
          {/* Corner Marker Accents */}
          {[-0.9, 0.9].map((x) =>
            [-0.9, 0.9].map((y) =>
              [-0.9, 0.9].map((z) => (
                <mesh key={`${x}-${y}-${z}`} position={[x, y, z]}>
                  <boxGeometry args={[0.08, 0.08, 0.08]} />
                  <meshBasicMaterial color="#38BDF8" />
                </mesh>
              ))
            )
          )}

          {/* Spatial Ground Positioning Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.95, 0]}>
            <ringGeometry args={[1.1, 1.18, 32]} />
            <meshBasicMaterial color="#38BDF8" transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>

          {/* 3D Axis Orientation Arrows (X: Red, Y: Green, Z: Blue) */}
          <group position={[0, 1.1, 0]}>
            {/* X axis indicator */}
            <mesh position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 0.8]} />
              <meshBasicMaterial color="#EF4444" />
            </mesh>
            {/* Y axis indicator */}
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.8]} />
              <meshBasicMaterial color="#10B981" />
            </mesh>
            {/* Z axis indicator */}
            <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.8]} />
              <meshBasicMaterial color="#3B82F6" />
            </mesh>
          </group>
        </group>
      )}

      {/* Dynamic Telemetry Status Halo & Pulsing Alarm Ring */}
      {telemetryStatus && (
        <group position={[0, -0.85, 0]}>
          <mesh ref={telemetryRingRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.2, 1.35, 32]} />
            <meshBasicMaterial
              color={
                telemetryStatus === 'critical'
                  ? '#EF4444'
                  : telemetryStatus === 'warning'
                  ? '#F59E0B'
                  : '#10B981'
              }
              transparent
              opacity={telemetryStatus === 'critical' ? 0.85 : 0.6}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Expanding Shockwave Ring for Warnings & Critical Alerts */}
          {(telemetryStatus === 'critical' || telemetryStatus === 'warning') && (
            <mesh ref={shockwaveRingRef} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.2, 1.28, 32]} />
              <meshBasicMaterial
                color={telemetryStatus === 'critical' ? '#EF4444' : '#F59E0B'}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          )}

          {telemetryStatus === 'critical' && (
            <pointLight color="#EF4444" intensity={2} distance={3} />
          )}
        </group>
      )}

      {/* Ground Contact Shadow Projected on Grid (Y = -3.48) */}
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3.48 - pos.y, 0]}
      >
        <circleGeometry args={[0.9, 32]} />
        <meshBasicMaterial
          color="#020617"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>

      {/* Floating HUD Label */}
      <NodeLabel node={node} isHovered={isHovered} isSelected={isSelected} />
    </group>
  );
}
