'use client';

import React from 'react';
import { EffectComposer, ChromaticAberration, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

export function PostProcessing() {
  const aberrationOffset = React.useMemo(() => new THREE.Vector2(0.0006, 0.0006), []);

  return (
    <EffectComposer multisampling={0}>
      <ChromaticAberration
        offset={aberrationOffset}
        radialModulation={true}
        modulationOffset={0.15}
      />
      <Noise opacity={0.03} />
    </EffectComposer>
  );
}
