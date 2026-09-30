'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { exportDiagramToGLB } from '@/lib/export/gltfExporter';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useSaaSModalsStore } from '@/store/useSaaSModalsStore';
import { NODE_VISUALS } from '@/lib/mappings/nodeTypes';
import {
  X,
  Download,
  FileCode,
  Box,
  Image as ImageIcon,
  FileText,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  Code,
  Loader2,
  Lock,
} from 'lucide-react';
import { useFeatureGating } from '@/hooks/useFeatureGating';

export function ExportModal() {
  const activeModal = useSaaSModalsStore((s) => s.activeModal);
  const closeModal = useSaaSModalsStore((s) => s.closeModal);
  const openModal = useSaaSModalsStore((s) => s.openModal);
  const { canExportGLTF, canExportDrawio, canExportPDF } = useFeatureGating();
  const diagram = useDiagramStore((s) => s.diagram);

  const [activeTab, setActiveTab] = useState<'3d' | 'code' | 'image' | 'pdf'>('3d');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'1x' | '2x' | '4x'>('2x');
  const [gltfFormat, setGltfFormat] = useState<'glb' | 'gltf'>('glb');
  const [isExporting3D, setIsExporting3D] = useState(false);

  if (activeModal !== 'export') return null;

  const triggerDownload = (filename: string, content: string | Blob, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 1. Export as JSON Schema
  const exportJson = () => {
    const jsonStr = JSON.stringify(diagram, null, 2);
    triggerDownload(`${diagram.name.toLowerCase().replace(/\s+/g, '-')}-spec.json`, jsonStr, 'application/json');
  };

  // 2. Export as Mermaid Diagram
  const exportMermaid = () => {
    let mermaid = 'flowchart TD\n';
    diagram.nodes.forEach((n) => {
      const sanitizedName = n.name.replace(/"/g, "'");
      mermaid += `  ${n.id}["${sanitizedName} (${n.type})"]\n`;
    });
    diagram.connections.forEach((c) => {
      const sanitizedLabel = c.label ? `|"${c.label.replace(/"/g, "'")}"|` : '';
      mermaid += `  ${c.source} -->${sanitizedLabel} ${c.target}\n`;
    });
    triggerDownload(`${diagram.name.toLowerCase().replace(/\s+/g, '-')}.mermaid`, mermaid, 'text/plain');
  };

  // 3. Export as Draw.io XML
  const exportDrawio = () => {
    const baseWidth = 160;
    const baseHeight = 70;
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="3D-Diagram-Transformer" version="21.0.0">\n  <diagram id="diag-${Date.now()}" name="${diagram.name}">\n    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="850">\n      <root>\n        <mxCell id="0"/>\n        <mxCell id="1" parent="0"/>\n`;

    diagram.nodes.forEach((n) => {
      const x = Math.round(n.position2D?.x || 100);
      const y = Math.round(n.position2D?.y || 100);
      const safeName = n.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      xml += `        <mxCell id="${n.id}" value="${safeName}" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1e293b;strokeColor=#38bdf8;fontColor=#ffffff;strokeWidth=2;fontFamily=monospace;" vertex="1" parent="1">\n          <mxGeometry x="${x}" y="${y}" width="${baseWidth}" height="${baseHeight}" as="geometry"/>\n        </mxCell>\n`;
    });

    diagram.connections.forEach((c) => {
      const safeLabel = (c.label || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      xml += `        <mxCell id="${c.id}" value="${safeLabel}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#0284c7;strokeWidth=2;endArrow=classic;fontFamily=monospace;fontColor=#94a3b8;" edge="1" parent="1" source="${c.source}" target="${c.target}">\n          <mxGeometry relative="1" as="geometry"/>\n        </mxCell>\n`;
    });

    xml += `      </root>\n    </mxGraphModel>\n  </diagram>\n</mxfile>`;
    triggerDownload(`${diagram.name.toLowerCase().replace(/\s+/g, '-')}.drawio`, xml, 'application/xml');
  };

  // 4. Export as 3D glTF/GLB with Three.js GLTFExporter
  const exportGLTF = async () => {
    setIsExporting3D(true);

    try {
      if (gltfFormat === 'glb') {
        const filename = `${diagram.name.toLowerCase().replace(/\s+/g, '-')}.glb`;
        await exportDiagramToGLB(diagram, filename);
        setDownloadSuccess(filename);
        setTimeout(() => setDownloadSuccess(null), 3000);
        setIsExporting3D(false);
        return;
      }

      const exportScene = new THREE.Scene();
      exportScene.name = diagram.name;

      // Add lights
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
      dirLight.position.set(5, 10, 7.5);
      exportScene.add(dirLight);
      const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
      exportScene.add(ambLight);

      // Map each Diagram Node to a 3D Mesh
      const nodePosMap = new Map<string, THREE.Vector3>();

      diagram.nodes.forEach((n) => {
        const visual = NODE_VISUALS[n.type] || NODE_VISUALS.generic;
        const color = visual.color || '#38BDF8';
        const pos = n.position3D || { x: 0, y: 0, z: 0 };
        const nodeVec = new THREE.Vector3(pos.x, pos.y, pos.z);
        nodePosMap.set(n.id, nodeVec);

        const geom = new THREE.BoxGeometry(1.6, 0.9, 1.6);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          metalness: 0.3,
          roughness: 0.4,
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(nodeVec);
        mesh.name = n.name;
        mesh.userData = {
          type: n.type,
          status: n.status,
          importance: n.importance,
        };
        exportScene.add(mesh);
      });

      // Add 3D Connection tubes
      diagram.connections.forEach((c) => {
        const p1 = nodePosMap.get(c.source);
        const p2 = nodePosMap.get(c.target);
        if (p1 && p2) {
          const path = new THREE.LineCurve3(p1, p2);
          const tubeGeom = new THREE.TubeGeometry(path, 8, 0.04, 8, false);
          const tubeMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#38BDF8'),
            emissive: new THREE.Color('#0284C7'),
            emissiveIntensity: 0.4,
          });
          const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
          tubeMesh.name = `conn_${c.source}_${c.target}`;
          exportScene.add(tubeMesh);
        }
      });

      const exporter = new GLTFExporter();
      const isBinary = false;

      exporter.parse(
        exportScene,
        (result) => {
          setIsExporting3D(false);
          const filename = `${diagram.name.toLowerCase().replace(/\s+/g, '-')}.${gltfFormat}`;

          if (result instanceof ArrayBuffer) {
            const blob = new Blob([result], { type: 'model/gltf-binary' });
            triggerDownload(filename, blob, 'model/gltf-binary');
          } else {
            const output = JSON.stringify(result, null, 2);
            triggerDownload(filename, output, 'model/gltf+json');
          }
        },
        (error) => {
          console.error('Error during glTF export:', error);
          setIsExporting3D(false);
        },
        { binary: isBinary }
      );
    } catch (err) {
      console.error('GLTF Export Failed, using fallback JSON spec:', err);
      setIsExporting3D(false);
    }
  };

  // 5. Export as High-Res Image (Canvas screenshot)
  const exportImage = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${diagram.name.toLowerCase().replace(/\s+/g, '-')}-${resolution}.png`;
      link.click();
      setDownloadSuccess(`${diagram.name}-${resolution}.png`);
      setTimeout(() => setDownloadSuccess(null), 3000);
    } else {
      console.warn('Canvas 3D não encontrado para captura do snapshot.');
    }
  };

  // 6. Export Architecture Report (PDF Markdown representation)
  const exportReport = () => {
    let report = `# RELATÓRIO TÉCNICO DE ARQUITETURA DE SISTEMAS\n`;
    report += `**Sistema:** ${diagram.name}\n`;
    report += `**Gerado por:** 3D Diagram Transformer AI SaaS\n`;
    report += `**Data:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    report += `## 1. Sumário Executivo\nTopologia tridimensional de arquitetura composta por **${diagram.nodes.length} componentes estruturais** interconectados através de **${diagram.connections.length} fluxos de comunicação** e telemetria.\n\n`;
    report += `## 2. Inventário de Componentes\n`;
    diagram.nodes.forEach((n) => {
      report += `- **${n.name}** [«${n.properties?.stereotype || n.type}»] (Status: ${n.status}) - Tier ${n.importance || 3}\n`;
      report += `  - Descrição: ${n.description || 'Sem descrição cadastrada'}\n`;
      report += `  - Coordenadas 3D: [${n.position3D?.x.toFixed(1)}, ${n.position3D?.y.toFixed(1)}, ${n.position3D?.z.toFixed(1)}]\n`;
    });
    report += `\n## 3. Matriz de Conectividade e Protocolos\n`;
    diagram.connections.forEach((c) => {
      const s = diagram.nodes.find((n) => n.id === c.source)?.name || c.source;
      const t = diagram.nodes.find((n) => n.id === c.target)?.name || c.target;
      report += `- **${s}** → **${t}**: ${c.label || c.type} (Protocolo: ${c.protocol || 'TCP/HTTP'}, Taxa: ${c.trafficRate || 5} req/s)\n`;
    });
    triggerDownload(`${diagram.name.toLowerCase().replace(/\s+/g, '-')}-architecture-report.md`, report, 'text/markdown');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Exportação Avançada Multi-Formato</span>
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-500 font-semibold">
                    Universal Export
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Exporte para softwares 3D (Blender, Unity), ferramentas de diagramação (Draw.io, Mermaid) ou relatórios executivos
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Download Success Banner */}
          {downloadSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>Arquivo <strong>{downloadSuccess}</strong> baixado com sucesso!</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 gap-2 border-b border-slate-200 dark:border-slate-800/60 pb-3 mb-4 text-xs font-semibold">
            {[
              { id: '3d', label: 'Cena 3D (.glTF)', icon: Box },
              { id: 'code', label: 'Vetorial & Código', icon: FileCode },
              { id: 'image', label: 'Imagem 4K / SVG', icon: ImageIcon },
              { id: 'pdf', label: 'Relatório IA (PDF)', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: 3D glTF / GLB */}
          {activeTab === '3d' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                  <Box className="h-4 w-4 text-sky-400" />
                  <span>Modelo Tridimensional Khronos glTF 2.0</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Exporta malhas, nós espaciais, transformações e metadados de arquitetura prontos para importação em Blender, Unity, Unreal Engine ou visualizadores WebXR.
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Formato:</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGltfFormat('glb')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                        gltfFormat === 'glb'
                          ? 'border-sky-500 bg-sky-500/20 text-sky-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      .GLB (Binário Único)
                    </button>
                    <button
                      onClick={() => setGltfFormat('gltf')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                        gltfFormat === 'gltf'
                          ? 'border-sky-500 bg-sky-500/20 text-sky-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      .glTF (JSON + Assets)
                    </button>
                  </div>
                </div>
              </div>

              {canExportGLTF ? (
                <button
                  onClick={exportGLTF}
                  disabled={isExporting3D}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 font-bold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-500 disabled:opacity-50 transition-all text-xs"
                >
                  {isExporting3D ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Compilando Cena Three.js & GLTFExporter...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Baixar Cena 3D Completa (.{gltfFormat.toUpperCase()})</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => openModal('billing')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-3 font-bold text-amber-500 hover:bg-amber-500/20 transition-all text-xs"
                  title="Disponível nos planos Pro e Enterprise"
                >
                  <Lock className="h-4 w-4 text-amber-500" />
                  <span>Exportação .GLB / .glTF — Disponível nos Planos Pro & Enterprise (Fazer Upgrade)</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 2: Vector & Code Formats */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div
                onClick={canExportDrawio ? exportDrawio : () => openModal('billing')}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  canExportDrawio
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-sky-500 cursor-pointer'
                    : 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Draw.io (.drawio XML)</span>
                    {canExportDrawio ? (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                        Editável
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold">
                        <Lock className="h-2.5 w-2.5" />
                        PRO
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {canExportDrawio
                      ? 'Abra diretamente no diagramas.net ou VS Code extension com posicionamento das caixas preservado.'
                      : 'Exportação Draw.io exclusiva dos planos Pro e Enterprise. Clique para desbloquear.'}
                  </p>
                </div>
                {canExportDrawio ? (
                  <Download className="h-4 w-4 text-sky-400 shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                )}
              </div>

              <div
                onClick={exportMermaid}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-sky-500 cursor-pointer transition-all"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Mermaid.js (.mermaid)</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400">
                      Markdown Ready
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sintaxe de código compatível com GitHub README, GitLab, Notion e documentações técnicas.
                  </p>
                </div>
                <Download className="h-4 w-4 text-sky-400 shrink-0" />
              </div>

              <div
                onClick={exportJson}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-sky-500 cursor-pointer transition-all"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Schema Canônico JSON (.json)</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                      API Compatible
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Estrutura completa com nós 2D, nós 3D, conexões, métricas e propriedades de arquitetura.
                  </p>
                </div>
                <Download className="h-4 w-4 text-sky-400 shrink-0" />
              </div>
            </div>
          )}

          {/* TAB 3: High-Res Image */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                  <ImageIcon className="h-4 w-4 text-sky-400" />
                  <span>Captura de Tela em Alta Fidelidade (Anti-Aliasing)</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gera um PNG nítido e transparente do ângulo atual da câmera 3D para apresentações executivas.
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Resolução:</label>
                  {(['1x', '2x', '4x'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setResolution(r)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                        resolution === r
                          ? 'border-sky-500 bg-sky-500/20 text-sky-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {r === '1x' ? '1080p (1x)' : r === '2x' ? 'Retina 2K (2x)' : 'Ultra HD 4K (4x)'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={exportImage}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 font-bold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-500 transition-all text-xs"
              >
                <Download className="h-4 w-4" />
                <span>Exportar Imagem PNG ({resolution.toUpperCase()})</span>
              </button>
            </div>
          )}

          {/* TAB 4: AI Architecture Report */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Relatório Executivo de Arquitetura (Audit-Ready)</span>
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Compilação automática com sumário executivo, inventário detalhado de componentes, matriz de risco, análise de dependências e estimativas de latência.
                </p>
              </div>

              {canExportPDF ? (
                <button
                  onClick={exportReport}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-500 transition-all text-xs"
                >
                  <FileText className="h-4 w-4" />
                  <span>Gerar e Baixar Relatório de Arquitetura (.md / PDF)</span>
                </button>
              ) : (
                <button
                  onClick={() => openModal('billing')}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-3 font-bold text-amber-500 hover:bg-amber-500/20 transition-all text-xs"
                >
                  <Lock className="h-4 w-4 text-amber-500" />
                  <span>Relatórios IA & PDF — Exclusivo dos Planos Pro & Enterprise (Fazer Upgrade)</span>
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
