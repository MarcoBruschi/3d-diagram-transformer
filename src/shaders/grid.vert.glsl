uniform float uTime;
uniform vec2 uMouse;
varying vec2 vUv;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec3 pos = position;

  // Converte posição normalizada do mouse [-1, 1] em coordenadas espaciais
  vec2 mouseWorld = uMouse * 16.0;
  float dist = length(pos.xy - mouseWorld);

  // Deformação sutil ondulatória de blueprint tático amortecida com a distância
  float wave = sin(dist * 0.65 - uTime * 2.2) * exp(-dist * 0.12);
  pos.z += wave * 0.4;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
