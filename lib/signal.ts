import { T } from "./tuning";
import { sectionAt } from "./layout";
import type { ZoneId } from "./types";

export interface SignalState {
  scrollY: number;
  scrollTarget: number;
  scrollSpring: { x: number; v: number };
  pointerSpring: { x: number; v: number };
  pointer: { x: number; y: number };
  time: number;
  zone: ZoneId;
  reduced: boolean;
  coarse: boolean;
  webglOk: boolean;
  tier: QualityTier;
  fxOff: boolean;
  adaptiveLow: boolean;
  forcedTier: QualityTier | null;
  plungeStartedAt: number;
  dprCap: number;
  fps: number;
}

export type QualityTier = 0 | 1 | 2 | 3 | 4;

export interface OceanDebug {
  tier?: QualityTier;
  layer?: number;
}

export interface TierInputs {
  fxOff: boolean;
  webglOk: boolean;
  reduced: boolean;
  coarse: boolean;
  width: number;
  adaptiveLow: boolean;
  forced: QualityTier | null;
}

export interface TierSettings {
  canvas: boolean;
  static: boolean;
  dprCap: number;
  octaves: number;
  snowScale: number;
  glow: boolean;
  ripple: boolean;
}

/**
 * Pure tier decision (P6.1). Precedence: no canvas (4) > reduced motion (3) >
 * coarse/narrow (2) > adaptive-low (1) > full (0).
 */
export function decideTier(input: TierInputs): QualityTier {
  if (input.forced !== null) return input.forced;
  if (input.fxOff || !input.webglOk) return 4;
  if (input.reduced) return 3;
  if (input.coarse || input.width < 768) return 2;
  if (input.adaptiveLow) return 1;
  return 0;
}

const TIER_SETTINGS: readonly TierSettings[] = [
  {
    canvas: true,
    static: false,
    dprCap: T.dprMax,
    octaves: T.octaves,
    snowScale: 1,
    glow: true,
    ripple: true,
  },
  {
    canvas: true,
    static: false,
    dprCap: T.dprLow,
    octaves: T.octavesLow,
    snowScale: T.snowLow,
    glow: true,
    ripple: true,
  },
  {
    canvas: true,
    static: false,
    dprCap: T.dprLow,
    octaves: T.octavesLow,
    snowScale: 0,
    glow: false,
    ripple: false,
  },
  {
    canvas: true,
    static: true,
    dprCap: T.dprMax,
    octaves: T.octaves,
    snowScale: 1,
    glow: true,
    ripple: false,
  },
  {
    canvas: false,
    static: true,
    dprCap: 0,
    octaves: 0,
    snowScale: 0,
    glow: false,
    ripple: false,
  },
];

export function tierSettings(tier: QualityTier): TierSettings {
  const base = TIER_SETTINGS[tier];
  if (tier === 0 && signal.dprCap < base.dprCap) {
    return { ...base, dprCap: signal.dprCap };
  }
  return base;
}

export interface AdaptiveState {
  adaptiveLow: boolean;
  dprCap: number;
}

/**
 * Pure calculation of mean frame time over an array of frame durations in seconds.
 */
export function computeMeanFrameTime(durations: readonly number[]): number {
  if (durations.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < durations.length; i++) {
    sum += durations[i];
  }
  return sum / durations.length;
}

/**
 * Pure evaluation of adaptive quality thresholds (P6.2).
 * If fps < T.fpsLow (30) → tier 1 (adaptiveLow = true, dprCap <= T.dprLow).
 * Else if fps < T.fpsMid (45) → DPR T.dprMid (dprCap <= T.dprMid).
 * Never upgrade mid-session: quality only degrades.
 */
export function evaluateFps(
  fps: number,
  current: AdaptiveState,
): AdaptiveState {
  if (fps < T.fpsLow) {
    return {
      adaptiveLow: true,
      dprCap: Math.min(current.dprCap, T.dprLow),
    };
  }
  if (fps < T.fpsMid) {
    return {
      adaptiveLow: current.adaptiveLow,
      dprCap: Math.min(current.dprCap, T.dprMid),
    };
  }
  return {
    adaptiveLow: current.adaptiveLow,
    dprCap: current.dprCap,
  };
}

export const signal: SignalState = {
  scrollY: 0,
  scrollTarget: 0,
  scrollSpring: { x: 0, v: 0 },
  pointerSpring: { x: 0, v: 0 },
  pointer: { x: -1, y: -1 },
  time: 0,
  zone: "surface",
  reduced: false,
  coarse: false,
  webglOk: true,
  tier: 0,
  fxOff: false,
  adaptiveLow: false,
  forcedTier: null,
  plungeStartedAt: -1,
  dprCap: T.dprMax,
  fps: 60,
};

const tierInputs: TierInputs = {
  fxOff: false,
  webglOk: true,
  reduced: false,
  coarse: false,
  width: 1280,
  adaptiveLow: false,
  forced: null,
};

