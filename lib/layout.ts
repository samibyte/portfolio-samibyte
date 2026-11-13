import { setSectionOffsets, type SectionOffset } from "./zones";
import type { ZoneId } from "./types";

let cachedSections: SectionOffset[] = [];
let mainObserver: ResizeObserver | null = null;
let rafId: number | null = null;
let observedElement: HTMLElement | null = null;

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
  return cachedSections;
}

export function sections(): readonly SectionOffset[] {
  return cachedSections;
}

export function sectionAt(pageY: number): SectionOffset | undefined {
  return cachedSections.find(
    (section) => pageY >= section.pageTop && pageY <= section.pageBottom,
  );
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
}
