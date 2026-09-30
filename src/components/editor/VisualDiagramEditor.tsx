'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useCameraStore } from '@/store/useCameraStore';
import { DiagramNode, DiagramConnection, NodeType, NodeStatus, EdgeType } from '@/types/diagram';
import { NODE_VISUALS } from '@/lib/mappings/nodeTypes';
import { ComponentPalette } from './ComponentPalette';
import { DiagramCanvas } from '@/components/three/Scene/DiagramCanvas';
import { PRESET_DIAGRAMS } from '@/data/presets';
import { useThemeStore } from '@/store/useThemeStore';
import {
  Sparkles,
  Trash2,
  Link as LinkIcon,
  RotateCcw,
  Box,
  Layers,
  Check,
  X,
  Edit2,
  ArrowRight,
  Sliders,
  Activity,
  Network,
  Radio,
  FileText,
  Columns,
  Grid,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyStart,
  Maximize2,
  FilePlus,
  Boxes,
  ChevronRight,
  Eye,
  Lock,
} from 'lucide-react';
import { useFeatureGating } from '@/hooks/useFeatureGating';

const EDGE_TYPE_OPTIONS: { value: EdgeType; label: string; group: string }[] = [
  { value: 'use', label: '«use» (UML Dependency)', group: 'UML Stereotypes' },
  { value: 'dependency', label: 'Dependency (UML)', group: 'UML Stereotypes' },
  { value: 'association', label: 'Association (UML)', group: 'UML Stereotypes' },
  { value: 'composition', label: 'Composition (UML)', group: 'UML Stereotypes' },
  { value: 'aggregation', label: 'Aggregation (UML)', group: 'UML Stereotypes' },
  { value: 'realization', label: 'Realization / «provides»', group: 'UML Stereotypes' },
  { value: 'wireless', label: '«4G / 5G / WiFi» (Wireless)', group: 'Network & Cloud' },
  { value: 'network-flow', label: 'Network Flow (Route)', group: 'Network & Cloud' },
  { value: 'api-request', label: 'API Request (HTTP / REST)', group: 'Network & Cloud' },
  { value: 'api-response', label: 'API Response', group: 'Network & Cloud' },
  { value: 'data-flow', label: 'Data Flow / Stream', group: 'Data & Events' },
  { value: 'message-flow', label: 'Message Flow (Event Broker)', group: 'Data & Events' },
  { value: 'sync', label: 'Synchronous Call', group: 'Protocols' },
  { value: 'async', label: 'Asynchronous Event', group: 'Protocols' },
];

const NODE_TYPE_OPTIONS: { value: NodeType; label: string }[] = [
  { value: 'uml-component', label: 'UML Component (Módulo com abas)' },
  { value: 'uml-controller', label: 'Controlador (Hardware / IoT)' },
  { value: 'executable', label: 'Executável (Gerenciador / Daemon)' },
  { value: 'uml-interface', label: 'Interface UML (Lollipop / Socket)' },
  { value: 'service', label: 'Serviço de Negócio' },
  { value: 'microservice', label: 'Microserviço em Nuvem' },
  { value: 'security-module', label: 'Segurança / Criptografia' },
  { value: 'database', label: 'Banco de Dados' },
  { value: 'server', label: 'Servidor Físico / Rack' },
  { value: 'device', label: 'Dispositivo IoT' },
  { value: 'laptop', label: 'Estação de Trabalho / Laptop' },
  { value: 'gateway', label: 'Gateway de Entrada' },
  { value: 'cloud', label: 'Provedor em Nuvem' },
  { value: 'queue', label: 'Fila de Mensagens / Eventos' },
];

