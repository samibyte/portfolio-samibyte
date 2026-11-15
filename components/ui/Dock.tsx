"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { content } from "@/lib/content";
import { glass } from "@/lib/glass";
import { ZONES, metersAt } from "@/lib/zones";
import { measure, sections } from "@/lib/layout";
import type { ZoneId } from "@/lib/types";
import { EffectsToggle } from "@/components/ui/EffectsToggle";

const TEXT = "text-[#e0e8f0]";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0e8f0]";

const STORAGE_KEY = "ocean-fx";

function storedReduced(): boolean | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "off") return true;
    if (stored === "on") return false;
  } catch {
    // Ignore
  }
  return null;
}

function prefersReduced(): boolean {
  return Boolean(
    typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
}

function getReducedSnapshot(): boolean {
  const stored = storedReduced();
  return stored === null ? prefersReduced() : stored;
}

function subscribeReduced(listener: () => void): () => void {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  media.addEventListener("change", listener);
  window.addEventListener("storage", onStorage);
  return () => {
    media.removeEventListener("change", listener);
    window.removeEventListener("storage", onStorage);
  };
}

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

function sectionIndexAt(pageY: number): number {
  const offsets = sections();
  if (offsets.length === 0) return 0;
  for (const offset of offsets) {
    if (pageY >= offset.pageTop && pageY <= offset.pageBottom) {
      if (offset.id === "hero") return 0;
      if (offset.id === "projects") return 1;
      if (offset.id === "about") return 2;
      if (offset.id === "skills") return 3;
      if (offset.id === "contact" || offset.id === "closing") return 4;
    }
  }
  return 0;
}

interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Projects",
    href: "/#projects",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="w-5 h-5 shrink-0"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4"
        />
      </svg>
    ),
  },
  {
    label: "About",
    href: "/#about",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="w-5 h-5 shrink-0"
      >
        <circle cx="12" cy="7" r="4" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 21v-2a7 7 0 0114 0v2"
        />
      </svg>
    ),
  },
  {
    label: "Skills",
    href: "/#skills",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="w-5 h-5 shrink-0"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-5.714L5 13l5.714-2.286L13 3z"
        />
      </svg>
    ),
  },
  {
    label: "Contact",
    href: "/#contact",
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="w-5 h-5 shrink-0"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    label: "Resume",
    href: content.resumeUrl,
    external: true,
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        className="w-5 h-5 shrink-0"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
];

