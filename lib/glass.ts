/**
 * Glass UI (P9) — the one surface vocabulary for chrome, controls and content.
 *
 * CSS-first on purpose: no canvas, no WebGL context and no animation loop.
 * The visual rules live in `app/globals.css` under "Glass UI". The only
 * renderer that animates glass continuously is the bounded `FluidGlass` mark,
 * which subscribes to the single loop in `lib/signal.ts`.
 *
 * `variant` picks the shape; `tone` picks the fill:
 *   clear / regular / strong  zone-aware, mixed from the zone's own `--bg-top`
 *                             so the fill always moves away from `--text`
 *   solid                     `--text` fill, zone background as the text colour
 *   chrome                    the fixed dark `--panel`, for chrome that floats
 *                             over any zone and keeps light text
 */
export type GlassVariant =
  | "panel"
  | "bar"
  | "card"
  | "control"
  | "chip"
  | "field";

export type GlassTone = "clear" | "regular" | "strong" | "solid" | "chrome";

export interface GlassOptions {
  variant?: GlassVariant;
  tone?: GlassTone;
  interactive?: boolean;
  className?: string;
}

export function glass({
  variant = "panel",
  tone = "regular",
  interactive = false,
  className = "",
}: GlassOptions = {}): string {
  return [
    "glass",
    `glass--${variant}`,
    `glass--${tone}`,
    interactive ? "glass--interactive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
