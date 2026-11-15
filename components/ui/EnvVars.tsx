"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { onFrame, signal } from "@/lib/signal";

/**
 * The single environment consumer (P10.2). It owns one `display: contents`
 * element and copies the rounded values from `signal.env` into CSS vars on
 * that element only — never `:root`/`body` — and only when a value changes.
 *
 * Vars (all unitless): `--env-depth` (m), `--env-light` (0–1),
 * `--env-current` (-1–1), `--env-phase` (0–1).
 */
export function EnvVars({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let depth = Number.NaN;
    let light = Number.NaN;
    let current = Number.NaN;
    let phase = Number.NaN;

    const unsubscribe = onFrame(() => {
      const env = signal.env;

      if (env.depth !== depth) {
        depth = env.depth;
        el.style.setProperty("--env-depth", String(depth));
      }
      if (env.light !== light) {
        light = env.light;
        el.style.setProperty("--env-light", String(light));
      }
      if (env.current !== current) {
        current = env.current;
        el.style.setProperty("--env-current", String(current));
      }
      if (env.phase !== phase) {
        phase = env.phase;
        el.style.setProperty("--env-phase", String(phase));
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div ref={ref} data-env="" style={{ display: "contents" }}>
      {children}
    </div>
  );
}
