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
uniform float uWaveAmp, uBandDepth, uBandLight, uSkyHorizon;
uniform vec2  uMouse;        // 0..1, y up, init (-1., -1.)
uniform vec3  uSky;          // surface.bgTop (zenith)
uniform vec3  uWaterTop;     // surface.bgBot (water top)
uniform vec3  uAccent;       // surface.accent, decorative: sun only
uniform vec3  uBg[5];        // bgAt() at the 5 viewport rows, top -> bottom; uBg[0] = top
uniform vec4  uFx;           // rays, caustics, snow, glow at viewport centre
uniform vec4  uWaveFreq, uWaveSpeed;
uniform vec4  uSun, uCloud, uDepth, uFlow, uFoam, uRippleCfg;
uniform int   uDebug;        // 0 = off, 1 = under mask, 11 = sky+surface (P8.2)

varying vec2 vUv;

// Noise budget (P8): <= 12 taps/pixel at uOct = 4.
//   flow fbm ............. 4   (uOct, rotated octaves; drives flow, foam and mirror band)
//   sky clouds ........... 3   (one 3-octave field reused by four cloud envelopes)
//   refraction warp ...... 2   (P8.3)
//   god rays ............. 1   (P8.3)
//   particle flutter ..... 1   (P8.4)
//   caustics, glow ....... 0   (analytic lattice / sine wander)
//   total ............... 11
// Named geometric constants (not tuning): deep-water factor 0.30, fbm mean 0.47,
// mask AA half-width 0.0015, foam asymmetry 2.6 / 0.55, cloud sphere 0.42.
// Worst case per pixel is 11 (flow + caustics + rays + one sky cloud field);
// the water lattice is also evaluated above the waterline and discarded by the
// mix, so the sky path is not cheaper than this table. Keep the total at 11.

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}

// Rotated octaves: without the rotation the hash lattice shows axis-aligned blocks.
const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);

float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    if (float(i) >= uOct) break;
    s += a * noise(p);
    p = ROT * p * 2.03 + 19.19;
    a *= 0.5;
  }
  return s;
}

// Sky-only cloud field: max 3 taps regardless of uOct (tier 1/2 drop to 2).
float cloudField(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) {
    if (float(i) >= uOct) break;
    s += a * noise(p);
    p = ROT * p * 2.03 + 7.31;
    a *= 0.5;
  }
  return s;
}

// Asymmetric cloud envelope: dome on top, flatter base (reference: CloudShader).
float cloudEnv(vec2 q, vec2 r) {
  float ry = q.y > 0.0 ? r.y : r.y * 0.42;
  return 1.0 - length(vec2(q.x / r.x, q.y / ry));
}

// One cloud, shaded analytically (no second density tap for self-shadow):
// tops lit, bases fall toward the sky, thin rim brightened, distance fogged.
vec3 shadeCloud(vec3 color, vec3 sky, vec2 sp, vec2 c, vec2 r,
                float n, float puff, float dist) {
  vec2 q = sp - c;
  float env = cloudEnv(q, r);
  if (env < -0.35) return color;

  float detail = mix(n, puff, 0.5);
  float d = env + (detail - 0.55) * 0.95;
  if (d < 0.02) return color;

  float h = q.y / max(0.001, r.y);
  float litF = smoothstep(-0.35, 0.55, h);
  vec3 lit = mix(uSky, vec3(1.0), 0.85);
  vec3 shade = uSky * mix(uCloud.z, 1.0, 0.35);
  vec3 cloudCol = mix(shade, lit, litF);

  float rim = smoothstep(0.02, 0.12, d) * (1.0 - smoothstep(0.12, 0.40, d));
  cloudCol += rim * 0.08;
  cloudCol = mix(cloudCol, sky, dist * 0.35);

  float alpha = smoothstep(0.02, 0.34, d) * mix(1.0, 0.8, dist);
  return mix(color, cloudCol, alpha * uCloud.x);
}

