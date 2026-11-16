"use client";

import { useEffect, useRef } from "react";
import { onFrame, refreshTier, signal } from "@/lib/signal";

/*
 * Bounded 2D foreground atmosphere (P10.3 / D-211).
 *
 * Eight fixed sprites: five bokeh discs, two lens-wet streaks and one scripted
 * silhouette. The canvas is a half-resolution backing store, capped at 1.5 DPR,
 * and is drawn only from the single loop in `lib/signal.ts`. It deliberately
 * has no animation-frame call of its own, no WebGL context and no CSS
 * animation.
 */

const MAX_DPR = 1.5;
const BACKING_SCALE = 0.5;
const MAX_ALPHA = 0.18;
const KEEP_OUT_PAD = 6;

interface BokehSprite {
  x: number;
  y: number;
  radius: number;
  phase: number;
  parallax: number;
  alpha: number;
}

interface StreakSprite {
  x: number;
  y: number;
  length: number;
  width: number;
  angle: number;
  phase: number;
  parallax: number;
  alpha: number;
}

interface KeepOutRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const BOKEH: readonly BokehSprite[] = [
  { x: 0.06, y: 0.2, radius: 52, phase: 0, parallax: 0.55, alpha: 0.14 },
  { x: 0.94, y: 0.3, radius: 38, phase: 1.7, parallax: 0.8, alpha: 0.12 },
  { x: 0.1, y: 0.7, radius: 30, phase: 3.1, parallax: 1, alpha: 0.1 },
  { x: 0.88, y: 0.77, radius: 66, phase: 4.4, parallax: 0.45, alpha: 0.16 },
  { x: 0.77, y: 0.12, radius: 24, phase: 5.2, parallax: 0.7, alpha: 0.09 },
];

const STREAKS: readonly StreakSprite[] = [
  {
    x: 0.34,
    y: 0.18,
    length: 0.22,
    width: 7,
    angle: -0.22,
    phase: 0.4,
    parallax: 0.9,
    alpha: 0.1,
  },
  {
    x: 0.64,
    y: 0.58,
    length: 0.16,
    width: 4,
    angle: 0.14,
    phase: 2.8,
    parallax: 0.6,
    alpha: 0.08,
  },
];

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge1 <= edge0) return value >= edge1 ? 1 : 0;
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function collectKeepOut(main: HTMLElement): KeepOutRect[] {
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const nodes = main.querySelectorAll<HTMLElement>(
    "p, h1, h2, h3, h4, h5, h6, li, a, label, button, input, textarea, blockquote, dt, dd",
  );
  const rects: KeepOutRect[] = [];

  for (const node of Array.from(nodes)) {
    if (
      node.closest("[aria-hidden='true']") ||
      node.closest(".sr-only") ||
      !node.textContent ||
      node.textContent.trim().length === 0 ||
      node.getClientRects().length === 0
    ) {
      continue;
    }

    const rect = node.getBoundingClientRect();
    if (rect.width <= 2 || rect.height <= 2) continue;

    rects.push({
      left: rect.left - KEEP_OUT_PAD,
      top: rect.top + scrollY - KEEP_OUT_PAD,
      right: rect.right + KEEP_OUT_PAD,
      bottom: rect.bottom + scrollY + KEEP_OUT_PAD,
    });
  }

  return rects;
}

function overlaps(
  rects: readonly KeepOutRect[],
  left: number,
  top: number,
  right: number,
  bottom: number,
): boolean {
  for (const rect of rects) {
    if (
      left < rect.right &&
      right > rect.left &&
      top < rect.bottom &&
      bottom > rect.top
    ) {
      return true;
    }
  }
  return false;
}

