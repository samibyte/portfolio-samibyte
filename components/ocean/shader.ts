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
