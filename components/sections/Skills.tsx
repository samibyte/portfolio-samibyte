"use client";

import { useEffect, useRef } from "react";
import { content } from "@/lib/content";
import { glass } from "@/lib/glass";
import { onFrame, signal } from "@/lib/signal";

export function Skills() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const TORCH_RADIUS = 160;

    interface SkillNode {
      el: HTMLElement;
      x: number;
      pageY: number;
      lastGlow: number;
    }

    let skillNodes: SkillNode[] = [];

    const measure = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const elements = Array.from(
        section.querySelectorAll<HTMLElement>("[data-skill]"),
      );
      skillNodes = elements.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          el,
          x: rect.left + rect.width / 2,
          pageY: rect.top + scrollY + rect.height / 2,
          lastGlow: -1,
        };
      });
    };

    measure();
    window.addEventListener("resize", measure);

    const unsubscribe = onFrame(() => {
      const isOff =
        signal.reduced ||
        signal.coarse ||
        signal.pointer.x < 0 ||
        signal.pointer.y < 0;

      if (isOff) {
        for (let i = 0; i < skillNodes.length; i++) {
          const item = skillNodes[i];
          if (item.lastGlow !== 0) {
            item.el.style.setProperty("--glow", "0");
            item.lastGlow = 0;
          }
        }
        return;
      }

      const px = signal.pointer.x;
      const py = signal.pointer.y;
      const scrollY = signal.scrollY;

      for (let i = 0; i < skillNodes.length; i++) {
        const item = skillNodes[i];
        const viewportY = item.pageY - scrollY;
        const dist = Math.hypot(px - item.x, py - viewportY);
        const rawGlow =
          dist < TORCH_RADIUS ? Math.max(0, 1 - dist / TORCH_RADIUS) : 0;
        const glow = Math.round(rawGlow * 100) / 100;

        if (glow !== item.lastGlow) {
          item.el.style.setProperty("--glow", glow.toString());
          item.lastGlow = glow;
        }
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", measure);
      for (let i = 0; i < skillNodes.length; i++) {
        skillNodes[i].el.style.removeProperty("--glow");
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="skills"
      data-zone="midnight"
      aria-labelledby="skills-title"
      className="relative px-6 py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <h2
          id="skills-title"
          className="font-[family-name:var(--font-display)] text-[length:var(--fs-3xl)] leading-tight text-[var(--text)]"
        >
          Skills
        </h2>
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {content.skills.map((group) => (
            <li key={group.title}>
              <h3 className="text-[length:var(--fs-sm)] font-medium uppercase tracking-[0.2em] text-[var(--text)]/70">
                {group.title}
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    data-skill={item}
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--text) calc(25% + var(--glow, 0) * 75%), transparent)",
                      backgroundColor:
                        "color-mix(in srgb, var(--accent) calc(var(--glow, 0) * 25%), transparent)",
                      boxShadow:
                        "var(--glass-shadow), 0 0 calc(var(--glow, 0) * 16px) color-mix(in srgb, var(--accent) calc(var(--glow, 0) * 40%), transparent)",
                    }}
                    className={glass({
                      variant: "chip",
                      tone: "clear",
                      className:
                        "px-3 py-1.5 text-[length:var(--fs-sm)] text-[var(--text)]",
                    })}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
