"use client";

import { useEffect, type ReactNode } from "react";
import { measure } from "@/lib/layout";
import { signal, start, stop } from "@/lib/signal";

declare global {
  interface Window {
    __ocean?: typeof signal;
  }
}

function setVhProperty(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  document.documentElement.style.setProperty(
    "--vh",
    `${window.innerHeight * 0.01}px`,
  );
}

export function OceanProvider({ children }: { children?: ReactNode }) {
  useEffect(() => {
    let lastWidth = window.innerWidth;

    setVhProperty();

    const onResize = () => {
      if (window.innerWidth !== lastWidth) {
        lastWidth = window.innerWidth;
        setVhProperty();
      }
    };

    const onOrientationChange = () => {
      lastWidth = window.innerWidth;
      setVhProperty();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientationChange);

    if (process.env.NODE_ENV === "development") {
      window.__ocean = signal;
    }

    measure();
    start();

    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientationChange);
      if (process.env.NODE_ENV === "development") {
        delete window.__ocean;
      }
    };
  }, []);

  return children ? <>{children}</> : null;
}
