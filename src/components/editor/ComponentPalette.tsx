'use client';

import React from 'react';
import { NodeType } from '@/types/diagram';
import { NODE_VISUALS } from '@/lib/mappings/nodeTypes';
import {
  Server,
  Database,
  Laptop,
  Cloud,
  Radio,
  Network,
  Cpu,
  Layers,
  AlignJustify,
  HardDrive,
  GitFork,
  ShieldAlert,
  User,
  Zap,
  Plus,
  Box,
  Bot,
  Repeat,
  Workflow,
  BarChart,
  Thermometer,
  ToggleLeft,
  Play,
  Square,
  CheckSquare,
} from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (type: NodeType, name: string) => void;
}

const PALETTE_CATEGORIES = [
  {
    category: 'AI & Machine Learning',
    items: [
      { type: 'llm' as NodeType, name: 'Foundation LLM Core', icon: Cpu, hint: '3D Neural sphere with orbiting synapse rings' },
      { type: 'ai-agent' as NodeType, name: 'Autonomous Agent', icon: Bot, hint: '3D Reasoning orchestrator' },
      { type: 'rag' as NodeType, name: 'Hybrid RAG Pipeline', icon: Repeat, hint: '3D Retrieval bridge with vector chunks' },
      { type: 'vector-database' as NodeType, name: 'Pinecone Vector DB', icon: Database, hint: '3D Crystalline embeddings storage vault' },
    ],
  },
  {
    category: 'Data Engineering & Lakehouse',
    items: [
      { type: 'data-lakehouse' as NodeType, name: 'Delta Lakehouse', icon: Database, hint: '3D Hexagonal storage silo with data blocks' },
      { type: 'kafka' as NodeType, name: 'Kafka Event Stream', icon: Radio, hint: '3D Real-time distributed pub/sub bus' },
      { type: 'etl' as NodeType, name: 'Apache Spark ETL', icon: Workflow, hint: '3D High-throughput compute pipeline' },
      { type: 'bi-dashboard' as NodeType, name: 'Power BI Analytics', icon: BarChart, hint: '3D Executive metrics terminal' },
    ],
  },
  {
    category: 'IoT & Embedded Systems',
    items: [
      { type: 'esp32' as NodeType, name: 'ESP32 Dual-Core SoC', icon: Cpu, hint: '3D Microcontroller board with GPIO & status LED' },
      { type: 'arduino' as NodeType, name: 'Arduino Uno MCU', icon: Cpu, hint: '3D Embedded system logic board' },
      { type: 'temperature-sensor' as NodeType, name: 'DS18B20 Temp Sensor', icon: Thermometer, hint: '3D Precision telemetry sensor' },
      { type: 'actuator' as NodeType, name: 'Relay / Motor Actuator', icon: ToggleLeft, hint: '3D Solid-state electromechanical switch' },
    ],
  },
  {
    category: 'UML & Structural Architecture',
    items: [
      { type: 'uml-class' as NodeType, name: 'UML Class Component', icon: Box, hint: '3D Compartment box (class, attrs, methods)' },
      { type: 'uml-abstract-class' as NodeType, name: 'Abstract Class Entity', icon: Box, hint: '3D Structural base class with polymorphism' },
      { type: 'uml-interface' as NodeType, name: 'Interface Contract', icon: Layers, hint: '3D Open socket specification boundary' },
    ],
  },
  {
    category: 'BPMN & Business Workflows',
    items: [
      { type: 'bpmn-start' as NodeType, name: 'BPMN Start Event', icon: Play, hint: '3D Pulsing green process initiation node' },
      { type: 'bpmn-task' as NodeType, name: 'User / Business Task', icon: CheckSquare, hint: '3D Interactive procedural work unit' },
      { type: 'bpmn-exclusive-gateway' as NodeType, name: 'XOR Decision Gateway', icon: GitFork, hint: '3D 45° Rhombus decision prism with laser' },
      { type: 'bpmn-end' as NodeType, name: 'BPMN End Event', icon: Square, hint: '3D Red beacon process termination node' },
    ],
  },
  {
    category: 'Perimeter & Cloud Security',
    items: [
      { type: 'gateway' as NodeType, name: 'Cloud API Gateway', icon: Network, hint: '3D Holographic portal with laser beam' },
      { type: 'router' as NodeType, name: 'Network Router', icon: Radio, hint: '3D Router with RF signal wave rings' },
      { type: 'cloud' as NodeType, name: 'Cloud Infrastructure', icon: Cloud, hint: '3D Volumetric cluster with satellites' },
      { type: 'firewall' as NodeType, name: 'Edge WAF & Firewall', icon: ShieldAlert, hint: '3D Perimeter security defense node' },
      { type: 'load-balancer' as NodeType, name: 'Load Balancer', icon: GitFork, hint: '3D Traffic distributor prism' },
    ],
  },
  {
    category: 'Compute & Persistence',
    items: [
      { type: 'server' as NodeType, name: 'Compute Server Blade', icon: Server, hint: '3D Rack chassis with blinking LEDs' },
      { type: 'microservice' as NodeType, name: 'Microservice Pod', icon: Layers, hint: '3D Modular cube with spinning nucleus' },
      { type: 'database' as NodeType, name: 'PostgreSQL Database', icon: Database, hint: '3D Cylinders with magnetic flux ring' },
      { type: 'cache' as NodeType, name: 'Redis Cache Cluster', icon: Zap, hint: '3D High-speed memory cache tier' },
      { type: 'queue' as NodeType, name: 'Message Queue Bus', icon: AlignJustify, hint: '3D Conveyor with traveling data packets' },
      { type: 'laptop' as NodeType, name: 'Workstation Terminal', icon: Laptop, hint: '3D Workstation with terminal display' },
      { type: 'user' as NodeType, name: 'Human Client Actor', icon: User, hint: '3D Humanoid terminal avatar' },
    ],
  },
];

export function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  return (
    <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 p-4 font-mono text-xs flex flex-col h-full overflow-y-auto select-none transition-colors duration-200">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold">
          <Box className="h-4 w-4 text-sky-500 dark:text-sky-400" />
          <span>3D COMPONENT CATALOG</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
          Select any component to instantiate on the 2D canvas. Each immediately morphs into an authentic physical 3D asset.
        </p>
      </div>

      <div className="space-y-5 flex-1 pb-6">
        {PALETTE_CATEGORIES.map((cat) => (
          <div key={cat.category} className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400/80 tracking-wider">
              {cat.category}
            </span>

            <div className="space-y-1">
              {cat.items.map((item) => {
                const visual = NODE_VISUALS[item.type] || NODE_VISUALS.generic;
                return (
                  <button
                    key={item.type}
                    onClick={() => onAddComponent(item.type, item.name)}
                    className="w-full group flex items-start gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/50 p-2 text-left hover:border-sky-500/80 hover:bg-sky-50/50 dark:hover:bg-slate-800/60 transition-all active:scale-[0.98] shadow-sm dark:shadow-none"
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs"
                      style={{ color: visual.color }}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors truncate">
                          {item.name}
                        </span>
                        <Plus className="h-3 w-3 text-slate-400 group-hover:text-sky-500 transition-colors" />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.hint}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
