'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { DiagramConnection, DiagramNode } from '@/types/diagram';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useLayersStore } from '@/store/useLayersStore';
import { FlowParticles } from './FlowParticles';

interface SplineConnectionProps {
  connection: DiagramConnection;
  nodes: DiagramNode[];
}

export function SplineConnection({ connection, nodes }: SplineConnectionProps) {
  const connectionsVisible = useLayersStore((s) => s.layers.connections);
  const selectedNodeId = useDiagramStore((s) => s.selectedNodeId);
  const hoveredNodeId = useDiagramStore((s) => s.hoveredNodeId);
  const selectedConnectionId = useDiagramStore((s) => s.selectedConnectionId);
  const selectConnection = useDiagramStore((s) => s.selectConnection);
  const selectNode = useDiagramStore((s) => s.selectNode);

  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  const isConnSelected = selectedConnectionId === connection.id;

  const isHighlighted =
    isConnSelected ||
    selectedNodeId === connection.source ||
    selectedNodeId === connection.target ||
    hoveredNodeId === connection.source ||
    hoveredNodeId === connection.target;

  const isDimmed =
    (selectedNodeId || hoveredNodeId || selectedConnectionId) && !isHighlighted;

  const curve = useMemo(() => {
    if (!sourceNode || !targetNode) return null;

    const p1 = new THREE.Vector3(
      sourceNode.position3D?.x || 0,
      sourceNode.position3D?.y || 0,
      sourceNode.position3D?.z || 0
    );
    const p2 = new THREE.Vector3(
      targetNode.position3D?.x || 0,
      targetNode.position3D?.y || 0,
      targetNode.position3D?.z || 0
    );

    // Natural 3D Bezier midpoint with subtle curvature
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    mid.y += 0.35;
    mid.z += 0.2;

    return new THREE.QuadraticBezierCurve3(p1, mid, p2);
  }, [sourceNode, targetNode]);

  // Compute 3D directional arrow orientation approaching target node
  const arrowTransform = useMemo(() => {
    if (!curve) return null;
    const pos = curve.getPointAt(0.92);
    const tangent = curve.getTangentAt(0.92).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, tangent);
    const rot = new THREE.Euler().setFromQuaternion(quat);
    return { pos, rot };
  }, [curve]);

  if (!connectionsVisible || !curve) return null;

  const midPoint = curve.getPoint(0.5);

  const isUmlDependency =
    connection.type === 'use' ||
    connection.type === 'dependency' ||
    connection.style === 'dashed';

  const isWireless =
    connection.type === 'wireless' ||
    (connection.protocol && connection.protocol.includes('4G')) ||
    (connection.label && connection.label.includes('4G'));

  let defaultColor = '#334155';
  let activeColor = '#38BDF8';
  let particleColor = '#7DD3FC';

  if (isUmlDependency) {
    defaultColor = '#78350F';
    activeColor = '#F59E0B';
    particleColor = '#FCD34D';
  } else if (isWireless) {
    defaultColor = '#0E7490';
    activeColor = '#06B6D4';
    particleColor = '#67E8F9';
  }

  const tubeColor = isHighlighted ? activeColor : defaultColor;
  const tubeOpacity = isHighlighted ? 0.95 : isDimmed ? 0.15 : 0.55;
  const tubeRadius = isConnSelected ? 0.045 : isHighlighted ? 0.035 : 0.022;

  const displayBadgeText =
    connection.protocol ||
    connection.label ||
    (connection.type ? `«${connection.type}»` : '');

  const handleSelect = (e: React.MouseEvent | { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectConnection(connection.id);
    selectNode(null);
  };

  return (
    <group>
      {/* Outer Luminous Energy Aura (Visible on hover/selection) */}
      {isHighlighted && (
        <mesh>
          <tubeGeometry args={[curve, 32, tubeRadius * 2.2, 8, false]} />
          <meshBasicMaterial
            color={activeColor}
            transparent
            opacity={0.18}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Visual 3D Volumetric Cable / Pipe */}
      <mesh>
        <tubeGeometry args={[curve, 32, tubeRadius, 8, false]} />
        <meshBasicMaterial
          color={tubeColor}
          transparent
          opacity={tubeOpacity}
        />
      </mesh>

      {/* 3D Directional Arrowhead approaching target node */}
      {arrowTransform && (
        <mesh
          position={[arrowTransform.pos.x, arrowTransform.pos.y, arrowTransform.pos.z]}
          rotation={[arrowTransform.rot.x, arrowTransform.rot.y, arrowTransform.rot.z]}
        >
          <coneGeometry args={[tubeRadius * 2.8, tubeRadius * 5.5, 8]} />
          <meshBasicMaterial
            color={tubeColor}
            transparent
            opacity={Math.max(tubeOpacity, 0.7)}
          />
        </mesh>
      )}

      {/* Invisible Raycast Collision Tube for Easy Clicking in 3D & Split */}
      <mesh
        onClick={handleSelect}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <tubeGeometry args={[curve, 24, 0.22, 6, false]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Pulsing Traveling Data Flow Packets */}
      <FlowParticles
        curve={curve}
        color={particleColor}
        speed={0.25 + (connection.trafficRate || 5) * 0.05}
        count={connection.trafficRate && connection.trafficRate > 6 ? 4 : 2}
      />

      {/* Interactive 3D HUD Badge on Connection Curve */}
      {displayBadgeText && (
        <Html
          position={[midPoint.x, midPoint.y, midPoint.z]}
          center
          zIndexRange={[5, 0]}
        >
          <div
            onClick={handleSelect}
            className={`cursor-pointer px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-mono font-bold whitespace-nowrap transition-all shadow-md select-none ${
              isConnSelected
                ? 'bg-sky-500 text-white border border-white/40 ring-2 ring-sky-400/50 scale-110'
                : isHighlighted
                ? 'bg-white/95 dark:bg-slate-900/95 text-sky-600 dark:text-sky-300 border border-sky-400/60 hover:scale-105'
                : 'bg-white/90 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700/60 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {displayBadgeText}
          </div>
        </Html>
      )}
    </group>
  );
}
