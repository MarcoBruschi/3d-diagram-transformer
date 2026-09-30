'use client';

import React from 'react';
import { useDiagramStore } from '@/store/useDiagramStore';

export function StudioLighting() {
  const selectedNodeId = useDiagramStore((s) => s.selectedNodeId);
  const nodes = useDiagramStore((s) => s.diagram.nodes);

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;

  return (
    <>
      {/* Ambient soft technical fill */}
      <ambientLight intensity={0.65} color="#E2E8F0" />

      {/* Primary Key light casting crisp shadows */}
      <directionalLight
        position={[12, 18, 10]}
        intensity={1.25}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
      />

      {/* Cool blue secondary rim light */}
      <directionalLight position={[-14, 10, -12]} intensity={0.85} color="#38BDF8" />

      {/* Warm fill accent light from below */}
      <pointLight position={[0, -2, 4]} intensity={0.4} color="#64748B" distance={20} />

      {/* Dynamic Cinematic Spotlight on Selected Node */}
      {selectedNode?.position3D && (
        <group>
          <pointLight
            position={[
              selectedNode.position3D.x,
              selectedNode.position3D.y + 1.2,
              selectedNode.position3D.z,
            ]}
            intensity={1.5}
            distance={5}
            color="#38BDF8"
          />
        </group>
      )}
    </>
  );
}
