"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Triangle, Program, Mesh } from "ogl";
import { T } from "@/lib/tuning";
import { onFrame, signal } from "@/lib/signal";
import { VERT, FRAG } from "./shader";

function shouldBailOut(): boolean {
  if (typeof window === "undefined") return true;

  // 1. ?fx=off
  const params = new URLSearchParams(window.location.search);
  if (params.get("fx") === "off") return true;

  // 2. prefers-reduced-motion without explicit opt-in
  const reducedMotion = Boolean(
    typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const optedIn =
    typeof localStorage !== "undefined" &&
    localStorage.getItem("ocean-fx") === "on";

  if (reducedMotion && !optedIn) return true;

  // 3. WebGL2 availability check
  try {
    const testCanvas = document.createElement("canvas");
    const gl2 =
      Boolean(window.WebGL2RenderingContext) &&
      testCanvas.getContext("webgl2");
    if (!gl2) {
      signal.webglOk = false;
      return true;
    }
  } catch {
    signal.webglOk = false;
    return true;
  }

  return false;
}

export function OceanCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (shouldBailOut()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: Renderer | null = null;
    let geometry: Triangle | null = null;
    let program: Program | null = null;

    try {
      const activeDpr = signal.coarse
        ? T.dprLow
        : Math.min(window.devicePixelRatio || 1, T.dprMax);

      renderer = new Renderer({
        canvas,
        dpr: activeDpr,
        alpha: false,
        antialias: false,
        depth: false,
      });

      const gl = renderer.gl;
      geometry = new Triangle(gl);

      const uniforms = {
        uTime: { value: 0 },
        uWaterline: { value: 0.7 },
        uTurb: { value: 0 },
        uPlunge: { value: -1 },
        uMouseVel: { value: 0 },
        uAspect: { value: 1 },
        uOct: { value: T.octaves },
        uRipple: { value: T.ripple },
        uMouse: { value: [-1, -1] },
        uSky: { value: [135 / 255, 206 / 255, 235 / 255] },
        uBg: {
          value: [
            [135 / 255, 206 / 255, 235 / 255],
            [0 / 255, 206 / 255, 209 / 255],
            [0 / 255, 206 / 255, 209 / 255],
            [51 / 255, 159 / 255, 168 / 255],
            [26 / 255, 58 / 255, 92 / 255],
          ],
        },
        uFx: { value: [0, 0, 0, 0] },
        uDebug: { value: 0 },
      };

      program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms,
      });

      const mesh = new Mesh(gl, { geometry, program });

      let lastWidth = -1;
      let lastHeight = -1;

      const resize = () => {
        if (!renderer) return;
        const w = window.innerWidth;
        const h = window.innerHeight;

        if (signal.coarse && lastWidth > 0 && lastHeight > 0) {
          const isHeightOnly = w === lastWidth;
          if (isHeightOnly && Math.abs(h - lastHeight) < 120) {
            return;
          }
        }

        lastWidth = w;
        lastHeight = h;

        const dpr = signal.coarse
          ? T.dprLow
          : Math.min(window.devicePixelRatio || 1, T.dprMax);

        renderer.dpr = dpr;
        renderer.setSize(w, h);
        uniforms.uAspect.value = w / Math.max(1, h);
      };

      resize();
      window.addEventListener("resize", resize);

      // Mount after first paint and fade in over 400 ms via CSS opacity
      const raf = requestAnimationFrame(() => {
        setVisible(true);
      });

      const unsubscribe = onFrame(() => {
        if (!renderer) return;
        uniforms.uTime.value = signal.time;
        renderer.render({ scene: mesh });
      });

      return () => {
        cancelAnimationFrame(raf);
        unsubscribe();
        window.removeEventListener("resize", resize);
        program?.remove?.();
        geometry?.remove();
        renderer?.gl.getExtension("WEBGL_lose_context")?.loseContext();
        renderer = null;
      };
    } catch {
      signal.webglOk = false;
      if (canvas) canvas.style.display = "none";
    }
  }, []);

  if (shouldBailOut()) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-[400ms] ease-in-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
