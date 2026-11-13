"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Triangle, Program, Mesh } from "ogl";
import { T } from "@/lib/tuning";
import { onFrame, signal } from "@/lib/signal";
import { ZONES, bgAt, fxAt } from "@/lib/zones";
import { VERT, FRAG } from "./shader";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

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

      const uBgValue: [number, number, number][] = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      const uFxValue: [number, number, number, number] = [0, 0, 0, 0];
      const uMouseValue: [number, number] = [-1, -1];
      const skyRgb = hexToRgb(ZONES[0].bgTop);

      const uniforms = {
        uTime: { value: 0 },
        uWaterline: { value: 0.7 as number },
        uTurb: { value: 0 as number },
        uPlunge: { value: -1 as number },
        uMouseVel: { value: 0 as number },
        uAspect: { value: 1 as number },
        uOct: { value: T.octaves as number },
        uRipple: { value: T.ripple as number },
        uMouse: { value: uMouseValue },
        uSky: { value: skyRgb },
        uBg: { value: uBgValue },
        uFx: { value: uFxValue },
        uDebug: { value: 0 as number },
      };

      program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms,
      });

      const mesh = new Mesh(gl, { geometry, program });

      let lastWidth = -1;
      let lastHeight = -1;
      let rawPointerX = -1;
      let rawPointerY = -1;

      const onPointerMove = (e: PointerEvent) => {
        rawPointerX = e.clientX;
        rawPointerY = e.clientY;
      };
      window.addEventListener("pointermove", onPointerMove, { passive: true });

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

        const scrollY = signal.scrollY;
        const vh = window.innerHeight || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // 1. uBg - filled in place each frame from bgAt() at viewport rows scrollY + [0, .25, .5, .75, 1] * vh, top-down
        const rows = [0, 0.25, 0.5, 0.75, 1];
        for (let i = 0; i < 5; i++) {
          const rgb = bgAt(scrollY + rows[i] * vh);
          uBgValue[i][0] = rgb[0];
          uBgValue[i][1] = rgb[1];
          uBgValue[i][2] = rgb[2];
        }

        // 2. uSky = surface bgTop, uAspect = w / h
        uniforms.uAspect.value = w / Math.max(1, h);

        // 3. uFx - reals from fxAt(scrollY + vh / 2)
        const fx = fxAt(scrollY + vh * 0.5);
        uFxValue[0] = fx[0];
        uFxValue[1] = fx[1];
        uFxValue[2] = fx[2];
        uFxValue[3] = fx[3];

        // 4. uMouse - [x / w, 1 - y / h], init (-1, -1). uMouseVel from pointer spring
        if (rawPointerX >= 0 && rawPointerY >= 0 && w > 0 && h > 0) {
          uMouseValue[0] = rawPointerX / w;
          uMouseValue[1] = 1 - rawPointerY / h;
        } else {
          uMouseValue[0] = -1;
          uMouseValue[1] = -1;
        }
        uniforms.uMouseVel.value = signal.pointerSpring.x;

        // 5. uOct - T.octaves normally, 2 in low tier
        uniforms.uOct.value = signal.coarse ? 2 : T.octaves;

        // 6. uTime - signal.time (0 under reduced motion)
        uniforms.uTime.value = signal.reduced ? 0 : signal.time;

        // 7. uRipple - T.ripple, scaled by pointer spring; 0 in Tier 2 and under reduced motion
        if (signal.coarse || signal.reduced) {
          uniforms.uRipple.value = 0;
        } else {
          uniforms.uRipple.value = T.ripple * Math.max(0, signal.pointerSpring.x);
        }

        // 8. uTurb & uWaterline
        uniforms.uTurb.value = Math.abs(signal.scrollSpring.x);
        const isHome = window.location.pathname === "/";
        uniforms.uWaterline.value = isHome ? 0.7 + scrollY / vh : 2.0;

        renderer.render({ scene: mesh });
      });

      return () => {
        cancelAnimationFrame(raf);
        unsubscribe();
        window.removeEventListener("pointermove", onPointerMove);
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
