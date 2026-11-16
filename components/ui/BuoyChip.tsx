"use client";

import { useEffect, useRef } from "react";
import { glass } from "@/lib/glass";
import { onFrame, signal } from "@/lib/signal";
import { T } from "@/lib/tuning";
import { content } from "@/lib/content";

export function BuoyChip() {
  const chipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = chipRef.current;
    if (!el) return;

    let cachedX = 0.5;
    const updateX = () => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const chipCenter = rect.left + rect.width / 2;
      cachedX = chipCenter / Math.max(1, window.innerWidth);
    };

    updateX();
    window.addEventListener("resize", updateX);

    let lastBob = "";

    const unsubscribe = onFrame(() => {
      if (!el) return;

      if (signal.reduced || signal.coarse) {
        if (el.style.display !== "none") {
          el.style.display = "none";
        }
        return;
      }

      if (el.style.display === "none") {
        el.style.display = "";
      }

      const t = signal.time;
      const bob =
        -T.bobPx *
        (0.7 * Math.sin(cachedX * 6 + t * 1.5) +
          0.3 * Math.sin(cachedX * 17 - t * 2.3));
      const bobStr = `${bob.toFixed(2)}px`;

      if (bobStr !== lastBob) {
        el.style.setProperty("--bob", bobStr);
        lastBob = bobStr;
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", updateX);
    };
  }, []);

  return (
    <div
      ref={chipRef}
      data-buoy-chip
      style={{ transform: "translateY(var(--bob, 0px))" }}
      className={glass({
        variant: "chip",
        tone: "regular",
        className:
          "buoy-chip absolute top-[calc(var(--vh)*30)] right-6 md:right-12 lg:right-24 -mt-4 z-10 hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 text-[length:var(--fs-xs)] font-medium text-[var(--text)] motion-reduce:hidden",
      })}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
      </span>
      <span>{content.status}</span>
    </div>
  );
}
