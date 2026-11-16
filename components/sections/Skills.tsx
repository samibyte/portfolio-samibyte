"use client";

import { useEffect, useRef } from "react";
import { content } from "@/lib/content";
import { onFrame, signal } from "@/lib/signal";
import { SECTION_ZONE, ZONES } from "@/lib/zones";

const SKILLS_ZONE =
  ZONES.find((zone) => zone.id === SECTION_ZONE.skills) ?? ZONES[0];

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
      className="relative px-6 py-[var(--station-pad)]"
    >
      <div data-water-block className="mx-auto w-full max-w-[96rem]">
        <h2
          id="skills-title"
          className="font-[family-name:var(--font-display)] text-[length:var(--fs-display)] leading-[0.9] tracking-[var(--tracking-tight)] text-[var(--text)]"
        >
          Skills
        </h2>

        <p className="instrument mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[length:var(--fs-xs)] text-[var(--text)]">
          <span
            aria-hidden="true"
            className="h-px w-8 shrink-0 bg-current opacity-30"
          />
          <span>{SKILLS_ZONE.label}</span>
          <span>
            {SKILLS_ZONE.metersFrom}–{SKILLS_ZONE.metersTo} M
          </span>
        </p>

        <ul className="skill-fields">
          {content.skills.map((group) => (
            <li key={group.title} className="skill-group">
              <h3 className="skill-group__label instrument">{group.title}</h3>
              <ul className="skill-field">
                {group.items.map((item) => (
                  <li key={item} data-skill={item} className="skill-node">
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