type FrameListener = (dt: number) => void;
const frameListeners = new Set<FrameListener>();

let running = false;
let rafId: number | null = null;
let lastTime = 0;
let initialChecked = false;
let plungeEligible = false;
let sessionStartTime = -1;
let frameHistory: Array<{ now: number; dt: number }> = [];

export function resetAdaptiveQuality(): void {
  signal.adaptiveLow = false;
  signal.dprCap = T.dprMax;
  signal.fps = 60;
  sessionStartTime = -1;
  frameHistory = [];
  refreshTier();
}

let prevScrollY = 0;
let rawPointerX = -1;
let rawPointerY = -1;
let prevPointerX = -1;
let prevPointerY = -1;

export function stepSpring(
  x: number,
  v: number,
  target: number,
  dt: number,
): { x: number; v: number } {
  const s = dt * 60;
  let nextV = v + (target - x) * T.springK * s;
  nextV *= Math.pow(T.springD, s);
  const nextX = x + nextV * s;
  return { x: nextX, v: nextV };
}

function checkReduced(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem("ocean-fx");
    if (stored === "off") return true;
    if (stored === "on") return false;
  } catch {
    // localStorage may be unavailable in some sandboxes/modes
  }
  return Boolean(
    typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
}

function checkCoarse(): boolean {
  if (typeof window === "undefined") return false;
  const matchCoarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  return Boolean(matchCoarse || window.innerWidth < 768);
}

function readFxOff(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("fx") === "off";
}

/** Dev-only or test override: `window.__oceanDebug.tier` or `?tier=0…4`. */
export function readForcedTier(): QualityTier | null {
  if (typeof window === "undefined") return null;

  const debug = (window as unknown as { __oceanDebug?: OceanDebug }).__oceanDebug;
  if (debug && typeof debug.tier === "number" && debug.tier >= 0 && debug.tier <= 4) {
    return debug.tier as QualityTier;
  }

  if (process.env.NODE_ENV !== "development") return null;

  const raw = new URLSearchParams(window.location.search).get("tier");
  if (raw === null || raw === "") return null;

  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 && value <= 4
    ? (value as QualityTier)
    : null;
}

/** Re-read environment flags and recompute the tier. */
export function refreshTier(): QualityTier {
  signal.reduced = checkReduced();
  signal.coarse = checkCoarse();
  signal.fxOff = readFxOff();
  signal.forcedTier = readForcedTier();

  signal.tier = decideTier({
    fxOff: signal.fxOff,
    webglOk: signal.webglOk,
    reduced: signal.reduced,
    coarse: signal.coarse,
    width: typeof window === "undefined" ? 1280 : window.innerWidth,
    adaptiveLow: signal.adaptiveLow,
    forced: signal.forcedTier,
  });

  return signal.tier;
}

function onPointerMove(e: PointerEvent): void {
  if (e.isPrimary ?? true) {
    rawPointerX = e.clientX;
    rawPointerY = e.clientY;
  }
}

