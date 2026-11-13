"use client";

import dynamic from "next/dynamic";
import { useEffect, type ReactNode } from "react";
import { measure } from "@/lib/layout";
import { signal, start, stop } from "@/lib/signal";

const OceanCanvas = dynamic(
  () => import("./OceanCanvas").then((mod) => mod.OceanCanvas),
  { ssr: false },
);

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

  return (
    <>
      <OceanCanvas />
      {children}
    </>
  );
}
