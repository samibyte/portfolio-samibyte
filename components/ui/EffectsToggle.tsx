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
      aria-label="Reduce motion"
      onClick={toggle}
      className={glass({
        variant: "control",
        tone: reduced ? "solid" : "chrome",
        interactive: true,
        className:
          "flex items-center w-full min-h-[44px] h-11 px-2.5 text-xs font-mono tracking-wider focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0e8f0]",
      })}
    >
      <span className="flex items-center justify-center w-6 h-6 shrink-0">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="w-5 h-5 shrink-0"
        >
          {reduced ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          )}
        </svg>
      </span>
      <span className="hidden md:group-hover:inline md:group-focus-within:inline ml-3 text-xs font-mono tracking-wider uppercase truncate">
        {reduced ? "Static" : "Reduce motion"}
      </span>
    </button>
  );
}
