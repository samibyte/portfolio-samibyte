import { bgAt, metersAt, setSectionOffsets, type SectionOffset } from "./zones";
import type { ZoneId } from "./types";

let cachedSections: SectionOffset[] = [];
let cachedBlocks: WaterBlock[] = [];
let mainObserver: ResizeObserver | null = null;
let rafId: number | null = null;
let observedElement: HTMLElement | null = null;

/** Maximum keep-out rects the shader accepts (constant loop bound `uBlocks[8]`). */
export const MAX_WATER_BLOCKS = 8;

/** A `[data-water-block]` body-copy rect, cached in page space (P10.4). */
export interface WaterBlock {
  /** Left edge as a fraction of viewport width. */
  x0: number;
  /** Right edge as a fraction of viewport width. */
  x1: number;
  /** Page-space top edge, px. */
  pageTop: number;
  /** Page-space bottom edge, px. */
  pageBottom: number;
}

function scheduleMeasure(): void {
  if (typeof window === "undefined") return;
  if (rafId !== null) return;
  rafId = window.requestAnimationFrame(() => {
    rafId = null;
    measure();
  });
}

function ensureObserver(): void {
  if (typeof window === "undefined" || typeof ResizeObserver === "undefined") return;
  const main = document.querySelector<HTMLElement>("main");
  if (!main) return;

  if (main !== observedElement) {
    if (mainObserver && observedElement) {
      mainObserver.unobserve(observedElement);
    }
    if (!mainObserver) {
      mainObserver = new ResizeObserver(() => {
        scheduleMeasure();
      });
    }
    mainObserver.observe(main);
    observedElement = main;
  }
}

export function measure(): SectionOffset[] {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return cachedSections;
  }

  ensureObserver();

  const scrollY = window.scrollY || window.pageYOffset || 0;
  const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-zone]"));

  cachedSections = elements.map((el, index) => {
    const rect = el.getBoundingClientRect();
    const zone = (el.getAttribute("data-zone") || "surface") as ZoneId;
    const id = el.id || el.getAttribute("data-section-id") || `${zone}-${index}`;
    const pageTop = rect.top + scrollY;
    const pageBottom = rect.bottom + scrollY;

    return {
      id,
      zone,
      pageTop,
      pageBottom,
    };
  });

  setSectionOffsets(cachedSections);

  const vw = window.innerWidth || 1;
  cachedBlocks = Array.from(
    document.querySelectorAll<HTMLElement>("[data-water-block]"),
  )
    .slice(0, MAX_WATER_BLOCKS)
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        x0: rect.left / vw,
        x1: rect.right / vw,
        pageTop: rect.top + scrollY,
        pageBottom: rect.bottom + scrollY,
      };
    })
    .filter((block) => block.x1 > block.x0 && block.pageBottom > block.pageTop);

  return cachedSections;
}

/** Cached body-copy keep-out rects, in document order (P10.4). */
export function waterBlocks(): readonly WaterBlock[] {
  return cachedBlocks;
}

export function sections(): readonly SectionOffset[] {
  return cachedSections;
}

export function sectionAt(pageY: number): SectionOffset | undefined {
  return cachedSections.find(
    (section) => pageY >= section.pageTop && pageY <= section.pageBottom,
  );
}

export interface EnvironmentSample {
  /** Metres below the surface at this page position (unrounded). */
  depth: number;
  /** Luma of the local background, 0 (abyss) … 1 (bright surface). */
  light: number;
}

function luma(rgb: readonly [number, number, number]): number {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * Positional environment at a page coordinate (P10.2). Pure: reads the cached
 * section offsets only. Motion-derived values (current, flow phase) live in
 * `lib/signal.ts`; this function needs no frame state.
 */
export function environmentAt(pageY: number): EnvironmentSample {
  return {
    depth: metersAt(pageY),
    light: luma(bgAt(pageY)),
  };
}

export function documentHeight(): number {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return 0;
  }
  const lastSection = cachedSections[cachedSections.length - 1];
  const lastBottom = lastSection ? lastSection.pageBottom : 0;
  return Math.max(
    document.documentElement.scrollHeight,
    document.body ? document.body.scrollHeight : 0,
    lastBottom,
  );
}

export function disconnectLayout(): void {
  if (rafId !== null && typeof window !== "undefined") {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (mainObserver && observedElement) {
    mainObserver.unobserve(observedElement);
  }
  mainObserver?.disconnect();
  mainObserver = null;
  observedElement = null;
  cachedBlocks = [];
}
