uniform vec3 uColorGridPrimary;
uniform vec3 uColorGridSecondary;
uniform vec3 uColorBg;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uCameraPos;

varying vec2 vUv;
varying vec3 vWorldPos;

float getGrid(vec2 coord, float size, float lineWidth) {
  vec2 grid = abs(fract(coord / size - 0.5) - 0.5) / (fwidth(coord / size) * lineWidth);
  return 1.0 - min(min(grid.x, grid.y), 1.0);
}

void main() {
  vec2 gridCoord = vWorldPos.xz;

  // Grade maior (módulos primários de 3.0 unidades)
  float primaryGrid = getGrid(gridCoord, 3.0, 1.2);
  // Grade técnica secundária (sub-módulos de 0.75 unidades)
  float secondaryGrid = getGrid(gridCoord, 0.75, 0.8) * 0.35;

  float gridFactor = max(primaryGrid, secondaryGrid);

  // Gradiente laser entre Ciano #00F0FF e Sky #38BDF8
  vec3 gridColor = mix(uColorGridSecondary, uColorGridPrimary, primaryGrid);

  // Névoa linear de distância matemática (distance fog)
  float dist = length(vWorldPos - uCameraPos);
  float fogFactor = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);

  vec3 finalColor = mix(gridColor, uColorBg, fogFactor);
  float alpha = mix(gridFactor * 0.85, 0.0, fogFactor);

  gl_FragColor = vec4(finalColor, alpha);
}