function loop(now: number): void {
  if (!running) return;

  if (sessionStartTime < 0) {
    sessionStartTime = now;
  }

  if (
    typeof window !== "undefined" &&
    (process.env.NODE_ENV === "development" ||
      (window as unknown as { __ENABLE_OCEAN_DEBUG__?: boolean })
        .__ENABLE_OCEAN_DEBUG__ ||
      (window as unknown as { __oceanDebug?: OceanDebug }).__oceanDebug) &&
    !(window as unknown as { __ocean?: SignalState }).__ocean
  ) {
    (window as unknown as { __ocean?: SignalState }).__ocean = signal;
  }

  const rawDt = lastTime > 0 ? (now - lastTime) / 1000 : 0;
  const dt = Math.min(rawDt > 0 ? rawDt : 1 / 60, T.dtMax);
  lastTime = now;

  const scrollY = window.scrollY || window.pageYOffset || 0;
  const vh = window.innerHeight || 1;
  signal.scrollY = scrollY;
  signal.scrollTarget = scrollY;

  // Plunge: set once when scrollY > 0.05 * vh, but not if the page loaded already past it
  if (plungeEligible && signal.plungeStartedAt < 0 && scrollY > 0.05 * vh) {
    signal.plungeStartedAt = now / 1000;
  }

  signal.reduced = checkReduced();
  signal.coarse = checkCoarse();

  tierInputs.fxOff = signal.fxOff;
  tierInputs.webglOk = signal.webglOk;
  tierInputs.reduced = signal.reduced;
  tierInputs.coarse = signal.coarse;
  tierInputs.width = window.innerWidth;
  tierInputs.adaptiveLow = signal.adaptiveLow;
  signal.forcedTier = readForcedTier();
  tierInputs.forced = signal.forcedTier;
  signal.tier = decideTier(tierInputs);

  // Adaptive quality (P6.2): rolling 2 s mean frame time measured only after T.warmupS
  const elapsedMs = now - sessionStartTime;
  const warmupMs = T.warmupS * 1000;
  const windowMs = 2000;

  if (elapsedMs >= warmupMs) {
    if (rawDt > 0 && rawDt < 1.0) {
      frameHistory.push({ now, dt: rawDt });
    }

    while (frameHistory.length > 0 && frameHistory[0].now < now - windowMs) {
      frameHistory.shift();
    }

    if (elapsedMs >= warmupMs + windowMs && frameHistory.length >= 2) {
      let sumDt = 0;
      for (let i = 0; i < frameHistory.length; i++) {
        sumDt += frameHistory[i].dt;
      }
      const meanFrameTime = sumDt / frameHistory.length;
      const currentFps = meanFrameTime > 0 ? 1 / meanFrameTime : 60;
      signal.fps = currentFps;

      const next = evaluateFps(currentFps, {
        adaptiveLow: signal.adaptiveLow,
        dprCap: signal.dprCap,
      });

      const changed =
        next.adaptiveLow !== signal.adaptiveLow ||
        next.dprCap !== signal.dprCap;

      if (changed) {
        signal.adaptiveLow = next.adaptiveLow;
        signal.dprCap = next.dprCap;
        refreshTier();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("resize"));
        }
      }
    }
  }

  const isStatic = signal.tier >= 3;

  if (isStatic) {
    signal.time = 0;
    signal.scrollSpring = { x: 0, v: 0 };
    signal.pointerSpring = { x: 0, v: 0 };
  } else {
    signal.time += dt;

    // Scroll spring
    const dy = scrollY - prevScrollY;
    const vPxPerSec = dt > 0 ? dy / dt : 0;
    const scrollTarget = Math.max(-1, Math.min(1, vPxPerSec / T.velocityNorm));
    signal.scrollSpring = stepSpring(
      signal.scrollSpring.x,
      signal.scrollSpring.v,
      scrollTarget,
      dt,
    );

    // Pointer spring
    if (rawPointerX >= 0 && rawPointerY >= 0 && prevPointerX >= 0 && prevPointerY >= 0) {
      const dist = Math.hypot(rawPointerX - prevPointerX, rawPointerY - prevPointerY);
      const pointerSpeed = dt > 0 ? dist / dt : 0;
      const pointerTarget = Math.max(0, Math.min(1, pointerSpeed / T.velocityNorm));
      signal.pointerSpring = stepSpring(
        signal.pointerSpring.x,
        signal.pointerSpring.v,
        pointerTarget,
        dt,
      );
    } else {
      signal.pointerSpring = stepSpring(
        signal.pointerSpring.x,
        signal.pointerSpring.v,
        0,
        dt,
      );
    }
  }

  prevScrollY = scrollY;
  prevPointerX = rawPointerX;
  prevPointerY = rawPointerY;
  signal.pointer.x = rawPointerX;
  signal.pointer.y = rawPointerY;

  // Active section zone
  const midY = scrollY + vh * 0.3;
  const currentSection = sectionAt(midY) || sectionAt(scrollY);
  if (currentSection) {
    signal.zone = currentSection.zone;
  }

  for (const listener of frameListeners) {
    listener(dt);
  }

  rafId = window.requestAnimationFrame(loop);
}

export function start(): void {
  if (typeof window === "undefined") return;
  if (running) return;
  running = true;

  sessionStartTime = -1;
  frameHistory = [];

  if (
    process.env.NODE_ENV === "development" ||
    (window as unknown as { __ENABLE_OCEAN_DEBUG__?: boolean })
      .__ENABLE_OCEAN_DEBUG__
  ) {
    (window as unknown as { __ocean?: SignalState }).__ocean = signal;
  }

  signal.reduced = checkReduced();
  signal.coarse = checkCoarse();
  refreshTier();

  const vh = window.innerHeight;
  const initialScrollY = window.scrollY || window.pageYOffset || 0;
  if (!initialChecked) {
    initialChecked = true;
    plungeEligible = initialScrollY <= 0.05 * vh;
  }

  prevScrollY = initialScrollY;
  signal.scrollY = initialScrollY;
  signal.scrollTarget = initialScrollY;

  window.addEventListener("pointermove", onPointerMove, { passive: true });

  lastTime = performance.now();
  rafId = window.requestAnimationFrame(loop);
}

export function stop(): void {
  if (!running) return;
  running = false;
  sessionStartTime = -1;
  frameHistory = [];

  if (rafId !== null && typeof window !== "undefined") {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (typeof window !== "undefined") {
    window.removeEventListener("pointermove", onPointerMove);
  }
}

export function onFrame(listener: FrameListener): () => void {
  frameListeners.add(listener);
  return () => {
    frameListeners.delete(listener);
  };
}
