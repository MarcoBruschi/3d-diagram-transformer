'use client';

import React, { useRef, useState, useEffect, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useDiagramStore } from '@/store/useDiagramStore';
import { useLayersStore } from '@/store/useLayersStore';
import { NodeMesh } from '@/components/three/Nodes/NodeMesh';
import { SplineConnection } from '@/components/three/Connections/SplineConnection';
import {
  X,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Camera,
  AlertCircle,
  Eye,
  Scan,
} from 'lucide-react';

export function ARCameraViewer() {
  const setIsARActive = useDiagramStore((s) => s.setIsARActive);
  const diagram = useDiagramStore((s) => s.diagram);
  const layers = useLayersStore((s) => s.layers);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // AR Transform State: Rotation (Euler radians) and Scale
  const [rotation, setRotation] = useState<{ x: number; y: number }>({ x: 0.15, y: -0.2 });
  const [scale, setScale] = useState<number>(0.65);

  // Gesture Tracking Refs
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchDistRef = useRef<number | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const lastMouseRef = useRef<{ x: number; y: number } | null>(null);

  // Filter nodes according to current active layers
  const filteredNodes = diagram.nodes.filter((node) => {
    if (node.layer && !layers[node.layer]) return false;
    return true;
  });

  // Start Rear Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Seu navegador não suporta acesso à câmera.');
      return;
    }

    try {
      // Ideal environment facingMode for rear AR camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch((err) => {
          console.warn('[AR Video Autoplay Warning]:', err);
        });
      }
      setCameraReady(true);
    } catch (err: any) {
      console.error('[AR Camera Initialization Error]:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permissão para acessar a câmera foi negada. Conceda permissão no navegador.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Nenhuma câmera traseira compatível foi encontrada no dispositivo.');
      } else {
        setCameraError(err.message || 'Falha ao acessar a câmera do dispositivo.');
      }
    }
  }, []);

  // Cleanup camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleCloseAR = useCallback(() => {
    stopCamera();
    setIsARActive(false);
  }, [stopCamera, setIsARActive]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Touch Gesture Handlers (1-finger rotation & 2-finger pinch scale)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastPinchDistRef.current = null;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastPinchDistRef.current = dist;
      lastTouchRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && lastTouchRef.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;

      setRotation((prev) => ({
        x: Math.max(-Math.PI / 2.8, Math.min(Math.PI / 2.8, prev.x + dy * 0.007)),
        y: prev.y + dx * 0.007,
      }));

      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastPinchDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / lastPinchDistRef.current;
      setScale((prev) => Math.max(0.15, Math.min(3.0, prev * ratio)));
      lastPinchDistRef.current = dist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      lastTouchRef.current = null;
      lastPinchDistRef.current = null;
    } else if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastPinchDistRef.current = null;
    }
  };

  // Mouse drag handlers for desktop emulators / debugging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isMouseDownRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !lastMouseRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;

    setRotation((prev) => ({
      x: Math.max(-Math.PI / 2.8, Math.min(Math.PI / 2.8, prev.x + dy * 0.007)),
      y: prev.y + dx * 0.007,
    }));

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    lastMouseRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    setScale((prev) => Math.max(0.15, Math.min(3.0, prev - e.deltaY * 0.001)));
  };

  const handleZoomIn = () => setScale((s) => Math.min(3.0, +(s + 0.15).toFixed(2)));
  const handleZoomOut = () => setScale((s) => Math.max(0.15, +(s - 0.15).toFixed(2)));
  const handleReset = () => {
    setRotation({ x: 0.15, y: -0.2 });
    setScale(0.65);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black select-none overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Real Mobile Rear Camera Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* AR Surface Reticle / Alignment Guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="relative w-64 h-64 border border-dashed border-sky-400/50 rounded-full animate-pulse flex items-center justify-center">
          <Scan className="h-12 w-12 text-sky-400" />
        </div>
      </div>

      {/* 3D Scene Layer (Transparent Canvas over Video Feed) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Canvas
          camera={{ position: [0, 2.5, 9], fov: 45, near: 0.1, far: 100 }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
        >
          {/* Vivid, realistic lighting for physical environment contrast */}
          <ambientLight intensity={1.8} />
          <directionalLight position={[5, 10, 5]} intensity={2.2} />
          <directionalLight position={[-5, 4, -5]} intensity={1.0} />
          <pointLight position={[0, 6, 0]} intensity={1.2} />

          <Suspense fallback={null}>
            <group
              position={[0, -0.4, 0]}
              rotation={[rotation.x, rotation.y, 0]}
              scale={[scale, scale, scale]}
            >
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
            </group>
          </Suspense>
        </Canvas>
      </div>

      {/* Top Floating Control Bar */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-3 sm:p-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white text-xs font-mono shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-semibold tracking-wide">AR ATIVA</span>
            <span className="hidden sm:inline text-white/50 text-[10px]">• Câmera Traseira</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/80 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>Arraste com 1 dedo para girar • Pinça para zoom</span>
          </div>
        </div>

        {/* Close AR Button */}
        <button
          onClick={handleCloseAR}
          className="flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] min-w-[44px] rounded-xl bg-rose-600/90 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold font-mono shadow-xl backdrop-blur-md border border-rose-400/40 transition-all shrink-0"
          aria-label="Encerrar AR"
        >
          <X className="h-5 w-5" />
          <span>Encerrar AR</span>
        </button>
      </div>

      {/* Bottom Floating Ergonomic Controls */}
      <div className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center gap-2 p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pointer-events-auto">
        {/* Interaction Hint for mobile */}
        <div className="md:hidden px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] text-white/80 text-center font-mono">
          <span>Gire com 1 dedo • Aproxime/afaste com 2 dedos</span>
        </div>

        {/* Tactile Control Pill */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/20 shadow-2xl font-mono text-white">
          <button
            onClick={handleZoomOut}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
            title="Reduzir Escala"
            aria-label="Reduzir Escala"
          >
            <Minus className="h-5 w-5" />
          </button>

          <div className="px-3 py-1 text-center min-w-[64px]">
            <span className="text-[10px] text-white/50 uppercase block">Escala</span>
            <span className="text-xs font-bold text-sky-400">{Math.round(scale * 100)}%</span>
          </div>

          <button
            onClick={handleZoomIn}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
            title="Aumentar Escala"
            aria-label="Aumentar Escala"
          >
            <Plus className="h-5 w-5" />
          </button>

          <div className="h-6 w-px bg-white/20 mx-1" />

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white text-xs font-semibold"
            title="Centralizar Arquitetura na Mesa"
            aria-label="Centralizar Arquitetura"
          >
            <RotateCcw className="h-4 w-4 text-sky-400" />
            <span className="hidden sm:inline">Centralizar</span>
          </button>
        </div>
      </div>

      {/* Camera Error Modal / Overlay */}
      {cameraError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono select-none">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-slate-950 p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Acesso à Câmera Necessário</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">{cameraError}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={startCamera}
                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg transition-all"
              >
                Tentar Novamente
              </button>
              <button
                onClick={handleCloseAR}
                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
              >
                Voltar ao Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
