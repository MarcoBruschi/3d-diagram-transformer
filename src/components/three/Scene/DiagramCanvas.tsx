'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useLayersStore } from '@/store/useLayersStore';
import { useAuthStore } from '@/store/useAuthStore';

import { StudioLighting } from '../Lighting/StudioLighting';
import { CADGrid } from '../Environment/CADGrid';
import { CameraController } from '../Camera/CameraController';
import { AmbientField } from '../Particles/AmbientField';
import { NodeMesh } from '../Nodes/NodeMesh';
import { SplineConnection } from '../Connections/SplineConnection';
import { CollaborativeCursors } from '@/components/saas/CollaborativeCursors';

import { useThemeStore } from '@/store/useThemeStore';

export function DiagramCanvas() {
  const theme = useThemeStore((s) => s.theme);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#07080B' : '#F1F5F9';
  const diagram = useDiagramStore((s) => s.diagram);
  const selectNode = useDiagramStore((s) => s.selectNode);
  const filterStatus = useDiagramStore((s) => s.filterStatus);
  const searchQuery = useDiagramStore((s) => s.searchQuery);
  const layers = useLayersStore((s) => s.layers);

  // Filter nodes based on layer visibility, status filter, and search query
  const filteredNodes = diagram.nodes.filter((node) => {
    // Layer check
    if (node.layer && !layers[node.layer]) return false;

    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'healthy' && node.status !== 'active') return false;
      if (filterStatus === 'warning' && node.status !== 'warning') return false;
      if (filterStatus === 'error' && node.status !== 'error') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        node.name.toLowerCase().includes(q) ||
        node.type.toLowerCase().includes(q) ||
        node.description?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const selectConnection = useDiagramStore((s) => s.selectConnection);
  const isDraggingNode = useDiagramStore((s) => s.isDraggingNode);

  const handlePointerMissed = () => {
    if (!isDraggingNode) {
      selectNode(null);
      selectConnection(null);
    }
  };

  return (
    <div className={`relative h-full w-full isolate z-0 transition-colors duration-200 touch-none select-none overflow-hidden ${isDark ? 'bg-[#07080B]' : 'bg-[#F1F5F9]'}`}>
      <Canvas
        camera={{ position: [0, 6, 15], fov: 45, near: 0.1, far: 100 }}
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onPointerMissed={handlePointerMissed}
      >
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[bgColor, 22, 50]} />

        <Suspense fallback={null}>
          <StudioLighting />
          <CADGrid />
          <CameraController />
          <AmbientField count={100} />

          {/* 3D Nodes */}
          {filteredNodes.map((node) => (
            <NodeMesh key={node.id} node={node} />
          ))}

          {/* 3D Connections */}
          {diagram.connections.map((connection) => (
            <SplineConnection
              key={connection.id}
              connection={connection}
              nodes={filteredNodes}
            />
          ))}

          {/* Multiplayer 3D Floating Cursors (Apenas usuários autenticados) */}
          {isAuthenticated && <CollaborativeCursors />}
        </Suspense>
      </Canvas>
    </div>
  );
}
