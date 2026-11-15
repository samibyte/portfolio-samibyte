"use client";

import { glass } from "@/lib/glass";

export function BackToSurface() {
  const onClick = () => {
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={glass({
        variant: "control",
        tone: "regular",
        interactive: true,
        className:
          "mt-10 inline-flex items-center gap-2 px-5 py-2 text-[length:var(--fs-sm)] text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text)]",
      })}
    >
      <span aria-hidden="true">↑</span>
      Back to surface
    </button>
  );
}