function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  time: number,
  scrollY: number,
  fade: number,
  keepOut: readonly KeepOutRect[],
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (fade <= 0.004) return;

  const scaleX = canvas.width / Math.max(1, width);
  const scaleY = canvas.height / Math.max(1, height);
  ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  ctx.lineCap = "round";

  const sizeScale = Math.max(0.7, Math.min(1.5, width / 1280));

  for (const sprite of BOKEH) {
    const x =
      sprite.x * width + Math.sin(time * 0.07 + sprite.phase) * 8;
    const y =
      sprite.y * height +
      Math.sin(time * 0.22 + sprite.phase) * 9 -
      scrollY * 0.02 * sprite.parallax;
    const radius = sprite.radius * sizeScale;
    const alpha = Math.min(
      MAX_ALPHA,
      sprite.alpha *
        fade *
        (0.8 + 0.2 * Math.sin(time * 0.16 + sprite.phase)),
    );

    if (
      alpha <= 0.002 ||
      y + radius < 0 ||
      y - radius > height ||
      overlaps(
        keepOut,
        x - radius,
        y + scrollY - radius,
        x + radius,
        y + scrollY + radius,
      )
    ) {
      continue;
    }

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(226, 246, 255, ${alpha})`);
    gradient.addColorStop(0.55, `rgba(206, 238, 255, ${alpha * 0.5})`);
    gradient.addColorStop(1, "rgba(206, 238, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const sprite of STREAKS) {
    const length = sprite.length * height;
    const half = length * 0.5;
    const cx = sprite.x * width + Math.sin(time * 0.05 + sprite.phase) * 6;
    const cy =
      sprite.y * height -
      scrollY * 0.015 * sprite.parallax;
    const dx = Math.cos(sprite.angle) * half;
    const dy = Math.sin(sprite.angle) * half;
    const x0 = cx - dx;
    const y0 = cy - dy;
    const x1 = cx + dx;
    const y1 = cy + dy;
    const alpha = Math.min(
      MAX_ALPHA,
      sprite.alpha *
        fade *
        (0.75 + 0.25 * Math.sin(time * 0.12 + sprite.phase)),
    );
    const pad = sprite.width + 2;

    if (
      alpha <= 0.002 ||
      overlaps(
        keepOut,
        Math.min(x0, x1) - pad,
        Math.min(y0, y1) + scrollY - pad,
        Math.max(x0, x1) + pad,
        Math.max(y0, y1) + scrollY + pad,
      )
    ) {
      continue;
    }

    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, "rgba(215, 240, 255, 0)");
    gradient.addColorStop(0.45, `rgba(215, 240, 255, ${alpha})`);
    gradient.addColorStop(1, "rgba(215, 240, 255, 0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = sprite.width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  // One scripted silhouette, held in a fixed depth band as it crosses.
  const phase = (time * 0.018) % 1;
  const x = width * (1.08 - phase * 1.16);
  const bandTop = height * 0.6;
  const bandHeight = height * 0.08;
  const y =
    bandTop + bandHeight * 0.5 + Math.sin(time * 0.3) * bandHeight * 0.18;
  const bodyWidth = Math.min(150, width * 0.12);
  const bodyHeight = bodyWidth * 0.32;
  const alpha = Math.min(MAX_ALPHA, 0.12 * fade);

  if (
    alpha > 0.002 &&
    !overlaps(
      keepOut,
      x - bodyWidth * 0.8,
      y - bodyHeight * 0.6 + scrollY,
      x + bodyWidth * 0.55,
      y + bodyHeight * 0.6 + scrollY,
    )
  ) {
    ctx.fillStyle = `rgba(4, 18, 32, ${alpha})`;

    ctx.beginPath();
    ctx.moveTo(x - bodyWidth * 0.5, y);
    ctx.bezierCurveTo(
      x - bodyWidth * 0.3,
      y - bodyHeight * 0.6,
      x + bodyWidth * 0.35,
      y - bodyHeight * 0.5,
      x + bodyWidth * 0.5,
      y,
    );
    ctx.bezierCurveTo(
      x + bodyWidth * 0.35,
      y + bodyHeight * 0.5,
      x - bodyWidth * 0.3,
      y + bodyHeight * 0.6,
      x - bodyWidth * 0.5,
      y,
    );
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - bodyWidth * 0.5, y);
    ctx.lineTo(x - bodyWidth * 0.78, y - bodyHeight * 0.45);
    ctx.lineTo(x - bodyWidth * 0.78, y + bodyHeight * 0.45);
    ctx.closePath();
    ctx.fill();
  }
}

export function ForegroundCanvas() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    refreshTier();

    const main = document.querySelector<HTMLElement>("main");
    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let keepOut: KeepOutRect[] = main ? collectKeepOut(main) : [];
    let disposed = false;
    let lost = false;
    let observer: ResizeObserver | null = null;

    const destroyCanvas = () => {
      if (!canvas) return;
      canvas.removeEventListener("contextlost", onContextLost);
      canvas.remove();
      canvas = null;
      ctx = null;
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      destroyCanvas();
    };

    const measureKeepOut = () => {
      keepOut = main ? collectKeepOut(main) : [];
    };

    const resize = () => {
      if (!canvas) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const backingWidth = Math.max(
        1,
        Math.round(width * dpr * BACKING_SCALE),
      );
      const backingHeight = Math.max(
        1,
        Math.round(height * dpr * BACKING_SCALE),
      );

      if (canvas.width !== backingWidth) canvas.width = backingWidth;
      if (canvas.height !== backingHeight) canvas.height = backingHeight;
    };

    const createCanvas = (): boolean => {
      const next = document.createElement("canvas");
      next.dataset.foregroundCanvas = "";
      next.setAttribute("aria-hidden", "true");

      const context = next.getContext("2d", { alpha: true });
      if (!context) {
        lost = true;
        return false;
      }

      next.addEventListener("contextlost", onContextLost);
      host.appendChild(next);
      canvas = next;
      ctx = context;
      resize();
      return true;
    };

    const eligible = () =>
      !lost &&
      !disposed &&
      signal.webglOk &&
      !signal.fxOff &&
      !signal.reduced &&
      !signal.coarse &&
      signal.tier === 0;

    const unsubscribe = onFrame(() => {
      if (!eligible()) {
        destroyCanvas();
        return;
      }

      if (!canvas) {
        if (!createCanvas()) return;
        measureKeepOut();
      }

      if (!ctx || !canvas) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      // The environment bridge already rounds local light. Zero in the abyss.
      const fade = smoothstep(0.055, 0.16, signal.env.light);

      draw(
        ctx,
        canvas,
        width,
        height,
        signal.time,
        signal.scrollY,
        fade,
        keepOut,
      );
    });

    const onResize = () => {
      resize();
      measureKeepOut();
    };

    window.addEventListener("resize", onResize);

    if (typeof ResizeObserver !== "undefined" && main) {
      observer = new ResizeObserver(() => {
        measureKeepOut();
        resize();
      });
      observer.observe(main);
    }

    if (typeof document.fonts !== "undefined") {
      document.fonts.ready
        .then(() => {
          if (!disposed) measureKeepOut();
        })
        .catch(() => {
          // Font loading is optional; the first measurement still stands.
        });
    }

    return () => {
      disposed = true;
      unsubscribe();
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
      destroyCanvas();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
    />
  );
}
