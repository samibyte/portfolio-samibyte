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
uniform vec4  uRay;          // rayCount, rayWidth, rayFalloff, rayAmp  (P8.3)
uniform vec4  uCaustic;      // causticCells, causticAmp, causticFalloff, causticSpeed (P8.3)
uniform vec4  uPersp;        // perspNearScale, perspFarScale, fogStrength, flowBlend (P8.3)
uniform vec4  uRefr;         // refractNear, refractFar, refractScale, refractSpeed (P8.3)
uniform vec4  uSpec;         // specPower, specAmp, specFalloff, 0  (P8.3)
uniform vec4  uParticle;     // particleFar, particleMid, particleNear, dropletCount (P8.4)
uniform float uFauna;        // 1.0 = on, 0.0 = off (P8.4 schema)
uniform float uCamera;       // 1.0 = on, 0.0 = off (P8.4 schema)
uniform int   uDebug;        // 0 = off, 1 = under mask, 11 = sky+surface, 12 = refraction, 13 = caustics, 14 = rays, 15 = particles (P8.4)

varying vec2 vUv;

// Noise budget (P8): <= 11 taps/pixel at uOct = 4.
//   flow fbm ............. 4   (uOct rotated octaves; drives flow, foam and mirror band)
//   sky clouds ........... 3   (one 3-octave field reused by four cloud envelopes)
//   refraction warp ...... 2   (P8.3: one noise per axis, advected by uTime)
//   god rays ............. 1   (P8.3: one noise tap breaks the shaft edge)
//   particle flutter ..... 1   (P8.4: snow layer replacement, behind uFx.z gate)
//   caustics, glow ....... 0   (analytic lattice / sine wander)
//   total ............... 11
// P8.3 trade: the caustic noise warp and the glow wander are gone, the bubble
// wobble reuses the flow sample, and that pays for the two refraction taps.
// Named geometric constants (not tuning): deep-water factor 0.30, fbm mean 0.47,
// mask AA half-width 0.0015, foam asymmetry 2.6 / 0.55, cloud sphere 0.42,
// near-field edge 0.5, refraction debug gain 40.0, refraction second scale 1.7,
// refraction skew 0.7 / 0.6, ray fan step 0.08, ray phase step 1.618,
// ray flicker rate 3.0, caustic lattice skew 1.2 / 0.3, water fbm scale 2.5 / 1.5,
// particle sizes 0.0022 / 0.0055 / 0.05 / 0.016, near alpha 0.24.

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

  // 2. Depth below the stable waterline (P8.3 perspective coordinate): 0 at the
  // surface, growing downward. Drives the depth light, caustic and ray falloff.
  // Uses uWaterline (not the waving wl) so moving crests never move the layers.
  float depth = max(0.0, uWaterline - vUv.y);

  // 3. Refraction: colour-sample displacement only (never the mask or sky).
  //    Ripple ring + turbulence come from the C3 springs; the advected
  //    two-tap domain warp is the P8.3 refraction field.
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

  // Zone gate: uFx.x/uFx.y (rays, caustics at the viewport centre) already fade
  // to 0 in the abyss, so the refraction field does too (C2: abyss is still).
  float refractStrength = under * clamp(max(uFx.x, uFx.y) * 2.0, 0.0, 1.0);
  // Near-field warp amplitude is visibly larger than the far field (bottom vs top).
  float refrAmp = mix(uRefr.y, uRefr.x, smoothstep(0.0, 0.5, depth));
  vec2 refrP = vUv * vec2(uAspect, 1.0) * uRefr.z;
  vec2 refrWarp = vec2(
    noise(refrP + vec2(t * uRefr.w, -t * uRefr.w * 0.7)),
    noise(refrP * 1.7 - vec2(t * uRefr.w * 0.6, t * uRefr.w))
  ) - 0.5;
  vec2 refrDisp = refrWarp * refrAmp * refractStrength;
  uv += refrDisp;
  uv = mix(vUv, uv, under);          // never distort the sky

  if (uDebug == 12) {
    // Refraction isolation: displacement magnitude as brightness (0 in abyss).
    float refracMag = length(refrDisp) * 80.0;
    gl_FragColor = vec4(vec3(clamp(refracMag, 0.0, 1.0)), 1.0);
    return;
  }

  // 3. Sky (30%): gradient, cloud ranks, sun.
  vec3 sky = skyLayer(vUv, wl, t);

  // 4. Perspective scale: near rows (bottom of the frame) see larger, faster
  //    features than far rows near the waterline.
  float nearScale = mix(uPersp.y, uPersp.x, smoothstep(0.0, 0.5, depth));

  // 5. Water body: palette base, near-field depth ramp, distance fog.
  vec3 water = bgAt(vUv.y);
  float nearBand = 1.0 - smoothstep(uDepth.z, uDepth.w, uWaterline);
  float ramp = (1.0 - smoothstep(0.0, uDepth.x, vUv.y)) * nearBand;
  water = mix(water, uWaterTop * 0.30, ramp * uDepth.y);

  // Distance fog: far field (top of water) loses contrast toward the fog colour.
  float fogT = smoothstep(uWaterline - 0.6, uWaterline - 0.05, vUv.y) * uPersp.z;
  vec3 fogCol = mix(water, bgAt(uWaterline), fogT);
  water = mix(water, fogCol, fogT * under);

  // 6. Layer 1: Flow — two drift fields. The counter field reuses the same fbm
  //    call shape (0 extra taps) and adds the temporal break-up.
  vec2 warp = vec2(sin(vUv.y * 3.1 + t * uFlow.w),
                   cos(vUv.x * 2.3 - t * uFlow.w * 0.7)) * uFlow.z;
  vec2 flowUV = (uv + warp) * vec2(2.5, 1.5) * nearScale;

  float nf  = fbm(flowUV + vec2(t * uFlow.y, t * 0.013));
  float nf2 = fbm(-flowUV * 0.73 + vec2(-t * uFlow.y * 0.8, t * 0.019 + 3.7));
  float nfBlend = mix(nf, nf2, uPersp.w);
  water *= 1.0 + (nfBlend - 0.47) * uFlow.x * (1.0 + uTurb) * (1.0 + ramp * 0.8);

  // 7. Specular from the analytic wave slope (0 taps). The height varies along
  //    x, so the normal tilts in x and stays planar in y: N = (-slope, 0, 1).
  float dwdx =   uWaveFreq.x * uWaveAmp * 0.25 * cos(vUv.x * uWaveFreq.x + t * uWaveSpeed.x)
               + 0.55 * uWaveFreq.y * uWaveAmp * 0.25 * cos(vUv.x * uWaveFreq.y - t * uWaveSpeed.y)
               + 0.30 * uWaveFreq.z * uWaveAmp * 0.25 * cos(vUv.x * uWaveFreq.z + t * uWaveSpeed.z)
               + 0.16 * uWaveFreq.w * uWaveAmp * 0.25 * cos(vUv.x * uWaveFreq.w - t * uWaveSpeed.w);
  vec3 N = normalize(vec3(-dwdx * 0.4, 0.0, 1.0));
  // Sun anchor on the stable waterline, so the highlight does not wobble.
  float sunAnchorY = uWaterline + uSun.y * (1.0 - uWaterline);
  vec2 sunDirUV = normalize(vec2(uSun.x - vUv.x, sunAnchorY - vUv.y) * vec2(uAspect, 1.0));
  vec3 L = normalize(vec3(sunDirUV.x, sunDirUV.y * 0.7, 0.9));
  vec3 V = vec3(0.0, 0.0, 1.0);                 // viewer direction, normal to screen
  vec3 H = normalize(L + V);                     // Blinn half-vector
  float spec = pow(max(dot(N, H), 0.0), uSpec.x) * exp(-depth * uSpec.z);
  vec3 specCol = mix(uSky, vec3(1.0), 0.9);
  water += specCol * spec * uSpec.y * under;

  // Interface band: bright underside of surface, fades over uBandDepth (15%).
  float band = 1.0 - smoothstep(0.0, uBandDepth, wl - vUv.y);
  // Slope-dependent thickness: wider under wave crests (B2).
  float bandWiden = 1.0 + 0.4 * smoothstep(0.3, 0.8, nf);
  band *= bandWiden;
  vec3 horizonSky = mix(uSky, vec3(1.0), uSkyHorizon * 0.85);
  water = mix(water, horizonSky * (0.62 + 0.30 * smoothstep(0.35, 0.80, nf)),
              clamp(band, 0.0, 1.0) * uBandLight * (1.0 - 0.4 * ramp));

  // Surface touch: thin bright crests riding the ripple ring, water only (0 taps).
  float glint = pow(max(0.0, ring), 8.0) * exp(-dist * 1.2) * under;
  water += vec3(0.55, 0.78, 0.88) * glint * (uRipple * 10.0);

  // 8. Layer 2: Caustics (P8.3 B4) — fully analytic abs(sin) lattice, 0 taps.
  // 8. Layer 2: Caustics (P8.3) — analytic warped lattice, 0 taps.
  //    10 cells across (uCaustic.x), strongest in the top half, multiply-only.
  //    uCaustic.x/y/z/w = cells, amp, falloff, speed.
  float causticStrength = exp(-depth * uCaustic.z) * uFx.y;
  float caustics = 0.0;
  if (causticStrength > 0.001) {
    vec2 cUV = uv * uCaustic.x;
    // Analytic warped phase (the noise warp taps are not needed at this scale).
    float ph1 = t * uCaustic.w + sin(cUV.y * 1.2 + t * 0.07) * 0.3;
    float ph2 = -t * uCaustic.w * 0.8 + cos(cUV.x * 1.2 - t * 0.05) * 0.3;
    float c1 = abs(sin(cUV.x + ph1));
    float c2 = abs(sin(cUV.y + ph2));
    caustics = (c1 + c2) * 0.5;
    water *= 1.0 + caustics * (uCaustic.y * causticStrength);
  }
  if (uDebug == 13) {
    gl_FragColor = vec4(vec3(caustics * causticStrength), 1.0);
    return;
  }

  // 9. Layer 3 (P8.3): God rays — uRay.x wide shafts from the sun anchor.
  //    Fan of constant-bound beams, one noise tap breaks the edges, depth
  //    attenuation exp(-uRay.z * depth), gated by uFx.x, clipped by under.
  float rayStrength = uFx.x;
  vec3 rayTint = mix(uSky, vec3(1.0), 0.8);
  float rayLum = 0.0;
  if (rayStrength > 0.001) {
    vec2 sunUV = vec2(uSun.x * uAspect, sunAnchorY);
    vec2 pUV = vec2(vUv.x * uAspect, vUv.y);
    vec2 toSun = sunUV - pUV;
    vec2 toSunN = toSun / max(0.001, length(toSun));

    // One tap breaks the shaft edge (the only enemy of banding here).
    float edgeNoise = noise(vec2(vUv.x * 3.5 + t * 0.08, vUv.y * 2.0));

    float rayAcc = 0.0;
    for (int i = 0; i < 7; i++) {
      if (float(i) >= uRay.x) break;
      float fi = float(i);

      // Fan around the sun direction in fixed 0.08 rad steps.
      float angleOff = (fi - 3.0) * 0.08;
      float sa = sin(angleOff), ca = cos(angleOff);
      vec2 shaftDir = vec2(ca * toSunN.x - sa * toSunN.y,
                           sa * toSunN.x + ca * toSunN.y);

      // Distance from the pixel to this shaft, measured from the sun downward.
      float along = dot(pUV - sunUV, -shaftDir);
      vec2 proj = sunUV + (-shaftDir) * max(0.0, along);
      float perp = length(pUV - proj);

      float shaftPhase = fi * 1.618 + t * 0.3;
      float w = uRay.y * (0.7 + 0.3 * sin(shaftPhase));
      float profile = exp(-(perp * perp) / (w * w));
      float flickerCoord = along * 1.5 + fi * 2.3 + edgeNoise * 1.5;
      float flicker = 0.65 + 0.35 * sin(flickerCoord * 3.0 + t * 0.5);
      rayAcc += profile * flicker * step(0.0, along);
    }

    float depthAtten = exp(-uRay.z * depth);
    rayLum = clamp(rayAcc, 0.0, 1.0) * depthAtten * uRay.w * rayStrength * under;
    water += rayTint * rayLum;
  }
  if (uDebug == 14) {
    gl_FragColor = vec4(rayTint * clamp(rayLum, 0.0, 1.0), 1.0);
    return;
  }

  // Layer 4 (P8.4): Particles (three parallax layers + droplets), replacing marine snow.
  // Constant loop bounds 24 / 12 / 6 / 4 with uniform cutoffs uParticle.x/y/z/w.
  // Parallax: far 0.5x, mid 1.0x, near 1.8x, droplets moving opposite to scroll.
  // 1 shared noise tap for particle flutter.
  // Gated by uFx.z (fades with depth via zone palette, 0 in abyss).
  // Near alpha <= 0.25 and never the largest edge in x=1% column.
  float particleLum = 0.0;
  if (uFx.z > 0.001) {
    float scroll = uWaterline - 0.7;
    float flutter = (noise(uv * 3.0 + vec2(0.0, -t * 0.05)) - 0.5) * 0.008;
    float partAcc = 0.0;

    // 1. Far particles: 14 tiny, 0.5x scroll. Constant bound 24.
    for (int i = 0; i < 24; i++) {
      if (float(i) >= uParticle.x) break;
      float fi = float(i);
      float h1 = hash(vec2(fi * 1.73 + 0.11, fi * 3.17 + 0.23));
      float h2 = hash(vec2(fi * 2.39 + 0.37, fi * 1.91 + 0.41));
      float h3 = hash(vec2(fi * 3.41 + 0.53, fi * 2.83 + 0.67));
      float px = fract(h1 + sin(t * 0.3 + h3 * 6.28) * 0.012 + flutter);
      float py = fract(h2 * 0.7 + t * 0.02 + scroll * 0.5);
      vec2 d = vec2(fract(uv.x - px + 0.5) - 0.5, fract(uv.y - py + 0.5) - 0.5) * vec2(uAspect, 1.0);
      float dist = length(d);
      float r = 0.0022;
      partAcc += smoothstep(r, 0.0, dist) * 0.30;
    }

    // 2. Mid particles: 7 medium, 1.0x scroll. Constant bound 12.
    for (int i = 0; i < 12; i++) {
      if (float(i) >= uParticle.y) break;
      float fi = float(i);
      float h1 = hash(vec2(fi * 4.19 + 0.71, fi * 1.31 + 0.93));
      float h2 = hash(vec2(fi * 2.83 + 0.43, fi * 3.77 + 0.17));
      float h3 = hash(vec2(fi * 1.93 + 0.81, fi * 4.61 + 0.59));
      float px = fract(h1 + sin(t * 0.4 + h3 * 6.28) * 0.016 + flutter * 1.3);
      float py = fract(h2 * 0.7 + t * 0.03 + scroll * 1.0);
      vec2 d = vec2(fract(uv.x - px + 0.5) - 0.5, fract(uv.y - py + 0.5) - 0.5) * vec2(uAspect, 1.0);
      float dist = length(d);
      float r = 0.0055;
      partAcc += smoothstep(r, r * 0.2, dist) * 0.35;
    }

    // 3. Near particles: 4 large soft blurred discs, 1.8x scroll, alpha <= 0.25. Constant bound 6.
    // Discs kept away from x=1% boundary (C1 step runner-up guard).
    for (int i = 0; i < 6; i++) {
      if (float(i) >= uParticle.z) break;
      float fi = float(i);
      float h1 = hash(vec2(fi * 5.71 + 0.29, fi * 2.63 + 0.83));
      float h2 = hash(vec2(fi * 3.11 + 0.61, fi * 6.17 + 0.37));
      float h3 = hash(vec2(fi * 4.43 + 0.91, fi * 1.87 + 0.47));
      float px = 0.15 + 0.70 * fract(h1 + sin(t * 0.25 + h3 * 6.28) * 0.02 + flutter * 1.5);
      float py = fract(0.12 + 0.60 * h2 + t * 0.035 + scroll * 1.8);
      vec2 d = vec2(fract(uv.x - px + 0.5) - 0.5, fract(uv.y - py + 0.5) - 0.5) * vec2(uAspect, 1.0);
      float dist = length(d);
      float r = 0.048 + 0.014 * h3;
      // Soft blurred disc bokeh, peak alpha <= 0.24 (strictly <= 0.25)
      float disc = smoothstep(r, r * 0.15, dist) * 0.24;
      partAcc += disc;
    }

    // 4. Droplets: 3 lens-wet droplets/streaks, moving opposite to scroll. Constant bound 4.
    for (int i = 0; i < 4; i++) {
      if (float(i) >= uParticle.w) break;
      float fi = float(i);
      float h1 = hash(vec2(fi * 6.37 + 0.41, fi * 3.89 + 0.19));
      float h2 = hash(vec2(fi * 1.67 + 0.57, fi * 5.23 + 0.73));
      float h3 = hash(vec2(fi * 4.91 + 0.33, fi * 2.41 + 0.69));
      float px = 0.12 + 0.76 * fract(h1 + sin(t * 0.15 + h3 * 6.28) * 0.008);
      float py = fract(0.15 + 0.55 * h2 + t * 0.01 - scroll * 1.2);
      vec2 d = vec2(fract(uv.x - px + 0.5) - 0.5, fract(uv.y - py + 0.5) - 0.5) * vec2(uAspect, 0.55);
      float dist = length(d);
      float r = 0.014 + 0.006 * h3;
      float ring = smoothstep(r, r * 0.7, dist) * smoothstep(r * 0.35, r * 0.7, dist);
      float center = smoothstep(r * 0.5, 0.0, dist) * 0.25;
      float droplet = (ring * 1.1 + center) * 0.18;
      partAcc += droplet;
    }

    particleLum = clamp(partAcc, 0.0, 1.0) * uFx.z * under;
    // Water-tinted colour (never pure white, C4 compliant)
    vec3 particleCol = mix(uWaterTop, vec3(0.85, 0.95, 1.0), 0.6);
    water += particleCol * (particleLum * 0.22);
  }

  if (uDebug == 15) {
    gl_FragColor = vec4(vec3(particleLum), 1.0);
    return;
  }

  // Layer 5: Abyss glow - soft pulsing points, count uFx.w * T.glowMax (8), cool #35e0c2
  if (uFx.w > 0.001) {
    float glowCount = uFx.w * 8.0;
    // Sine wander, not noise: saves the tap and keeps the motion slow.
    float glowWander = sin(t * 0.05 + uv.y * 4.0) * 0.02;
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
    // Reuses the flow sample: same wobble character, 0 extra taps.
    float bubbleTurb = (nf - 0.47) * 0.012;
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