export function VisualDiagramEditor() {
  const diagram = useDiagramStore((s) => s.diagram);
  const selectedNodeId = useDiagramStore((s) => s.selectedNodeId);
  const selectedConnectionId = useDiagramStore((s) => s.selectedConnectionId);
  const selectNode = useDiagramStore((s) => s.selectNode);
  const selectConnection = useDiagramStore((s) => s.selectConnection);
  const addNode = useDiagramStore((s) => s.addNode);
  const removeNode = useDiagramStore((s) => s.removeNode);
  const updateNode = useDiagramStore((s) => s.updateNode);
  const updateNodePosition2D = useDiagramStore((s) => s.updateNodePosition2D);
  const addConnection = useDiagramStore((s) => s.addConnection);
  const removeConnection = useDiagramStore((s) => s.removeConnection);
  const updateConnection = useDiagramStore((s) => s.updateConnection);
  const clearDiagram = useDiagramStore((s) => s.clearDiagram);
  const loadPreset = useDiagramStore((s) => s.loadPreset);
  const setViewMode = useDiagramStore((s) => s.setViewMode);
  const resetCamera = useCameraStore((s) => s.resetCamera);
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const { canEdit } = useFeatureGating();

  // Initial Open Options Modal ("Diagrama em Branco" ou "Abrir Presets da Aplicação")
  const [showStartModal, setShowStartModal] = useState<boolean>(diagram.nodes.length === 0);
  const [showPresetsView, setShowPresetsView] = useState<boolean>(false);

  // Builder Layout Mode (2D Vector, 3D Spatial, or Split 2D+3D)
  const [editorLayoutMode, setEditorLayoutMode] = useState<'2d' | '3d' | 'split'>('split');
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setEditorLayoutMode('3d');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeLayoutMode = isMobile ? '3d' : editorLayoutMode;

  // Connection dragging/mode state from store (shared with 3D canvas)
  const connectingSourceId = useDiagramStore((s) => s.connectingSourceId);
  const setConnectingSourceId = useDiagramStore((s) => s.setConnectingSourceId);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedNode = diagram.nodes.find((n) => n.id === selectedNodeId);
  const selectedConnection = diagram.connections.find((c) => c.id === selectedConnectionId);
  const connectingSourceNode = diagram.nodes.find((n) => n.id === connectingSourceId);

  // Keyboard shortcut listener (Escape cancels connecting mode and selection, or closes start modal if diagram exists)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showStartModal && diagram.nodes.length > 0) {
          setShowStartModal(false);
          setShowPresetsView(false);
        } else {
          setConnectingSourceId(null);
          selectNode(null);
          selectConnection(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setConnectingSourceId, selectNode, selectConnection, showStartModal, diagram.nodes.length]);

  // Add component from palette
  const handleAddComponent = (type: NodeType, defaultName: string) => {
    if (!canEdit || isMobile) return;
    const id = `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const count = diagram.nodes.length;
    const newNode: DiagramNode = {
      id,
      name: `${defaultName} ${count + 1}`,
      type,
      status: 'active',
      description: `Componente arquitetural personalizado.`,
      position2D: {
        x: 180 + (count % 4) * 80,
        y: 120 + Math.floor(count / 4) * 110,
      },
      metrics: {
        cpu: 35,
        memory: 45,
        latency: 10,
        requestsPerSec: 600,
        statusText: 'Ativo',
      },
    };
    addNode(newNode);
  };

  // Node Dragging on Canvas
  const handleNodeMouseDown = (e: React.MouseEvent, node: DiagramNode) => {
    e.stopPropagation();

    if (isMobile) {
      selectNode(node.id);
      selectConnection(null);
      return;
    }

    if (connectingSourceId) {
      if (!canEdit) {
        setConnectingSourceId(null);
        return;
      }
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
      return;
    }

    selectNode(node.id);
    selectConnection(null);
    if (!canEdit) return;
    setIsDraggingNode(node.id);
    dragOffset.current = {
      x: e.clientX - node.position2D.x,
      y: e.clientY - node.position2D.y,
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    if (isDraggingNode) {
      const newX = Math.max(20, Math.min(1600, e.clientX - dragOffset.current.x));
      const newY = Math.max(20, Math.min(1100, e.clientY - dragOffset.current.y));
      updateNodePosition2D(isDraggingNode, { x: newX, y: newY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingNode(null);
  };

  // Alignment Tools for 2D and 3D
  const handleSnapToGrid = () => {
    if (!canEdit || isMobile) return;
    diagram.nodes.forEach((n) => {
      const snappedX = Math.round(n.position2D.x / 20) * 20;
      const snappedY = Math.round(n.position2D.y / 20) * 20;
      updateNodePosition2D(n.id, { x: snappedX, y: snappedY });
    });
  };

  const handleAlignHorizontal = () => {
    if (!canEdit || isMobile || diagram.nodes.length <= 1) return;
    const avgY = Math.round(
      diagram.nodes.reduce((acc, n) => acc + n.position2D.y, 0) / diagram.nodes.length
    );
    diagram.nodes.forEach((n) => {
      updateNodePosition2D(n.id, { x: n.position2D.x, y: avgY });
    });
  };

  const handleAlignVertical = () => {
    if (!canEdit || isMobile || diagram.nodes.length <= 1) return;
    const avgX = Math.round(
      diagram.nodes.reduce((acc, n) => acc + n.position2D.y, 0) / diagram.nodes.length
    );
    diagram.nodes.forEach((n) => {
      updateNodePosition2D(n.id, { x: avgX, y: n.position2D.y });
    });
  };

  const handleTransformTo3D = () => {
    resetCamera();
    setViewMode('3d');
  };

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-[#07080B] text-slate-800 dark:text-slate-100 font-mono text-xs overflow-hidden select-none transition-colors duration-200">
      {/* 1. Left Component Palette Sidebar - Hidden on mobile screens */}
      {!isMobile && <ComponentPalette onAddComponent={handleAddComponent} />}

      {/* 2. Center Visual Builder Viewport Area */}
      <div
        className="relative flex-1 h-full overflow-hidden flex flex-col"
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        {/* Top Action Ribbon */}
        <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 px-3 sm:px-4 flex items-center justify-between backdrop-blur-md z-10 transition-colors duration-200 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-slate-700 dark:text-slate-400 font-bold flex items-center gap-1.5">
              <Edit2 className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
              <span className="hidden sm:inline">BUILDER 2D & 3D</span>
            </span>

            {(!canEdit || isMobile) && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                <Eye className="h-3 w-3" />
                <span className="hidden md:inline">Modo Visualizador (Somente Leitura)</span>
                <span className="md:hidden">Leitura</span>
              </span>
            )}

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Layout Mode Selector (Hidden 2D/Split on mobile; strictly 3D) */}
            {isMobile ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-[11px] font-semibold text-sky-400">
                <Box className="h-3.5 w-3.5" />
                <span>3D Espacial</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setEditorLayoutMode('2d')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    editorLayoutMode === '2d'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Visualizar apenas o Canvas 2D"
                >
                  2D Vetor
                </button>

                <button
                  onClick={() => setEditorLayoutMode('split')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    editorLayoutMode === 'split'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Visualizar 2D e 3D Lado a Lado (Alinhamento em duas dimensões)"
                >
                  Split (2D + 3D)
                </button>

                <button
                  onClick={() => setEditorLayoutMode('3d')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    editorLayoutMode === '3d'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title="Visualizar apenas o Viewport 3D"
                >
                  3D Espacial
                </button>
              </div>
            )}

            {/* Quick Alignment Tools */}
            <div className="hidden md:flex items-center gap-1 ml-2">
              <button
                onClick={handleSnapToGrid}
                className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                title="Alinhar nós à Grade (Snap 20px)"
              >
                <Grid className="h-3 w-3 text-sky-500 dark:text-sky-400" />
                <span className="text-[10px]">Grade</span>
              </button>

              <button
                onClick={handleAlignHorizontal}
                className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                title="Alinhar nós horizontalmente (Linha Y)"
              >
                <AlignHorizontalJustifyStart className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px]">Alinhar Horiz.</span>
              </button>

              <button
                onClick={handleAlignVertical}
                className="flex items-center gap-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                title="Alinhar nós verticalmente (Coluna X)"
              >
                <AlignVerticalJustifyStart className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px]">Alinhar Vert.</span>
              </button>
            </div>

            {connectingSourceId && (
              <div className="flex items-center gap-2 rounded bg-amber-950/80 border border-amber-500/50 px-2.5 py-1 text-amber-300 animate-pulse shadow-sm">
                <Radio className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                <span className="text-[11px]">Clique no nó de destino</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConnectingSourceId(null);
                  }}
                  className="rounded hover:bg-amber-900 p-0.5 ml-1 text-amber-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowPresetsView(false);
                setShowStartModal(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-sky-500/60 transition-colors shadow-xs"
              title="Abrir opções: Diagrama em branco ou Presets da aplicação"
            >
              <FilePlus className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
              <span>Novo / Presets</span>
            </button>

            <button
              onClick={clearDiagram}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Limpar</span>
            </button>

            <button
              onClick={handleTransformTo3D}
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-1.5 font-bold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-500 transition-all active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Cena 3D</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Viewport Display Area (Supports 2D, 3D, and Split View) */}
        <div className="relative flex-1 w-full h-full flex overflow-hidden">
          {/* Mobile Read-Only 3D Viewer Badge */}
          {isMobile && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-0.5 px-3.5 py-1.5 rounded-xl border border-sky-500/30 bg-slate-950/85 backdrop-blur-md shadow-lg pointer-events-none text-center max-w-[90vw]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-400">
                <Eye className="h-3.5 w-3.5" />
                <span>Visualizador 3D • Modo Leitura</span>
              </div>
              <span className="text-[9px] text-slate-400">
                A edição e o Builder de arquitetura estão disponíveis em tablets e computadores para maior precisão.
              </span>
            </div>
          )}

          {/* Left / Full: 2D SVG Canvas - Hidden on mobile */}
          {!isMobile && (editorLayoutMode === '2d' || editorLayoutMode === 'split') && (
            <div
              className={`relative ${
                editorLayoutMode === 'split' ? 'w-1/2 border-r border-slate-200 dark:border-slate-800' : 'w-full'
              } h-full bg-slate-100/80 dark:bg-[#07080B] overflow-auto select-none transition-colors duration-200`}
            >
              <svg
                ref={svgRef}
                className="h-[1200px] w-[1800px] cursor-default"
                onClick={(e) => {
                  if (e.target === svgRef.current || (e.target as HTMLElement).id === 'builder-grid-bg') {
                    selectNode(null);
                    selectConnection(null);
                    setConnectingSourceId(null);
                  }
                }}
              >
                <defs>
                  <pattern id="builder-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path
                      d="M 30 0 L 0 0 0 30"
                      fill="none"
                      stroke={isDark ? '#172033' : '#E2E8F0'}
                      strokeWidth="0.8"
                    />
                    <path
                      d="M 150 0 L 0 0 0 150"
                      fill="none"
                      stroke={isDark ? '#1E293B' : '#CBD5E1'}
                      strokeWidth="1"
                    />
                  </pattern>

                  <marker
                    id="arrow-head"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#0284C7" />
                  </marker>

                  <marker
                    id="arrow-head-open"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 1 2 L 8 5 L 1 8" fill="none" stroke="#D97706" strokeWidth="1.8" />
                  </marker>
                </defs>

                <rect id="builder-grid-bg" width="100%" height="100%" fill="url(#builder-grid)" />

                {/* Established Connection Lines */}
                {diagram.connections.map((conn) => {
                  const src = diagram.nodes.find((n) => n.id === conn.source);
                  const tgt = diagram.nodes.find((n) => n.id === conn.target);
                  if (!src || !tgt) return null;

                  const x1 = src.position2D.x + 170;
                  const y1 = src.position2D.y + 40;
                  const x2 = tgt.position2D.x;
                  const y2 = tgt.position2D.y + 40;
                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;
                  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

                  const isSelected = selectedConnectionId === conn.id;
                  const strokeColor = isSelected
                    ? '#38BDF8'
                    : conn.style === 'dashed' || conn.type === 'use' || conn.type === 'dependency'
                    ? '#F59E0B'
                    : '#38BDF8';
                  const strokeDash =
                    conn.style === 'dashed' || conn.type === 'use' || conn.type === 'dependency'
                      ? '6 4'
                      : conn.style === 'dotted'
                      ? '2 4'
                      : undefined;

                  const displayLabel = conn.protocol
                    ? conn.protocol
                    : conn.label || (conn.type ? `«${conn.type}»` : 'Link');

                  return (
                    <g
                      key={conn.id}
                      className="group cursor-pointer"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectConnection(conn.id);
                        selectNode(null);
                      }}
                    >
                      {/* Generous invisible stroke for effortless clicking in 2D */}
                      <path d={path} fill="none" stroke="transparent" strokeWidth="24" className="cursor-pointer" />

                      {isSelected && (
                        <path
                          d={path}
                          fill="none"
                          stroke="#0284C7"
                          strokeWidth="6"
                          opacity="0.5"
                          className="animate-pulse"
                        />
                      )}

                      <path
                        d={path}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isSelected ? '2.5' : '1.8'}
                        strokeDasharray={strokeDash}
                        markerEnd={
                          conn.style === 'dashed' || conn.type === 'use' || conn.type === 'dependency'
                            ? 'url(#arrow-head-open)'
                            : 'url(#arrow-head)'
                        }
                      />

                      {/* Multiplicities */}
                      {conn.multiplicitySource && (
                        <text x={x1 + 6} y={y1 - 8} fill="#94A3B8" fontSize="9" fontWeight="bold">
                          {conn.multiplicitySource}
                        </text>
                      )}
                      {conn.multiplicityTarget && (
                        <text x={x2 - 16} y={y2 - 8} fill="#94A3B8" fontSize="9" fontWeight="bold">
                          {conn.multiplicityTarget}
                        </text>
                      )}

                      {/* Interactive Center Badge */}
                      <g
                        transform={`translate(${midX}, ${midY})`}
                        className="cursor-pointer"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <rect
                          x={-Math.max(28, (displayLabel.length * 6.5) / 2 + 8)}
                          y="-11"
                          width={Math.max(56, displayLabel.length * 6.5 + 16)}
                          height="22"
                          rx="6"
                          fill={isSelected ? '#0284C7' : isDark ? '#0F172A' : '#FFFFFF'}
                          stroke={isSelected ? '#38BDF8' : isDark ? '#334155' : '#CBD5E1'}
                          strokeWidth="1.2"
                          className="transition-colors group-hover:stroke-sky-400"
                        />
                        <text
                          x="0"
                          y="3.5"
                          fill={isSelected ? '#FFFFFF' : isDark ? '#E2E8F0' : '#1E293B'}
                          fontSize="9.5"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="pointer-events-none select-none"
                        >
                          {displayLabel}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Elastic Connecting Wire Following Mouse */}
                {connectingSourceNode && (
                  <g className="pointer-events-none">
                    {(() => {
                      const x1 = connectingSourceNode.position2D.x + 170;
                      const y1 = connectingSourceNode.position2D.y + 40;
                      const x2 = mousePos.x;
                      const y2 = mousePos.y;
                      const midX = (x1 + x2) / 2;
                      const wirePath = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

                      return (
                        <>
                          <path
                            d={wirePath}
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="2.5"
                            strokeDasharray="6 4"
                            className="animate-pulse"
                          />
                          <circle cx={x2} cy={y2} r="5" fill="#F59E0B" />
                          <circle
                            cx={x2}
                            cy={y2}
                            r="11"
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="1.5"
                            className="animate-ping"
                          />
                        </>
                      );
                    })()}
                  </g>
                )}

                {/* Draggable Component Nodes */}
                {diagram.nodes.map((node) => {
                  const visual = NODE_VISUALS[node.type] || NODE_VISUALS.generic;
                  const isSelected = selectedNodeId === node.id;
                  const isConnectingSource = connectingSourceId === node.id;
                  const { x, y } = node.position2D;
                  const w = 170;
                  const h = 80;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${x}, ${y})`}
                      onMouseDown={(e) => handleNodeMouseDown(e, node)}
                      onClick={(e) => {
                        e.stopPropagation();
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
                        } else {
                          selectNode(node.id);
                          selectConnection(null);
                        }
                      }}
                      className="cursor-move"
                    >
                      {isSelected && (
                        <rect
                          x="-4"
                          y="-4"
                          width={w + 8}
                          height={h + 8}
                          rx="10"
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="2"
                          className="animate-pulse"
                        />
                      )}

                      {isConnectingSource && (
                        <rect
                          x="-4"
                          y="-4"
                          width={w + 8}
                          height={h + 8}
                          rx="10"
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          className="animate-pulse"
                        />
                      )}

                      {/* Card Body */}
                      <rect
                        width={w}
                        height={h}
                        rx="8"
                        fill={isSelected ? (isDark ? '#0F172A' : '#F0F9FF') : isDark ? '#0B0F19' : '#FFFFFF'}
                        stroke={isSelected ? '#0284C7' : isDark ? '#1E293B' : '#E2E8F0'}
                        strokeWidth="1.5"
                      />

                      {/* Top Accent Strip */}
                      <rect width={w} height="5" rx="2.5" fill={visual.color} />

                      {/* Status Dot */}
                      <circle
                        cx="16"
                        cy="24"
                        r="4"
                        fill={
                          node.status === 'active'
                            ? '#10B981'
                            : node.status === 'warning'
                            ? '#F59E0B'
                            : '#F43F5E'
                        }
                      />

                      {/* Name */}
                      <text x="28" y="28" fill={isDark ? '#F8FAFC' : '#0F172A'} fontSize="11" fontWeight="bold">
                        {node.name.length > 16 ? node.name.slice(0, 15) + '…' : node.name}
                      </text>

                      {/* Badge / Type */}
                      <text x="14" y="46" fill={visual.color} fontSize="9" fontWeight="600">
                        {node.properties?.stereotype ? `«${node.properties.stereotype}»` : visual.badgeLabel}
                      </text>

                      {/* Coordinates & Tier */}
                      <text x="14" y="64" fill={isDark ? '#64748B' : '#94A3B8'} fontSize="9">
                        X:{Math.round(x)} Y:{Math.round(y)} (Tier {node.importance || 3})
                      </text>

                      {/* Wire Link Button (+) */}
                      <g
                        transform={`translate(${w - 22}, 20)`}
                        className="cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConnectingSourceId(node.id);
                        }}
                      >
                        <title>Clique para puxar linha de conexão</title>
                        <circle cx="8" cy="8" r="8" fill="#0284C7" />
                        <text x="8" y="11.5" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle">
                          +
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Right / Full: Live 3D Spatial Canvas */}
          {(isMobile || editorLayoutMode === '3d' || editorLayoutMode === 'split') && (
            <div
              className={`relative ${
                !isMobile && editorLayoutMode === 'split' ? 'w-1/2' : 'w-full'
              } h-full bg-slate-100 dark:bg-[#030712] overflow-hidden transition-colors duration-200`}
            >
              <DiagramCanvas />

              {/* 3D Viewport Header Overlay */}
              <div className="absolute top-2 left-2 z-10 rounded bg-white/90 dark:bg-slate-900/80 px-2.5 py-1 text-[10px] font-mono text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm pointer-events-none">
                3D Spatial Twin — WebGL R3F
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3A. Right Property Inspector for SELECTED NODE (Desktop only; on mobile full canvas is preserved) */}
      {!isMobile && selectedNode && (
        <aside
          className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 p-4 font-mono text-xs flex flex-col h-full overflow-y-auto z-20 shadow-2xl transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
              <span>EDITAR COMPONENTE</span>
            </span>
            <button
              onClick={() => selectNode(null)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {/* Component Name */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-semibold">Nome do Componente</label>
              <input
                type="text"
                value={selectedNode.name}
                onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 font-medium"
              />
            </div>

            {/* Stereotype */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-semibold">
                Estereótipo UML (ex: controller, executable, service, secure)
              </label>
              <input
                type="text"
                value={(selectedNode.properties?.stereotype as string) || ''}
                placeholder="Ex: controller, executable, service"
                onChange={(e) =>
                  updateNode(selectedNode.id, {
                    properties: { ...selectedNode.properties, stereotype: e.target.value },
                  })
                }
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              />
            </div>

            {/* Component Type Dropdown */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-semibold">Tipo Visual & 3D</label>
              <select
                value={selectedNode.type}
                onChange={(e) => updateNode(selectedNode.id, { type: e.target.value as NodeType })}
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              >
                {NODE_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 2D Positioning Alignment (X, Y) */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 p-2.5 space-y-2">
              <span className="text-[10px] uppercase text-sky-600 dark:text-sky-400 font-semibold block">
                Posicionamento 2D (Vetor)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 block">X (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedNode.position2D.x)}
                    onChange={(e) =>
                      updateNodePosition2D(selectedNode.id, {
                        x: parseFloat(e.target.value) || 0,
                        y: selectedNode.position2D.y,
                      })
                    }
                    className="w-full rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block">Y (px)</label>
                  <input
                    type="number"
                    value={Math.round(selectedNode.position2D.y)}
                    onChange={(e) =>
                      updateNodePosition2D(selectedNode.id, {
                        x: selectedNode.position2D.x,
                        y: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* 3D Positioning Alignment (X, Y, Z) */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 p-2.5 space-y-2">
              <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-semibold block">
                Posicionamento 3D Espacial
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="text-[9px] text-slate-500 block">3D X</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedNode.position3D?.x?.toFixed(1) || '0.0'}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        position3D: {
                          x: parseFloat(e.target.value) || 0,
                          y: selectedNode.position3D?.y || 0,
                          z: selectedNode.position3D?.z || 0,
                        },
                      })
                    }
                    className="w-full rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-1.5 py-1 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block">3D Y (Alt.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedNode.position3D?.y?.toFixed(1) || '0.0'}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        position3D: {
                          x: selectedNode.position3D?.x || 0,
                          y: parseFloat(e.target.value) || 0,
                          z: selectedNode.position3D?.z || 0,
                        },
                      })
                    }
                    className="w-full rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-1.5 py-1 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 block">3D Z (Prof.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedNode.position3D?.z?.toFixed(1) || '0.0'}
                    onChange={(e) =>
                      updateNode(selectedNode.id, {
                        position3D: {
                          x: selectedNode.position3D?.x || 0,
                          y: selectedNode.position3D?.y || 0,
                          z: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-1.5 py-1 text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Depth Priority (Importance Tier) */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-semibold">
                Prioridade de Profundidade (Anti-Colisão)
              </label>
              <select
                value={selectedNode.importance || 3}
                onChange={(e) =>
                  updateNode(selectedNode.id, { importance: parseInt(e.target.value, 10) })
                }
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              >
                <option value={5}>Tier 5 (Primeiro Plano: Usuário / Cliente / Laptop)</option>
                <option value={4}>Tier 4 (Perímetro: Interface / Gateway / Roteador / Controlador)</option>
                <option value={3}>Tier 3 (Processamento: Servidor / Executável / Serviço)</option>
                <option value={2}>Tier 2 (Transporte: Fila / Barramento / Cache)</option>
                <option value={1}>Tier 1 (Fundação: Banco de Dados / Storage)</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-semibold">Descrição Técnica</label>
              <textarea
                value={selectedNode.description || ''}
                onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              />
            </div>

            {/* Live Status Selector */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-semibold">Status Operacional</label>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {(['active', 'warning', 'error'] as NodeStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => updateNode(selectedNode.id, { status: st })}
                    className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${
                      selectedNode.status === st
                        ? 'border border-sky-500 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                        : 'border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Connected Outgoing Target Nodes & Incoming Links */}
            {(() => {
              const outgoingConnections = diagram.connections.filter((c) => c.source === selectedNode.id);
              const incomingConnections = diagram.connections.filter((c) => c.target === selectedNode.id);
              return (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 p-2.5 space-y-2">
                  <span className="text-[10px] uppercase text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1.5">
                    <Network className="h-3 w-3" />
                    <span>Nós de Destino Conectados ({outgoingConnections.length})</span>
                  </span>

                  {outgoingConnections.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">Nenhum nó de destino conectado a partir deste componente.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {outgoingConnections.map((conn) => {
                        const targetNode = diagram.nodes.find((n) => n.id === conn.target);
                        if (!targetNode) return null;
                        return (
                          <div
                            key={conn.id}
                            className="flex items-center justify-between rounded bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 p-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                          >
                            <div className="min-w-0 flex-1 mr-2">
                              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                                <span className="text-sky-500 dark:text-sky-400">→</span>
                                <span>{targetNode.name}</span>
                              </div>
                              <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                                {conn.label || (conn.type ? `«${conn.type}»` : 'Link')}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => selectNode(targetNode.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-sky-100 hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-600/40 text-[10px] font-semibold transition-colors"
                                title="Editar Diretamente o Nó de Destino"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Editar</span>
                              </button>
                              <button
                                onClick={() => selectConnection(conn.id)}
                                className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Editar Ligação"
                              >
                                <Sliders className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Incoming connections */}
                  {incomingConnections.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60">
                      <span className="text-[9px] uppercase text-slate-500 font-semibold block mb-1">
                        Origens Conectadas ({incomingConnections.length})
                      </span>
                      <div className="space-y-1">
                        {incomingConnections.map((conn) => {
                          const srcNode = diagram.nodes.find((n) => n.id === conn.source);
                          if (!srcNode) return null;
                          return (
                            <div
                              key={conn.id}
                              className="flex items-center justify-between rounded bg-white/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 p-1 text-[10px]"
                            >
                              <span className="text-slate-700 dark:text-slate-300 truncate">← {srcNode.name}</span>
                              <button
                                onClick={() => selectNode(srcNode.id)}
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-[9px] border border-slate-200 dark:border-slate-800"
                              >
                                Editar
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Actions */}
            <button
              onClick={() => setConnectingSourceId(selectedNode.id)}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-sky-400/50 dark:border-sky-500/40 bg-sky-100 dark:bg-sky-950/60 py-2 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/60 font-semibold transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Conectar a Outro Nó (+)</span>
            </button>

            <button
              onClick={() => removeNode(selectedNode.id)}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-semibold transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir Componente</span>
            </button>
          </div>
        </aside>
      )}

      {/* 3B. Right Property Inspector for SELECTED CONNECTION (Desktop only) */}
      {!isMobile && !selectedNode && selectedConnection && (
        <aside
          className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 p-4 font-mono text-xs flex flex-col h-full overflow-y-auto z-20 shadow-2xl transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Network className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
              <span>DETALHES DA LIGAÇÃO</span>
            </span>
            <button
              onClick={() => selectConnection(null)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-colors"
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {/* Source & Target Nodes Selector & Direct Edit Buttons */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 p-2.5 space-y-3">
              {/* Source Node */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold">Nó de Origem</label>
                  <button
                    onClick={() => selectNode(selectedConnection.source)}
                    className="text-[9px] text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 flex items-center gap-0.5"
                    title="Editar Nó de Origem"
                  >
                    <Edit2 className="h-2.5 w-2.5" />
                    <span>Editar Origem</span>
                  </button>
                </div>
                <select
                  value={selectedConnection.source}
                  onChange={(e) => updateConnection(selectedConnection.id, { source: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500 text-[11px]"
                >
                  {diagram.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Node (Nó de Destino) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-semibold">Nó de Destino</label>
                  <button
                    onClick={() => selectNode(selectedConnection.target)}
                    className="text-[9px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-0.5 font-bold"
                    title="Editar Nó de Destino Diretamente"
                  >
                    <Edit2 className="h-2.5 w-2.5" />
                    <span>Editar Destino</span>
                  </button>
                </div>
                <select
                  value={selectedConnection.target}
                  onChange={(e) => updateConnection(selectedConnection.id, { target: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 text-[11px]"
                >
                  {diagram.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Label / Stereotype */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-semibold">
                Rótulo / Estereótipo (ex: «use», «provides», «requires», «4G»)
              </label>
              <input
                type="text"
                value={selectedConnection.label || ''}
                placeholder="Ex: «use», «provides», «4G»"
                onChange={(e) =>
                  updateConnection(selectedConnection.id, { label: e.target.value })
                }
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              />
            </div>

            {/* Protocol */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-semibold">Protocolo / Tecnologia</label>
              <input
                type="text"
                value={selectedConnection.protocol || ''}
                placeholder="Ex: 4G LTE, HTTPS, TCP, Socket"
                onChange={(e) =>
                  updateConnection(selectedConnection.id, { protocol: e.target.value })
                }
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              />
            </div>

            {/* Relationship Type */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-semibold">Tipo de Relacionamento</label>
              <select
                value={selectedConnection.type || 'association'}
                onChange={(e) => {
                  const val = e.target.value as EdgeType;
                  const isUmlDashed = val === 'use' || val === 'dependency';
                  updateConnection(selectedConnection.id, {
                    type: val,
                    style: isUmlDashed ? 'dashed' : selectedConnection.style || 'solid',
                  });
                }}
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              >
                {EDGE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    [{opt.group}] {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Line Style */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-semibold">Estilo da Linha</label>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'solid', label: 'Contínua' },
                    { id: 'dashed', label: 'Tracejada' },
                    { id: 'dotted', label: 'Pontilhada' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => updateConnection(selectedConnection.id, { style: st.id })}
                    className={`rounded px-2 py-1.5 text-[10px] font-semibold ${
                      (selectedConnection.style || 'solid') === st.id
                        ? 'border border-sky-500 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                        : 'border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 font-semibold">Descrição do Relacionamento</label>
              <textarea
                value={selectedConnection.description || ''}
                placeholder="Ex: Comunicação de dependência «use»..."
                onChange={(e) =>
                  updateConnection(selectedConnection.id, { description: e.target.value })
                }
                rows={3}
                className="mt-1 w-full rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
              />
            </div>

            {/* Traffic / Velocity Slider */}
            <div>
              <div className="flex justify-between items-center text-[10px] uppercase text-slate-500 font-semibold">
                <span>Taxa de Tráfego / Partículas 3D</span>
                <span className="text-sky-600 dark:text-sky-400 font-bold">{selectedConnection.trafficRate || 6} req/s</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={selectedConnection.trafficRate || 6}
                onChange={(e) =>
                  updateConnection(selectedConnection.id, {
                    trafficRate: parseInt(e.target.value, 10),
                  })
                }
                className="mt-1.5 w-full accent-sky-500"
              />
            </div>

            {/* Delete Button */}
            <button
              onClick={() => removeConnection(selectedConnection.id)}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-semibold transition-colors mt-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir Ligação</span>
            </button>
          </div>
        </aside>
      )}

      {/* Start Options Modal: "Diagrama em Branco" ou "Abrir Presets da Aplicação" */}
      {showStartModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans"
          onClick={(e) => {
            if (e.target === e.currentTarget && diagram.nodes.length > 0) {
              setShowStartModal(false);
              setShowPresetsView(false);
            }
          }}
        >
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-7 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
            {/* Ambient background glows */}
            <div className="absolute -top-20 -right-20 h-44 w-44 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-600 dark:text-sky-400 font-bold">
                  Editor & Modelador 2D / 3D
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                  Como deseja iniciar?
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowStartModal(false);
                  setShowPresetsView(false);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Fechar e ir para o canvas"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!showPresetsView ? (
              /* Two Primary Choices */
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Selecione uma das opções abaixo para abrir seu espaço de trabalho no editor:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {/* Opção 1: Diagrama em Branco */}
                  <button
                    type="button"
                    onClick={() => {
                      clearDiagram();
                      resetCamera();
                      setShowStartModal(false);
                    }}
                    className="group relative flex flex-col items-start text-left p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-slate-850 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-200"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-500/40 text-sky-600 dark:text-sky-400 group-hover:scale-110 group-hover:bg-sky-200 dark:group-hover:bg-sky-900 transition-all">
                      <FilePlus className="h-6 w-6" />
                    </div>
                    <div className="mt-4 flex items-center justify-between w-full">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                        Diagrama em Branco
                      </h4>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-sky-600 dark:text-sky-400" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Inicie com um canvas vazio pronto para você arrastar nós da paleta, modelar arquiteturas personalizadas e visualizar em 2D e 3D em tempo real.
                    </p>
                    <div className="mt-4 inline-flex items-center text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:underline">
                      Iniciar canvas limpo →
                    </div>
                  </button>

                  {/* Opção 2: Abrir Presets da Aplicação */}
                  <button
                    type="button"
                    onClick={() => setShowPresetsView(true)}
                    className="group relative flex flex-col items-start text-left p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-slate-850 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-200"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900 transition-all">
                      <Boxes className="h-6 w-6" />
                    </div>
                    <div className="mt-4 flex items-center justify-between w-full">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                        Abrir Presets da Aplicação
                      </h4>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Explore arquiteturas pré-configuradas do sistema: UML ATM Caixa Eletrônico, Microsserviços Cloud, IA Generativa (RAG), IoT Smart Traffic e mais.
                    </p>
                    <div className="mt-4 inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                      Explorar 6 modelos prontos →
                    </div>
                  </button>
                </div>

                {diagram.nodes.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Diagrama atual: <strong className="text-slate-800 dark:text-slate-200">{diagram.name}</strong> ({diagram.nodes.length} nós)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowStartModal(false)}
                      className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                    >
                      Continuar edição atual
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Presets Browser View */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowPresetsView(false)}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <span>←</span>
                    <span>Voltar para opções iniciais</span>
                  </button>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {PRESET_DIAGRAMS.length} arquiteturas disponíveis
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {PRESET_DIAGRAMS.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        loadPreset(p.id);
                        setShowStartModal(false);
                        setShowPresetsView(false);
                      }}
                      className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-3.5 hover:border-sky-500 hover:bg-sky-50/40 dark:hover:bg-slate-800/60 transition-all group shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 text-[9px] uppercase font-bold text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
                          {p.type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {p.nodes.length} Nós
                        </span>
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                        {p.name}
                      </h4>
                      <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
