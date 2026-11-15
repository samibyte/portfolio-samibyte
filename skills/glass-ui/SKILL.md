---
name: glass-ui
description: Use when adding or changing any chrome element, control or content surface (nav, buttons, cards, chips, inputs, panels), or when touching lib/glass.ts or the "Glass UI" block in app/globals.css. Covers the single CSS-first glass system, zone-aware contrast, reduced motion, and the no-second-loop rule.
---

# Glass UI

The house style is **one CSS-first glass system**. It exists so the whole site
shares a material without adding a second animation runtime.

- Helper: `glass()` in `lib/glass.ts`.
- Rules: the "Glass UI (P9)" block in `app/globals.css`.
- Continuous liquid motion: `components/ui/FluidGlass.tsx` only, driven by
  `onFrame` from `lib/signal.ts`.

Why not a library: `@liquefy-ui/*` and `liquid-glass-js` start their own
`requestAnimationFrame` (and, for liquefy, a WebGL renderer per lens). That
breaks SPEC §3.1 and C5. `liquid-glass-react` avoids the loop but is still a
new dependency and its displacement is Chromium-only. See D-202.

## API

```tsx
import { glass } from "@/lib/glass";

<article className={glass({ variant: "card", tone: "regular", interactive: true })}>
```

`variant` is the shape. `tone` is the fill. `interactive` adds the hover/press
transition. `className` is appended last for layout and type only.

| Variant | Radius | Use |
|---|---|---|
| `panel` | 1rem | floating nav, a framed panel |
| `bar` | 0 | full-width sticky header |
| `card` | 1rem | project card, decision card |
| `control` | 999px | button, pill toggle |
| `chip` | 999px | stack item, skill tag |
| `field` | 0.5rem | input, textarea |

| Tone | Fill | Use |
|---|---|---|
| `clear` | 18% of the zone's `--bg-top` | quiet chips |
| `regular` | 34% of `--bg-top` | cards, fields, secondary controls |
| `strong` | 52% of `--bg-top` | a surface that must read as solid |
| `solid` | `--text`, text is `--bg-top` | primary action |
| `chrome` | fixed dark `--panel`, light text | nav bar, sticky case-study bar, effects toggle |

## Contrast

- Text always stays `var(--text)`. The zone palette already passes C4.
- Zone-aware tones mix the fill from the **zone's own** `--bg-top`. On a
  dark-text zone that is a light fill; on a light-text zone that is a dark
  fill. The fill therefore moves away from the text and cannot lower contrast.
- `chrome` assumes light text (`#e0e8f0`) on the fixed `--panel`. Use it only
  for chrome that floats over any zone. Never use `chrome` behind `--text`
  body copy in a dark-text zone.
- Never put body copy on `backdrop-filter: blur()`. The system uses no blur;
  keep it that way.
- Never hardcode a hex in a surface class. If a new zone needs a different
  fill, add a `[data-zone="…"]` token, not an inline colour.

## Motion

- `interactive` gives a 420 ms `cubic-bezier(0.22, 1, 0.36, 1)` lift on hover
  and a 0.985 press. It is a compositor transition, not a loop.
- `prefers-reduced-motion: reduce` removes the transform and the transition.
- Do not add a continuous `@keyframes` animation to a surface. Continuous
  liquid motion is `FluidGlass`'s job; a CSS idle loop would ignore the
  on-page reduced-motion toggle and add GPU work for no evidence.
- Do not read the pointer or write a CSS var per frame for a surface. The
  existing `BuoyChip` and `Skills` are the only pointer-driven chrome.

## Focus and targets

- Keep the element's existing `focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-[var(--text)]` (or `[#e0e8f0]` on chrome). The glass
  class does not set an outline.
- A control stays at least 24 × 24 CSS px. Glass adds a 1 px border; do not
  rely on it for the hit area.

## Do not

- Do not hand-roll `rounded-* border ... bg-*` for a panel, card, control,
  chip or field. If a shape is missing, add a variant to `lib/glass.ts` and
  its rule to `globals.css`.
- Do not put `position`, `display`, `padding` or `color` in `.glass`. Tailwind
  utilities own layout; unlayered `.glass` rules would override them.
- Do not use `transform` on `<main>`. Surface transforms are fine.
- Do not add a canvas, a WebGL context or a UI animation dependency.

## Checks

```bash
npm run gate
npx playwright test tests/c4.spec.ts   # text contrast against rendered pixels
npx playwright test tests/c5.spec.ts   # no extra ocean canvas, native scroll
npx playwright test tests/c6.spec.ts   # targets, focus rings, fallback
```

A glass change is done only when the gate prints `GATE: PASS` and the specs
above pass. A class-name assertion is not evidence.

## When a check fails

1. Contrast: move the fill toward the background's opposite luma (a darker
   tone on a light-text zone, a lighter tone on a dark-text zone). Do not
   change the text colour.
2. Focus or target size: fix the control, not the test.
3. A new canvas or a second loop: remove it. The system is CSS-only.
