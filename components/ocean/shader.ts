export const VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const FRAG = `
precision highp float;

uniform float uTime, uWaterline, uTurb, uPlunge, uMouseVel, uAspect, uOct, uRipple;
uniform vec2  uMouse;        // 0..1, y up, init (-1., -1.)
uniform vec3  uSky;          // surface.bgTop
uniform vec3  uBg[5];        // bgAt() at the 5 viewport rows, top → bottom; uBg[0] = top
uniform vec4  uFx;           // rays, caustics, snow, glow at viewport centre
uniform int   uDebug;        // 0 = off

varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}

float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    if (float(i) >= uOct) break;
    s += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return s;
}

// Constant indices only — dynamic indexing of a uniform array is not portable in ES 1.00.
vec3 bgAt(float y) {
  float s = clamp((1.0 - y) * 4.0, 0.0, 4.0);
  vec3 c = mix(uBg[0], uBg[1], clamp(s,       0.0, 1.0));
  c = mix(c, uBg[2], clamp(s - 1.0, 0.0, 1.0));
  c = mix(c, uBg[3], clamp(s - 2.0, 0.0, 1.0));
  c = mix(c, uBg[4], clamp(s - 3.0, 0.0, 1.0));
  return c;
}

void main() {
  float t = uTime;
  vec2  m = vUv - uMouse, ma = m * vec2(uAspect, 1.0);
  vec2  uv = vUv + m * exp(-dot(ma, ma) * 30.0) * uRipple * (1.0 + uMouseVel);
  uv += sin(uv.yx * 10.0 + t * 2.0) * uTurb * 0.01;

  float wl = uWaterline + 0.012 * sin(uv.x * 6.0 + t * 1.5)
                        + 0.005 * sin(uv.x * 17.0 - t * 2.3);
  float under = 1.0 - smoothstep(wl - 0.003, wl + 0.003, uv.y);

  vec3 water = bgAt(vUv.y);
  // Layer 1: Flow
  water += (fbm(uv * vec2(2.5, 1.5) + vec2(t * 0.05, 0.0)) - 0.5) * 0.08 * (1.0 + uTurb);

  // Layer 2: Caustics — two passes of abs(sin) lattice on warped uv, strength uFx.y * vUv.y (multiply only)
  if (uFx.y > 0.001) {
    float n1 = (noise(uv * 3.0 + vec2(t * 0.05, 0.0)) - 0.5) * 0.5;
    float n2 = (noise(uv * 4.5 - vec2(0.0, t * 0.05)) - 0.5) * 0.5;
    vec2 cUv1 = uv * 8.0 + vec2(t * 0.15 + n1, t * 0.1 + n1 * 0.7);
    vec2 cUv2 = uv * 13.0 - vec2(t * 0.1 - n2 * 0.7, t * 0.15 + n2);
    float c1 = abs(sin(cUv1.x + sin(cUv1.y * 1.2)));
    float c2 = abs(sin(cUv2.y + sin(cUv2.x * 1.2)));
    float caustics = (c1 + c2) * 0.5;
    water *= 1.0 + caustics * (uFx.y * vUv.y * 0.6);
  }

  // Layer 3: God rays — soft bands along uv.x + (uWaterline - uv.y) * 0.3, slow sway, strength uFx.x
  if (uFx.x > 0.001) {
    float rayAngle = uv.x + (uWaterline - uv.y) * 0.3;
    float sway = sin(t * 0.4 + uv.y * 2.0) * 0.04;
    float rayCoord = rayAngle + sway;
    float rayNoise = noise(vec2(rayCoord * 3.5, t * 0.08));
    float rayBand = sin(rayCoord * 10.0 + rayNoise * 2.0) * 0.5 + 0.5;
    float rays = smoothstep(0.25, 0.75, rayBand) * (0.4 + 0.6 * clamp(vUv.y, 0.0, 1.0));
    water += vec3(0.12, 0.18, 0.22) * (rays * uFx.x);
  }

  // Layer 4: Marine snow — hash-grid particles, 2 parallax layers drifting up, count uFx.z * T.snowMax (20)
  if (uFx.z > 0.01) {
    float snowCount = uFx.z * 20.0;
    float snowFlutter = (noise(uv * 3.0 + vec2(0.0, -t * 0.05)) - 0.5) * 0.008;
    float snowAcc = 0.0;
    for (int i = 0; i < 20; i++) {
      if (float(i) >= snowCount) break;
      float fi = float(i);
      float h1 = hash(vec2(fi * 1.73 + 0.1, fi * 3.17 + 0.2));
      float h2 = hash(vec2(fi * 2.39 + 0.3, fi * 1.91 + 0.4));
      float h3 = hash(vec2(fi * 3.41 + 0.5, fi * 2.83 + 0.6));
      float col = mod(fi, 5.0);
      float row = floor(fi / 5.0);
      vec2 basePos = vec2((col + 0.15 + 0.7 * h1) / 5.0, (row + 0.15 + 0.7 * h2) / 4.0);
      float layer = mod(fi, 2.0);
      float speed = mix(0.045, 0.02, layer);
      float y = fract(basePos.y + t * speed);
      float x = fract(basePos.x + sin(t * 0.6 + h3 * 6.28) * 0.015 + snowFlutter);
      float radius = mix(0.0035, 0.002, layer);
      vec2 delta = vec2(fract(uv.x - x + 0.5) - 0.5, fract(uv.y - y + 0.5) - 0.5);
      delta.x *= uAspect;
      float d = length(delta);
      float flake = smoothstep(radius, 0.0, d);
      snowAcc += flake * mix(1.0, 0.6, layer);
    }
    // Colour is text-adjacent, never pure white (C4 allowance)
    water += vec3(0.12, 0.15, 0.18) * (clamp(snowAcc, 0.0, 1.0) * uFx.z);
  }

  // Layer 7: Foam — thin bright line at wl, only when uWaterline is on screen
  if (uWaterline > -0.1 && uWaterline < 1.2) {
    float foamDist = abs(uv.y - wl);
    float foam = (1.0 - smoothstep(0.0, 0.004, foamDist)) * 0.45;
    water = mix(water, vec3(0.85, 0.95, 1.0), foam);
  }

  if (uDebug == 1) {
    gl_FragColor = vec4(vec3(under), 1.0);
    return;
  }

  gl_FragColor = vec4(mix(uSky, water, under), 1.0);
}
`;