vec3 cloudPass(vec3 color, vec3 sky, vec2 sp, float t, float spd, float phase,
               float y, vec2 r, float dist, float n, float puff) {
  float cx = mix(-r.x - 0.25, uAspect + r.x + 0.25, fract(t * spd + phase));
  float cy = y + sin(t * 0.05 + phase * 6.2831) * 0.012;
  return shadeCloud(color, sky, sp, vec2(cx, cy), r, n, puff, dist);
}

// Sky (top 30% at scroll 0): zenith -> bright horizon, cloud ranks, sun.
vec3 skyLayer(vec2 uv2, float wl, float t) {
  float skyN = clamp((uv2.y - wl) / max(0.02, 1.0 - wl), 0.0, 1.0);
  vec3 sky = mix(uSky, vec3(1.0), uSkyHorizon * pow(1.0 - skyN, 2.0));
  sky = mix(sky, mix(uSky, vec3(1.0), 0.55),
            (1.0 - smoothstep(0.0, 0.35, skyN)) * 0.25);

  vec2 sp = vec2(uv2.x * uAspect, skyN);
  float n = cloudField(sp * uCloud.w + vec2(t * uCloud.y, 0.0));
  float puff = 1.0 - abs(2.0 * n - 1.0);

  sky = cloudPass(sky, sky, sp, t, 0.0060, 0.10, 0.80, vec2(0.26, 0.100), 1.00, n, puff);
  sky = cloudPass(sky, sky, sp, t, 0.0080, 0.62, 0.71, vec2(0.30, 0.115), 0.85, n, puff);
  sky = cloudPass(sky, sky, sp, t, 0.0110, 0.33, 0.52, vec2(0.38, 0.140), 0.55, n, puff);
  sky = cloudPass(sky, sky, sp, t, 0.0135, 0.80, 0.38, vec2(0.34, 0.125), 0.45, n, puff);

  vec2 sunPos = vec2(uAspect * uSun.x, uSun.y);
  float sd = length(sp - sunPos);
  sky += mix(uSky, uAccent, 0.35) * exp(-sd * sd * uSun.z) * uSun.w;
  sky += mix(uSky, vec3(1.0), 0.9) * exp(-sd * sd * 220.0) * 0.30;
  return sky;
}

