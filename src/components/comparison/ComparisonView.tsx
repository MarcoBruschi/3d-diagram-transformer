'use client';

import React, { useState } from 'react';
import { Diagram2DCanvas } from '../diagram-2d/Diagram2DCanvas';
import { DiagramCanvas } from '../three/Scene/DiagramCanvas';
import { Columns, SplitSquareVertical } from 'lucide-react';

export function ComparisonView() {
  const [splitPos, setSplitPos] = useState(50); // percentage

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 px-4 py-2 font-mono text-xs text-slate-600 dark:text-slate-400 backdrop-blur-md z-10 transition-colors duration-200">
        <div className="flex items-center gap-2">
          <SplitSquareVertical className="h-4 w-4 text-sky-500 dark:text-sky-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">SEMANTIC 2D / 3D COGNITIVE PAIRING</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-500 dark:text-slate-400">Left: 2D Schematic Specification</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-sky-600 dark:text-sky-400 font-semibold">Right: 3D Physical Spatial Twin</span>
        </div>
      </div>

      {/* Side-by-Side Dual View Container */}
      <div className="relative flex-1 flex w-full h-full overflow-hidden">
        {/* Left Side: 2D Blueprint */}
        <div
          className="relative h-full border-r border-slate-200 dark:border-slate-800 overflow-hidden"
          style={{ width: `${splitPos}%` }}
        >
          <div className="absolute top-3 left-4 z-10 rounded bg-white/90 dark:bg-slate-900/80 px-2 py-0.5 font-mono text-[10px] tracking-wider text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-xs">
            2D BLUEPRINT VIEW
          </div>
          <Diagram2DCanvas />
        </div>

        {/* Center Split Slider Drag Handle */}
        <div
          className="absolute top-0 bottom-0 z-20 w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-sky-500 cursor-col-resize transition-colors"
          style={{ left: `calc(${splitPos}% - 3px)` }}
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startPos = splitPos;
            const onMouseMove = (moveEvent: MouseEvent) => {
              const delta = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
              setSplitPos(Math.min(80, Math.max(20, startPos + delta)));
            };
            const onMouseUp = () => {
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
            };
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
        >
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 h-8 w-5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-sm flex items-center justify-center">
            <Columns className="h-3 w-3 text-slate-500 dark:text-slate-400" />
          </div>
        </div>

        {/* Right Side: 3D Physical Model */}
        <div className="relative h-full flex-1 overflow-hidden">
          <div className="absolute top-3 left-4 z-10 rounded bg-white/90 dark:bg-slate-900/80 px-2 py-0.5 font-mono text-[10px] tracking-wider text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-900/50 shadow-xs">
            3D SPATIAL TWIN
          </div>
          <DiagramCanvas />
        </div>
      </div>
    </div>
  );
}
