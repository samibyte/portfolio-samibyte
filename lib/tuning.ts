export const T = {
  springK: 0.08, springD: 0.85, // underdamped, ζ ≈ 0.3 (D-106)
  velocityNorm: 2500, // px/s → [-1, 1], clamped
  dtMax: 1 / 20, // clamp after a background tab
  dprMax: 2, dprMid: 1.5, dprLow: 1,
  fpsLow: 30, fpsMid: 45, warmupS: 2,
  snowMax: 20, glowMax: 8, bubbleMax: 24, octaves: 4, octavesLow: 2,
  particleScaleLow: 0.5, // P8.4 replaces snowLow
  particleFar: 14,       // 14 tiny at 0.5x scroll
  particleMid: 7,        // 7 at 1x scroll
  particleNear: 4,       // 4 large soft blurred discs at 1.8x scroll
  dropletCount: 3,       // 3 lens-wet droplets/streaks moving opposite to scroll
  plungeDuration: 3, // s
  gapVh: 25, // empty band between sections
  bobPx: 8,
  ripple: 0.02,

  // P8.2 sky + surface + waterline
  waveAmp: 0.05, // ×0.25 in GLSL → ±0.024 clamp (C1)
  waveFreq0: 11, waveFreq1: 19, waveFreq2: 31, waveFreq3: 47,
  waveSpeed0: 1.05, waveSpeed1: 1.7, waveSpeed2: 2.4, waveSpeed3: 3.3,
  bandDepth: 0.15, // bright underside band fades over 15% of the viewport
  bandLight: 0.55,
  skyHorizon: 0.42, // mix(uSky, white) at the horizon
  sunX: 0.82, sunY: 0.86, sunGlow: 26, sunStrength: 0.3,
  cloudOpacity: 0.55, cloudSpeed: 0.015, cloudShadow: 0.62, cloudScale: 1,
  depthStart: 0.44, // near-field ramp starts at the bottom 44% of the frame (row 56%, below the hero text)
  depthGain: 0.9, // mix toward uWaterTop × 0.30
  depthFadeNear: 0.95, depthFadeFar: 1.35, // ramp fades out as the camera submerges
  flowAmp: 0.24, flowSpeed: 0.05, warpAmp: 0.06, warpSpeed: 0.4,
  foamWidth: 0.006, foamLight: 0.92, sparkle: 0.35,
  rippleFreq: 90, rippleSpeed: 9, rippleFalloff: 9,

  // P8.3 Refraction + caustics + rays
  // Sun anchor in sky-band UV space (uSun.x/y unchanged, same as sky skyLayer).
  // sunUV.y = uWaterline + uSun.y * (1 - uWaterline) anchors the shaft base
  // at the stable (undisplaced) waterline, not the waving wl, so shafts don't wobble.
  rayCount: 7,          // number of shafts (uniform cutoff loop)
  rayWidth: 0.045,      // Gaussian half-width of each shaft (screen-space)
  rayFalloff: 7.5,      // depth attenuation: exp(-k * depth_below_wl), k ~ 6-9
  rayAmp: 0.12,         // peak additive amplitude per shaft (C4: sum <= 0.06 in dark zones)
  causticCells: 10,     // lattice cells across screen (analytic, 0 taps)
  causticAmp: 0.35,     // multiply strength
  perspNear: 0.08,      // horizon guard (1/max(perspNear, depth)) for near-field scale
  perspFar: 1.8,        // UV scale for far-field (small features far away)
  perspNearScale: 5.5,  // UV scale for near-field foreground
  fogStrength: 0.18,    // distance fog blend on water body (far-field contrast reduction)
  flowAmp2: 0.14,       // counter-moving second flow amplitude
  flowSpeed2: 0.032,    // second flow speed (counter direction)
  specPower: 28.0,      // pow(dot, specPower): gloss exponent for wave specular
  specAmp: 0.055,       // peak specular amplitude (additive)
} as const;
