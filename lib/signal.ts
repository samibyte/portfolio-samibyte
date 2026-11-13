import { T } from "./tuning";
import { sectionAt } from "./layout";
import type { ZoneId } from "./types";

export interface SignalState {
  scrollY: number;
  scrollTarget: number;
  scrollSpring: { x: number; v: number };
  pointerSpring: { x: number; v: number };
  time: number;
  zone: ZoneId;
  reduced: boolean;
  coarse: boolean;
  webglOk: boolean;
  plungeStartedAt: number;
}

export const signal: SignalState = {
  scrollY: 0,
  scrollTarget: 0,
  scrollSpring: { x: 0, v: 0 },
  pointerSpring: { x: 0, v: 0 },
  time: 0,
  zone: "surface",
  reduced: false,
  coarse: false,
  webglOk: true,
  plungeStartedAt: -1,
};

type FrameListener = (dt: number) => void;
const frameListeners = new Set<FrameListener>();

let running = false;
let rafId: number | null = null;
let lastTime = 0;
let initialChecked = false;
let plungeEligible = false;

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

function onPointerMove(e: PointerEvent): void {
  rawPointerX = e.clientX;
  rawPointerY = e.clientY;
}

function loop(now: number): void {
  if (!running) return;

  const dt = Math.min((now - lastTime) / 1000, T.dtMax);
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

  if (signal.reduced) {
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
      const pointerTarget = Math.min(1, pointerSpeed / 1000);
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

  signal.reduced = checkReduced();
  signal.coarse = checkCoarse();

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
