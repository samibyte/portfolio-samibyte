"use client";

import { useEffect, useRef, useState } from "react";
import { ZONES, metersAt } from "@/lib/zones";
import { measure, sections } from "@/lib/layout";
import type { ZoneId } from "@/lib/types";

/**
 * Zone at a page position. Between sections (the text-free gaps) the nearest
 * section wins, so the label never falls back to "surface" mid-dive.
 */
function zoneAt(pageY: number): ZoneId {
  const offsets = sections();
  if (offsets.length === 0) return "surface";

  let nearest = offsets[0];
  let nearestDistance = Infinity;

  for (const offset of offsets) {
    if (pageY >= offset.pageTop && pageY <= offset.pageBottom) {
      return offset.zone;
    }

    const distance =
      pageY < offset.pageTop
        ? offset.pageTop - pageY
        : pageY - offset.pageBottom;

    if (distance < nearestDistance) {
      nearest = offset;
      nearestDistance = distance;
    }
  }

  return nearest.zone;
}

export function DiveLine() {
  const [zoneId, setZoneId] = useState<ZoneId>("surface");
  const activeZoneRef = useRef<ZoneId>("surface");
  const metersRef = useRef<HTMLSpanElement | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    measure();

    let lastMeters = -1;
    let lastMarker = -1;

    const update = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const vh = window.innerHeight || 1;
      const midY = scrollY + vh * 0.5;

      // Metres readout: ref write only, and only when the rounded value changes.
      const meters = Math.round(metersAt(midY));
      if (meters !== lastMeters && metersRef.current) {
        metersRef.current.textContent = `${meters} m`;
        lastMeters = meters;
      }

      // Dive marker on the rule, at 0.1% resolution.
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0,
      );
      const maxScroll = Math.max(1, docHeight - vh);
      const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
      const marker = Math.round(progress * 1000) / 10;
      if (marker !== lastMarker && markerRef.current) {
        markerRef.current.style.top = `${marker}%`;
        lastMarker = marker;
      }

      // React state only when the zone itself changes (one render per change).
      const nextZone = zoneAt(midY);
      if (nextZone !== activeZoneRef.current) {
        activeZoneRef.current = nextZone;
        setZoneId(nextZone);
      }
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const currentZone = ZONES.find((zone) => zone.id === zoneId) || ZONES[0];

  return (
    <>
      {/* Screen-reader live region: announces the zone at most once per change. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`${currentZone.label} zone`}
      </div>

      {/* Fixed chrome, right edge. C1–C7 evidence lives in tests; this is visual. */}
      <aside
        data-dive-line
        aria-hidden="true"
        style={{ color: currentZone.text }}
        className="fixed right-3 md:right-5 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-3 pointer-events-none select-none transition-colors duration-300"
      >
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase opacity-60 [writing-mode:vertical-rl] rotate-180">
          {currentZone.label}
        </span>
        <div className="relative h-24 md:h-32 w-px bg-current/20">
          <div
            ref={markerRef}
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-current"
            style={{ top: "0%" }}
          />
        </div>
        <span
          ref={metersRef}
          data-dive-meters
          className="font-mono text-[11px] tabular-nums tracking-wider opacity-80"
        >
          0 m
        </span>
      </aside>
    </>
  );
}
