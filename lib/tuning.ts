export const T = {
  springK: 0.08, springD: 0.85, // underdamped, ζ ≈ 0.3 (D-106)
  velocityNorm: 2500, // px/s → [-1, 1], clamped
  dtMax: 1 / 20, // clamp after a background tab
  dprMax: 2, dprMid: 1.5, dprLow: 1,
  fpsLow: 30, fpsMid: 45, warmupS: 2,
  snowMax: 20, glowMax: 8, bubbleMax: 24, octaves: 4, octavesLow: 2,
  snowLow: 0.5,
  plungeDuration: 3, // s
  gapVh: 25, // empty band between sections
  bobPx: 8,
  ripple: 0.02,
} as const;
