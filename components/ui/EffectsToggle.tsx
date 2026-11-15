"use client";

import { useSyncExternalStore } from "react";
import { glass } from "@/lib/glass";
import { refreshTier } from "@/lib/signal";

const STORAGE_KEY = "ocean-fx";
const listeners = new Set<() => void>();

function storedReduced(): boolean | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "off") return true;
    if (stored === "on") return false;
  } catch {
    // localStorage may be unavailable; fall back to the media query.
  }
  return null;
}

function prefersReduced(): boolean {
  return Boolean(
    typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
}

function getSnapshot(): boolean {
  const stored = storedReduced();
  return stored === null ? prefersReduced() : stored;
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };

  media.addEventListener("change", listener);
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
    window.removeEventListener("storage", onStorage);
  };
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function EffectsToggle() {
  const reduced = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = () => {
    try {
      localStorage.setItem(STORAGE_KEY, reduced ? "on" : "off");
    } catch {
      // The choice still applies for this page view when storage is blocked.
    }
    refreshTier();
    emit();
  };

  return (
    <button
      type="button"
      data-chrome="effects-toggle"
      aria-pressed={reduced}
      onClick={toggle}
      className={glass({
        variant: "control",
        tone: reduced ? "solid" : "chrome",
        interactive: true,
        className:
          "fixed bottom-3 right-3 z-10 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0e8f0]",
      })}
    >
      Reduce motion
    </button>
  );
}
