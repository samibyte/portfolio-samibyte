"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { content } from "@/lib/content";
import { onFrame, signal } from "@/lib/signal";

const WORDS = content.name.split(/\s+/).filter(Boolean);

function Letters({ copy }: { copy: "above" | "below" | "reflection" }) {
  let index = 0;

  return (
    <>
      {WORDS.map((word, wordIndex) => (
        <span key={`${copy}-word-${wordIndex}`} className="masthead__word-part">
          {Array.from(word).map((letter) => {
            const letterIndex = index++;
            return (
              <span
                key={`${copy}-letter-${letterIndex}`}
                data-letter
                className="masthead__letter"
                style={{ "--letter-index": letterIndex } as CSSProperties}
              >
                {letter}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}

function SilentCopy({ copy }: { copy: "below" | "reflection" }) {
  return (
    <div
      data-masthead={copy}
      aria-hidden="true"
      className={`masthead__copy masthead__${copy}`}
    >
      <div data-masthead-word className="masthead__word">
        <Letters copy={copy} />
      </div>
    </div>
  );
}

const ABOVE_LETTERS = '[data-masthead="above"] [data-letter]';
const BELOW_LETTERS = '[data-masthead="below"] [data-letter]';
const ABOVE_WORD = '[data-masthead="above"] [data-masthead-word]';

/** The loop writes device pixels; 0.5 px steps keep the writes rare (D-210). */
function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/**
 * Hero masthead, variant A (P10.5 / D-210). Real HTML text split per letter.
 * The above copy carries the accessible name and is measured by C4; the below
 * copy and the mirrored reflection are decorative and `aria-hidden`.
 *
 * Motion is driven by the single loop: two sine waves per letter plus the
 * scroll spring, rounded to 0.5 px and only written when the value changes.
 * Reduced motion freezes every letter and the pointer tilt.
 */
export function Masthead() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const above = Array.from(root.querySelectorAll<HTMLElement>(ABOVE_LETTERS));
    const below = Array.from(root.querySelectorAll<HTMLElement>(BELOW_LETTERS));
    const word = root.querySelector<HTMLElement>(ABOVE_WORD);
    if (above.length === 0) return;

    const last = above.map(() => "none");
    let lastTilt = Number.NaN;

    const unsubscribe = onFrame(() => {
      if (signal.reduced) {
        if (last.some((value) => value !== "none") || !Number.isNaN(lastTilt)) {
          for (const el of [...above, ...below]) el.style.transform = "";
          if (word) word.style.removeProperty("--masthead-tilt");
          last.fill("none");
          lastTilt = Number.NaN;
        }
        return;
      }

      const amplitude = signal.coarse ? 4 : 7;
      const scrollLift = signal.scrollSpring.x * 3;
      const time = signal.time;

      for (let i = 0; i < above.length; i++) {
        const phase = i * 0.45;
        const lift =
          amplitude *
            (0.65 * Math.sin(time * 1.6 + phase) +
              0.35 * Math.sin(time * 2.7 - phase)) +
          scrollLift;
        const y = roundHalf(lift);
        const value = `translate3d(0, ${y}px, 0)`;

        if (value !== last[i]) {
          above[i].style.transform = value;
          if (below[i]) below[i].style.transform = value;
          last[i] = value;
        }
      }

      if (word && !signal.coarse && signal.pointer.x >= 0) {
        const normalized =
          (signal.pointer.x / Math.max(1, window.innerWidth)) * 2 - 1;
        const tilt = Math.round(normalized * 12) / 10;
        if (tilt !== lastTilt) {
          word.style.setProperty("--masthead-tilt", `${tilt}deg`);
          lastTilt = tilt;
        }
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div ref={rootRef} className="masthead">
      <SilentCopy copy="reflection" />
      <SilentCopy copy="below" />
      <div data-masthead="above" className="masthead__copy masthead__above">
        <h1
          id="hero-title"
          aria-label={content.name}
          data-masthead-word
          className="masthead__word"
        >
          <Letters copy="above" />
        </h1>
      </div>
    </div>
  );
}
