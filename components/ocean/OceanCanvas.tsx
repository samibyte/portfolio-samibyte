"use client";

import { useEffect, useRef } from "react";
import { Renderer, Triangle, Program, Mesh } from "ogl";
import { T } from "@/lib/tuning";
import { onFrame, signal, refreshTier, tierSettings, readForcedTier } from "@/lib/signal";
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

  // 0. Dev-only tier override that removes the canvas (tier 4).
  if (readForcedTier() === 4) return true;

  // 1. ?fx=off
  const params = new URLSearchParams(window.location.search);
  if (params.get("fx") === "off") return true;

  // 2. WebGL2 availability check
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldBailOut()) return;

    const container = containerRef.current;
    if (!container) return;

    refreshTier();
    const initialSettings = tierSettings(signal.tier);
    if (!initialSettings.canvas) return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.dataset.oceanCanvas = "";
    canvas.className =
      "fixed inset-0 z-0 pointer-events-none opacity-0 transition-opacity duration-[400ms] ease-in-out";
    container.appendChild(canvas);

    let disposed = false;
    const onContextLost = (event: Event) => {
      if (disposed) return;
      event.preventDefault();
      signal.webglOk = false;
      refreshTier();
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    let renderer: Renderer | null = null;
    let geometry: Triangle | null = null;
    let program: Program | null = null;
    let unsubscribe: (() => void) | null = null;
    let raf = 0;

    try {
      const activeDpr = Math.min(
        window.devicePixelRatio || 1,
        initialSettings.dprCap,
      );

      renderer = new Renderer({
        canvas,
        dpr: activeDpr,
        alpha: false,
        antialias: false,
        depth: false,
      });

      const gl = renderer.gl;
      if (!gl || gl.isContextLost()) {
        signal.webglOk = false;
        canvas.remove();
        return;
      }

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
      const waterRgb = hexToRgb(ZONES[0].bgBot);
      const accentRgb = hexToRgb(ZONES[0].accent);

      const initialDebug =
        typeof window !== "undefined"
          ? (window as unknown as { __oceanDebug?: { layer?: number } })
              .__oceanDebug
          : undefined;

      const uniforms = {
        uTime: { value: 0 },
        uWaterline: { value: 0.7 as number },
        uTurb: { value: 0 as number },
        uPlunge: { value: -1 as number },
        uMouseVel: { value: 0 as number },
        uAspect: { value: 1 as number },
        uOct: { value: initialSettings.octaves as number },
        uRipple: { value: initialSettings.ripple ? T.ripple : 0 },
        uMouse: { value: uMouseValue },
        uSky: { value: skyRgb },
        // P8.2 sky + surface + waterline: all static per session, read from lib/tuning.ts and ZONES[0].
        uWaterTop: { value: waterRgb },
        uAccent: { value: accentRgb },
        uWaveAmp: { value: T.waveAmp as number },
        uBandDepth: { value: T.bandDepth as number },
        uBandLight: { value: T.bandLight as number },
        uSkyHorizon: { value: T.skyHorizon as number },
        uWaveFreq: {
          value: [
            T.waveFreq0,
            T.waveFreq1,
            T.waveFreq2,
            T.waveFreq3,
          ] as [number, number, number, number],
        },
        uWaveSpeed: {
          value: [
            T.waveSpeed0,
            T.waveSpeed1,
            T.waveSpeed2,
            T.waveSpeed3,
          ] as [number, number, number, number],
        },
        uSun: {
          value: [T.sunX, T.sunY, T.sunGlow, T.sunStrength] as [
            number,
            number,
            number,
            number,
          ],
        },
        uCloud: {
          value: [
            T.cloudOpacity,
            T.cloudSpeed,
            T.cloudShadow,
            T.cloudScale,
          ] as [number, number, number, number],
        },
        uDepth: {
          value: [
            T.depthStart,
            T.depthGain,
            T.depthFadeNear,
            T.depthFadeFar,
          ] as [number, number, number, number],
        },
        uFlow: {
          value: [T.flowAmp, T.flowSpeed, T.warpAmp, T.warpSpeed] as [
            number,
            number,
            number,
            number,
          ],
        },
        uFoam: {
          value: [T.foamWidth, T.foamLight, 0, T.sparkle] as [
            number,
            number,
            number,
            number,
          ],
        },
        uRippleCfg: {
          value: [T.rippleFreq, T.rippleSpeed, T.rippleFalloff, 0] as [
            number,
            number,
            number,
            number,
          ],
        },
        // P8.3 Refraction + caustics + rays
        uRay: {
          value: [T.rayCount, T.rayWidth, T.rayFalloff, T.rayAmp] as [
            number,
            number,
            number,
            number,
          ],
        },
        uCaustic: {
          value: [T.causticCells, T.causticAmp, T.perspNear, T.perspFar] as [
            number,
            number,
            number,
            number,
          ],
        },
        uPersp: {
          value: [T.perspNearScale, T.fogStrength, T.flowAmp2, T.flowSpeed2] as [
            number,
            number,
            number,
            number,
          ],
        },
        uSpec: {
          value: [T.specPower, T.specAmp, 0, 0] as [
            number,
            number,
            number,
            number,
          ],
        },
        uBg: { value: uBgValue },
        uFx: { value: uFxValue },
        uDebug: {
          value:
            typeof initialDebug?.layer === "number" ? initialDebug.layer : 0,
        },
      };

      program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms,
      });

      if (!gl.getProgramParameter(program.program, gl.LINK_STATUS)) {
        signal.webglOk = false;
        canvas.remove();
        return;
      }

      const mesh = new Mesh(gl, { geometry, program });

      let lastWidth = -1;
      let lastHeight = -1;
      let canvasRect = { left: 0, top: 0, width: 0, height: 0 };
      let hasRendered = false;
      let lastRenderScrollY = -1;
      let lastRenderVh = -1;
      let lastRenderW = -1;
      let lastRenderH = -1;
      let lastRenderIsHome: boolean | null = null;
      let lastRenderDebug = -1;

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

        const dpr = Math.min(
          window.devicePixelRatio || 1,
          tierSettings(signal.tier).dprCap,
        );

        renderer.dpr = dpr;
        renderer.setSize(w, h);
        uniforms.uAspect.value = w / Math.max(1, h);

        const rect = canvas.getBoundingClientRect();
        canvasRect = {
          left: rect.left,
          top: rect.top,
          width: rect.width || w,
          height: rect.height || h,
        };
      };

      resize();
      window.addEventListener("resize", resize);

      // Mount after first paint and fade in over 400 ms via CSS opacity
      raf = requestAnimationFrame(() => {
        canvas.classList.remove("opacity-0");
        canvas.classList.add("opacity-100");
      });

      unsubscribe = onFrame(() => {
        if (!renderer || renderer.gl.isContextLost()) return;

        const settings = tierSettings(signal.tier);
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
        uFxValue[2] = fx[2] * settings.snowScale;
        uFxValue[3] = settings.glow ? fx[3] : 0;

        // 4. uMouse - [x / w, 1 - y / h], init (-1, -1). uMouseVel from pointer spring
        const px = signal.pointer.x;
        const py = signal.pointer.y;
        if (
          px >= 0 &&
          py >= 0 &&
          canvasRect.width > 0 &&
          canvasRect.height > 0
        ) {
          uMouseValue[0] = (px - canvasRect.left) / canvasRect.width;
          uMouseValue[1] = 1 - (py - canvasRect.top) / canvasRect.height;
        } else {
          uMouseValue[0] = -1;
          uMouseValue[1] = -1;
        }
        uniforms.uMouseVel.value = signal.pointerSpring.x;

        // 5. uOct - T.octaves at full quality, T.octavesLow in tiers 1 and 2
        uniforms.uOct.value = settings.octaves;

        // 6. uTime - signal.time, 0 in tiers 3 and 4 (static)
        uniforms.uTime.value = settings.static ? 0 : signal.time;

        // 7. uRipple - T.ripple at full/adaptive quality, 0 in tiers 2-4
        uniforms.uRipple.value = settings.ripple ? T.ripple : 0;

        // 8. uTurb & uWaterline (P4.2: uTurb = |x|, settles in <3s, continuous on reversal)
        uniforms.uTurb.value = Math.abs(signal.scrollSpring.x);
        const isHome = window.location.pathname === "/";
        uniforms.uWaterline.value = isHome ? 0.7 + scrollY / vh : 2.0;

        // 9. uPlunge - seconds since plungeStartedAt for T.plungeDuration, else -1
        if (signal.plungeStartedAt > 0) {
          const elapsed = performance.now() / 1000 - signal.plungeStartedAt;
          uniforms.uPlunge.value =
            elapsed >= 0 && elapsed <= T.plungeDuration ? elapsed : -1;
        } else {
          uniforms.uPlunge.value = -1;
        }

        // 10. uDebug from window.__oceanDebug?.layer
        const debug =
          typeof window !== "undefined"
            ? (window as unknown as { __oceanDebug?: { layer?: number } })
                .__oceanDebug
            : undefined;
        uniforms.uDebug.value =
          typeof debug?.layer === "number" ? debug.layer : 0;

        // Static tiers render only when a value changed (no animation)
        if (settings.static) {
          if (
            hasRendered &&
            scrollY === lastRenderScrollY &&
            vh === lastRenderVh &&
            w === lastRenderW &&
            h === lastRenderH &&
            isHome === lastRenderIsHome &&
            uniforms.uDebug.value === lastRenderDebug
          ) {
            return;
          }
        }

        renderer.render({ scene: mesh });
        hasRendered = true;
        lastRenderScrollY = scrollY;
        lastRenderVh = vh;
        lastRenderW = w;
        lastRenderH = h;
        lastRenderIsHome = isHome;
        lastRenderDebug = uniforms.uDebug.value;
      });

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        if (unsubscribe) unsubscribe();
        window.removeEventListener("resize", resize);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        program?.remove?.();
        geometry?.remove();
        renderer?.gl.getExtension("WEBGL_lose_context")?.loseContext();
        renderer = null;
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      };
    } catch {
      signal.webglOk = false;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  }, []);

  if (shouldBailOut()) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}