// Constant indices only - dynamic indexing of a uniform array is not portable in ES 1.00.
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

  // 1. Waterline from UNDISPLACED vUv (C1). Four sines, envelope clamped to +/-0.024.
  float wv = sin(vUv.x * uWaveFreq.x + t * uWaveSpeed.x)
           + 0.55 * sin(vUv.x * uWaveFreq.y - t * uWaveSpeed.y)
           + 0.30 * sin(vUv.x * uWaveFreq.z + t * uWaveSpeed.z)
           + 0.16 * sin(vUv.x * uWaveFreq.w - t * uWaveSpeed.w);
  float wl = uWaterline + clamp(wv * uWaveAmp * 0.25, -0.024, 0.024);
  float under = 1.0 - smoothstep(wl - 0.0015, wl + 0.0015, vUv.y);

  if (uDebug == 1) { gl_FragColor = vec4(vec3(under), 1.0); return; }

  // 2. Colour-sample displacement only: ripple ring + turbulence, water only.
  vec2 m = vUv - uMouse;
  vec2 ma = m * vec2(uAspect, 1.0);
  float dist = length(ma);
  // Radial wave train (not a static lens): visible rings travelling out from the cursor.
  float ring = sin(dist * uRippleCfg.x - t * uRippleCfg.y) * exp(-dist * uRippleCfg.z);
  vec2 rdir = ma / max(0.0001, dist);
  rdir.x /= uAspect;
  vec2 uv = vUv;
  uv += rdir * ring * uRipple * 1.15 * (1.0 + uMouseVel);
  uv += m * exp(-dot(ma, ma) * 30.0) * uRipple * (1.0 + uMouseVel);
  uv += sin(uv.yx * 10.0 + t * 2.0) * uTurb * 0.01;
  uv = mix(vUv, uv, under);          // never distort the sky

  // 3. Sky (30%): gradient, cloud ranks, sun.
  vec3 sky = skyLayer(vUv, wl, t);

  // 4. Water body: palette base, then a near-field depth ramp toward deep teal.
  //    Gated by uWaterline so it exists only while the camera is at the surface.
  vec3 water = bgAt(vUv.y);
  float near = 1.0 - smoothstep(uDepth.z, uDepth.w, uWaterline);
  float ramp = (1.0 - smoothstep(0.0, uDepth.x, vUv.y)) * near;
  water = mix(water, uWaterTop * 0.30, ramp * uDepth.y);

  // Layer 1: Flow - hue-preserving modulation, two drift directions, evolving warp.
  vec2 warp = vec2(sin(vUv.y * 3.1 + t * uFlow.w),
                   cos(vUv.x * 2.3 - t * uFlow.w * 0.7)) * uFlow.z;
  float nf = fbm((uv + warp) * vec2(2.5, 1.5) + vec2(t * uFlow.y, t * 0.013));
  water *= 1.0 + (nf - 0.47) * uFlow.x * (1.0 + uTurb) * (1.0 + ramp * 0.8);

  // Interface band: the bright, rippled underside of the surface, fades over uBandDepth.
  float band = 1.0 - smoothstep(0.0, uBandDepth, wl - vUv.y);
  vec3 horizonSky = mix(uSky, vec3(1.0), uSkyHorizon * 0.85);
  water = mix(water, horizonSky * (0.62 + 0.30 * smoothstep(0.35, 0.80, nf)),
              band * uBandLight * (1.0 - 0.4 * ramp));

  // Surface touch: thin bright crests riding the ripple ring, water only (0 taps).
  // uRipple is the same amplitude the displacement uses, so tier 2 (no ripple) stays clean.
  float glint = pow(max(0.0, ring), 8.0) * exp(-dist * 1.2) * under;
  water += vec3(0.55, 0.78, 0.88) * glint * (uRipple * 10.0);

  // Layer 2: Caustics - two passes of abs(sin) lattice on warped uv, strength uFx.y * vUv.y (multiply only)
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

  // Layer 3: God rays - soft bands along uv.x + (uWaterline - uv.y) * 0.3, slow sway, strength uFx.x
  if (uFx.x > 0.001) {
    float rayAngle = uv.x + (uWaterline - uv.y) * 0.3;
    float sway = sin(t * 0.4 + uv.y * 2.0) * 0.04;
    float rayCoord = rayAngle + sway;
    float rayNoise = noise(vec2(rayCoord * 3.5, t * 0.08));
    float rayBand = sin(rayCoord * 10.0 + rayNoise * 2.0) * 0.5 + 0.5;
    float rays = smoothstep(0.25, 0.75, rayBand) * (0.4 + 0.6 * clamp(vUv.y, 0.0, 1.0));
    water += vec3(0.12, 0.18, 0.22) * (rays * uFx.x);
  }

  // Layer 4: Marine snow - hash-grid particles, 2 parallax layers drifting up, count uFx.z * T.snowMax (20)
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

  // Layer 5: Abyss glow - soft pulsing points, count uFx.w * T.glowMax (8), cool #35e0c2
  if (uFx.w > 0.001) {
    float glowCount = uFx.w * 8.0;
    float glowWander = (noise(uv * 1.5 + vec2(t * 0.05, 0.0)) - 0.5) * 0.02;
    float glowAcc = 0.0;
    for (int i = 0; i < 8; i++) {
      if (float(i) >= glowCount) break;
      float fi = float(i);
      float h1 = hash(vec2(fi * 3.7 + 0.5, fi * 1.9 + 0.3));
      float h2 = hash(vec2(fi * 2.1 + 0.7, fi * 4.3 + 0.1));
      float col = mod(fi, 4.0);
      float row = floor(fi / 4.0);
      vec2 basePos = vec2((col + 0.2 + 0.6 * h1) / 4.0, (row + 0.2 + 0.6 * h2) / 2.0);
      vec2 pos = basePos + vec2(sin(t * 0.3 + fi * 1.7) * 0.03 + glowWander, cos(t * 0.25 + fi * 1.3) * 0.03);
      vec2 d = (uv - pos) * vec2(uAspect, 1.0);
      float dist2 = length(d);
      float pulse = sin(t * 1.2 + fi * 2.3) * 0.35 + 0.65;
      float point = smoothstep(0.06, 0.0, dist2);
      glowAcc += point * point * pulse;
    }
    // Cool #35e0c2 (53, 224, 194), max luminance lift < 0.06
    vec3 glowColor = vec3(0.208, 0.878, 0.761);
    water += glowColor * (clamp(glowAcc, 0.0, 1.0) * (0.07 * uFx.w));
  }

  // Layer 6: Plunge bubbles - <= 24 bubbles, analytic from hash(float(i)), driven by uPlunge
  if (uPlunge >= 0.0) {
    float lifeFade = smoothstep(0.0, 0.15, uPlunge) * (1.0 - smoothstep(2.0, 3.0, uPlunge));
    float bubbleTurb = (noise(uv * 4.0 + vec2(0.0, -t * 0.2)) - 0.5) * 0.006;
    float bubbleAcc = 0.0;
    for (int i = 0; i < 24; i++) {
      if (float(i) >= 24.0) break;
      float fi = float(i);
      float h1 = hash(vec2(fi * 4.13 + 0.1, fi * 2.71 + 0.5));
      float h2 = hash(vec2(fi * 1.97 + 0.3, fi * 5.39 + 0.7));
      float h3 = hash(vec2(fi * 3.31 + 0.9, fi * 1.43 + 0.2));
      float h4 = hash(vec2(fi * 2.57 + 0.4, fi * 3.89 + 0.8));

      float startX = 0.15 + 0.7 * h1;
      float wobble = sin(uPlunge * 6.0 + h4 * 6.28) * (0.008 + 0.01 * h2);
      float bubbleX = startX + wobble + bubbleTurb;

      float pushDepth = (0.15 + 0.25 * h2) * exp(-uPlunge * 1.8) * uPlunge * 2.5;
      float rise = (0.12 + 0.18 * h3) * uPlunge;
      float bubbleY = uWaterline - 0.02 - pushDepth + rise;

      float underWl = 1.0 - smoothstep(uWaterline - 0.005, uWaterline, bubbleY);
      vec2 delta = (uv - vec2(bubbleX, bubbleY)) * vec2(uAspect, 1.0);
      float bdist = length(delta);
      float r = mix(0.003, 0.009, h3);

      float bring = smoothstep(r, r * 0.75, bdist) * smoothstep(r * 0.5, r * 0.75, bdist);
      float center = smoothstep(r * 0.4, 0.0, bdist) * 0.3;
      bubbleAcc += (bring * 1.2 + center) * underWl;
    }
    // Colour is text-adjacent, never pure white (C4 allowance)
    vec3 bubbleColor = vec3(0.70, 0.85, 0.95);
    water += bubbleColor * (clamp(bubbleAcc, 0.0, 1.0) * (0.25 * lifeFade));
  }

  vec3 color = mix(sky, water, under);

  // Layer 7: Foam - noise-broken band straddling the interface. Soft above, crisp below,
  // so the foam edge is the largest luminance step in the column (C1).
  float dLine = vUv.y - wl;
  float fw = uFoam.x * (0.35 + 0.9 * smoothstep(0.35, 0.75,
             nf + 0.30 * sin(vUv.x * 37.0 + t * 0.9)));
  float foam = dLine >= 0.0
    ? (1.0 - smoothstep(0.0, fw * 2.6, dLine))
    : (1.0 - smoothstep(0.0, fw * 0.55, -dLine));
  foam *= 0.78 + 0.22 * sin(vUv.x * 23.0 + t * 1.7);
  vec3 foamCol = mix(uSky, vec3(1.0), uFoam.y);
  color = mix(color, foamCol, clamp(foam, 0.0, 1.0));

  // Crest sparkle, water side only.
  float spark = pow(max(0.0, sin(vUv.x * 71.0 + t * 2.3)), 24.0)
              * smoothstep(0.40, 0.90, nf) * under;
  color += vec3(1.0) * spark * uFoam.w;

  if (uDebug == 11) { gl_FragColor = vec4(color, 1.0); return; }
  gl_FragColor = vec4(color, 1.0);
}
`;
