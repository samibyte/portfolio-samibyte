"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { content } from "@/lib/content";
import { glass } from "@/lib/glass";
import { ZONES, metersAt } from "@/lib/zones";
import { measure, sections } from "@/lib/layout";
import type { ZoneId } from "@/lib/types";
import { EffectsToggle } from "@/components/ui/EffectsToggle";

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
  icon: ReactNode;
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
  const activeIdxRef = useRef<number>(isCaseStudy ? 1 : 0);
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

    const setActive = (next: number) => {
      if (next === activeIdxRef.current) return;
      activeIdxRef.current = next;
      setActiveIdx(next);
    };

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
        setActive(scrollY < 100 ? 0 : sectionIndexAt(midY));
      } else if (isCaseStudy) {
        setActive(1);
      }
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [isHome, isCaseStudy]);

  const currentZone = ZONES.find((zone) => zone.id === zoneId) || ZONES[0];

  const allItems = [
    {
      label: content.name,
      href: "/",
      isHome: true,
      icon: (
        <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight">
          SA
        </span>
      ),
    },
    ...NAV_ITEMS,
  ];

  return (
    <>
      {/* Screen-reader live region for depth changes (from DiveLine) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {`${currentZone.label} zone`}
      </div>

      <nav
        aria-label="Main"
        className={[glass({ variant: "panel", tone: "chrome" }), "dock"]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Navigation links */}
        <ul className="dock__list">
          {allItems.map((item, idx) => {
            const isHomeItem = "isHome" in item && item.isHome;
            const isProjects = item.label === "Projects";
            const isCurrent = isHomeItem
              ? isHome
                ? "page"
                : undefined
              : isProjects && isCaseStudy
                ? "page"
                : undefined;
            const isActive = activeIdx === idx;

            const contentNode = (
              <>
                <span className="dock__icon">{item.icon}</span>
                <span className="dock__tip" aria-hidden="true">
                  {item.label}
                </span>
              </>
            );

            return (
              <li key={item.label} className="dock__item">
                {"external" in item && item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="dock__link"
                  >
                    {contentNode}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={isCurrent}
                    aria-label={item.label}
                    data-active={isActive ? "true" : undefined}
                    onClick={() => {
                      activeIdxRef.current = idx;
                      setActiveIdx(idx);
                    }}
                    className="dock__link"
                  >
                    {contentNode}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {/* Depth spine + effects toggle */}
        <div className="dock__extra">
          <div
            data-dive-line
            aria-hidden="true"
            className="flex flex-col items-center w-full pointer-events-none select-none opacity-60"
          >
            <span className="text-[8px] font-mono tracking-[0.2em] uppercase text-[#e0e8f0]/60 [writing-mode:vertical-rl] rotate-180 mb-1">
              {currentZone.label}
            </span>
            <div className="dock__gauge">
              <div
                ref={markerRef}
                aria-hidden="true"
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#e0e8f0]"
                style={{ top: "0%" }}
              />
            </div>
            <span
              ref={metersRef}
              data-dive-meters
              className="mt-1 font-mono text-[9px] tabular-nums tracking-wider text-[#e0e8f0]/80"
            >
              0 m
            </span>
          </div>

          <div className="dock__toggle group/toggle">
            <EffectsToggle />
            <span className="dock__tip" aria-hidden="true">
              {reduced ? "Static" : "Reduce motion"}
            </span>
          </div>
        </div>
      </nav>
    </>
  );
}
