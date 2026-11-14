"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { content } from "@/lib/content";

const LINKS = [
  { label: "Projects", href: "/#projects" },
  { label: "About", href: "/#about" },
  { label: "Skills", href: "/#skills" },
  { label: "Contact", href: "/#contact" },
] as const;

const TEXT = "text-[#e0e8f0]";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0e8f0]";

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";

  return (
    <nav
      aria-label="Main"
      className="fixed top-3 left-1/2 z-10 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 rounded-2xl bg-[var(--panel)]"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          aria-current={isHome ? "page" : undefined}
          className={`font-[family-name:var(--font-display)] text-lg ${TEXT} ${FOCUS} py-1`}
        >
          {content.name}
        </Link>

        <ul className="hidden items-center gap-5 sm:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={
                  link.label === "Projects" && pathname.startsWith("/projects")
                    ? "page"
                    : undefined
                }
                className={`block py-1 text-sm ${TEXT} hover:text-white ${FOCUS}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href={content.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className={`block py-1 text-sm ${TEXT} hover:text-white ${FOCUS}`}
            >
              Resume
            </a>
          </li>
        </ul>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((value) => !value)}
          className={`rounded border border-[#e0e8f0]/40 px-3 py-2 text-sm sm:hidden ${TEXT} ${FOCUS}`}
        >
          Menu
        </button>
      </div>

      <div
        id="nav-menu"
        hidden={!open}
        className="border-t border-[#e0e8f0]/20 px-4 pb-4 sm:hidden"
      >
        <ul className="flex flex-col gap-1">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={
                  link.label === "Projects" && pathname.startsWith("/projects")
                    ? "page"
                    : undefined
                }
                className={`block px-2 py-3 text-sm ${TEXT} hover:text-white ${FOCUS}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <a
              href={content.resumeUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className={`block px-2 py-3 text-sm ${TEXT} hover:text-white ${FOCUS}`}
            >
              Resume
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