export function Dock() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isCaseStudy = pathname.startsWith("/projects");

  const [zoneId, setZoneId] = useState<ZoneId>("surface");
  const [activeIdx, setActiveIdx] = useState<number>(isCaseStudy ? 1 : 0);

  const activeZoneRef = useRef<ZoneId>("surface");
  const metersRef = useRef<HTMLSpanElement | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);

  const reduced = useSyncExternalStore(
    subscribeReduced,
    getReducedSnapshot,
    () => false,
  );

  useEffect(() => {
    measure();

    let lastMeters = -1;
    let lastMarker = -1;

    const update = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const vh = window.innerHeight || 1;
      const midY = scrollY + vh * 0.5;

      const meters = Math.round(metersAt(midY));
      if (meters !== lastMeters && metersRef.current) {
        metersRef.current.textContent = `${meters} m`;
        lastMeters = meters;
      }

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

      const nextZone = zoneAt(midY);
      if (nextZone !== activeZoneRef.current) {
        activeZoneRef.current = nextZone;
        setZoneId(nextZone);
      }

      if (isHome) {
        if (scrollY < 100) {
          setActiveIdx(0);
        } else {
          setActiveIdx(sectionIndexAt(midY));
        }
      }
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isHome]);

  const currentZone = ZONES.find((zone) => zone.id === zoneId) || ZONES[0];

  const indicatorOffset =
    activeIdx === 0 ? 0 : 44 + 8 + (activeIdx - 1) * 48;

  return (
    <>
      {/* Screen-reader live region for depth changes (from DiveLine) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`${currentZone.label} zone`}
      </div>

      <nav
        aria-label="Main"
        className={glass({
          variant: "panel",
          tone: "chrome",
          className:
            "fixed left-4 top-4 bottom-4 z-20 flex flex-col justify-between items-center w-[3.5rem] md:w-[4.5rem] py-3 px-1.5 md:px-2.5 select-none",
        })}
      >
        {/* Top: Home + Nav Links */}
        <div className="w-full flex flex-col items-center">
          <div className="relative w-full flex flex-col items-center">
            {/* Sliding Active Indicator */}
            <div
              aria-hidden="true"
              className="absolute left-0 top-0 w-1 rounded-r bg-[#e0e8f0] pointer-events-none"
              style={{
                height: "44px",
                transform: `translateY(${indicatorOffset}px)`,
                transition: reduced
                  ? "none"
                  : "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />

            {/* Home / Identity Link */}
            <div className="relative group/item w-full flex justify-center">
              <Link
                href="/"
                aria-current={isHome ? "page" : undefined}
                aria-label={content.name}
                className={`flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg ${TEXT} hover:text-white ${FOCUS} transition-colors`}
              >
                <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight">
                  SA
                </span>
              </Link>
              <span className="pointer-events-none absolute left-full ml-3 hidden md:group-hover/item:inline-flex md:group-focus-visible/item:inline-flex items-center px-2.5 py-1 text-xs font-mono tracking-wider uppercase rounded-md bg-[#050d1a]/95 text-[#e0e8f0] border border-[#e0e8f0]/20 shadow-lg whitespace-nowrap z-30">
                {content.name}
              </span>
            </div>

            {/* In-page Links */}
            <ul className="mt-2 flex flex-col gap-1 w-full items-center">
              {NAV_ITEMS.map((item, idx) => {
                const itemIndex = idx + 1;
                const isProjects = item.label === "Projects";
                const isCurrent = isProjects && isCaseStudy ? "page" : undefined;

                return (
                  <li key={item.label} className="relative group/item w-full flex justify-center">
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={item.label}
                        className={`flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg ${TEXT} hover:text-white ${FOCUS} transition-colors`}
                      >
                        {item.icon}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        aria-current={isCurrent}
                        aria-label={item.label}
                        onClick={() => setActiveIdx(itemIndex)}
                        className={`flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg ${TEXT} hover:text-white ${FOCUS} transition-colors`}
                      >
                        {item.icon}
                      </Link>
                    )}
                    <span className="pointer-events-none absolute left-full ml-3 hidden md:group-hover/item:inline-flex md:group-focus-visible/item:inline-flex items-center px-2.5 py-1 text-xs font-mono tracking-wider uppercase rounded-md bg-[#050d1a]/95 text-[#e0e8f0] border border-[#e0e8f0]/20 shadow-lg whitespace-nowrap z-30">
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Center / Depth Spine readout (from DiveLine) */}
        <div
          data-dive-line
          aria-hidden="true"
          className="my-auto py-2 flex flex-col items-center w-full pointer-events-none select-none transition-colors duration-300"
        >
          <span className="text-[9px] md:text-[10px] font-mono tracking-[0.25em] uppercase text-[#e0e8f0]/60 [writing-mode:vertical-rl] rotate-180">
            {currentZone.label}
          </span>
          <div className="relative h-14 md:h-18 w-px bg-[#e0e8f0]/20 my-2">
            <div
              ref={markerRef}
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#e0e8f0]"
              style={{ top: "0%" }}
            />
          </div>
          <span
            ref={metersRef}
            data-dive-meters
            className="font-mono text-[10px] md:text-[11px] tabular-nums tracking-wider text-[#e0e8f0]/80"
          >
            0 m
          </span>
        </div>

        {/* Footer: EffectsToggle */}
        <div className="relative group/item w-full flex justify-center pt-2 border-t border-[#e0e8f0]/10">
          <EffectsToggle />
          <span className="pointer-events-none absolute left-full ml-3 hidden md:group-hover/item:inline-flex md:group-focus-visible/item:inline-flex items-center px-2.5 py-1 text-xs font-mono tracking-wider uppercase rounded-md bg-[#050d1a]/95 text-[#e0e8f0] border border-[#e0e8f0]/20 shadow-lg whitespace-nowrap z-30">
            {reduced ? "Static" : "Reduce motion"}
          </span>
        </div>
      </nav>
    </>
  );
}
