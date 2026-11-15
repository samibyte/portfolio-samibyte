---
name: ocean-a11y-contrast
description: Use when choosing or changing text, accent, focus or UI colours; building buttons, links or form controls; adding animation; or running accessibility checks. Covers WCAG 2.2 AA contrast across every zone, focus visibility, target size, and reduced motion.
---

# Ocean Accessibility and Contrast

Target: **WCAG 2.2 level AA**. (2.2 replaced 2.1 in 2023; audits and the European Accessibility Act now reference 2.2.)

## Thresholds

| Element | Minimum |
|---|---|
| Body text | 4.5 : 1 |
| Large text (≥ 24 px, or ≥ 18.66 px bold) | 3 : 1 |
| Focus indicator, icons, control boundaries | 3 : 1 |
| Pointer target (SC 2.5.8) | 24 × 24 CSS px |

Test every text colour against **both** `bgTop` and `bgBot`. A pass on one stop does not count. The in-between value is not tested separately because sRGB interpolation is monotonic per channel, so the stops bound the middle.

## Colour rules

- **The script is the arbiter.** `npx tsx scripts/contrast.ts` prints every ratio. Never copy ratios from a doc, a phase file or a previous report — they change with the palette (P8.1 retunes four of five zones). Paste the current output when you claim a pass.
- **Surface and sunlight use dark text** (`#0a1628`). White measures below 2:1 there. The P8 rule is stronger and easier to check: every dark-text zone needs
  `min(relLuma(bgTop), relLuma(bgBot)) ≥ 0.21`, because the hero text straddles the waterline.
- **Abyss is frozen** (`#050d1a → #020408`, text `#b4c2d0`, accent `#ff9f43`). Do not retune it; the OG image depends on it.
- **Accent is decorative only.** Never use accent for text, a link, a border that carries meaning, or a focus ring. It is not contrast-checked.
- **Focus ring:** `outline: 2px solid var(--text); outline-offset: 2px`. `--text` clears 3:1 in every zone.
- **Focus must not be hidden** behind the sticky bar or an overlay (SC 2.4.11). If a sticky element can cover a focused target, add `scroll-margin-top`.
- **Body copy over a busy area** goes on a panel: `background: rgb(5 13 26 / 0.85)`. Never `backdrop-filter: blur()` behind text — it blurs the text.
- **Additive light is capped.** In light-text zones the shader may lift background luminance by at most **0.06**; where the local background luma is < 0.2, total additive lift ≤ 0.06. New layers are not exempt.

## Interaction and motion

- **Reduced motion** is a real state, not a faster animation: time frozen, springs at 0, no bob, no ping, no torch, no fauna drift. Respect `prefers-reduced-motion` **and** the on-page toggle.
- **Mobile is not reduced motion.** Do not conflate them (D-012).
- **Labels and errors.** Real `<label htmlFor>`, errors linked by `aria-describedby`, `aria-invalid`, and a `role="status"` for the submit result.
- **Images** get `alt`; purely decorative ones get `alt=""`.
- **Canvas** is `aria-hidden="true"` and `pointer-events: none`.
- **No duplicated screen-reader copy.** If the visible element is already text, do not add an `sr-only` twin.

## Checks

```bash
npx tsx scripts/contrast.ts          # palette + focus + effect lift
npx playwright test tests/c4.spec.ts # rendered pixels, per zone, per scroll step
npm run gate                         # includes contrast
```

A contrast claim needs a number from one of those. "Looks readable" is not evidence.

## When a check fails

1. Adjust the **text** colour's lightness first, keeping its hue.
2. If it still fails, put the copy on a panel.
3. Only if neither works: log a `DECISIONS.md` row and raise it in `PROGRESS.md` Blockers. Never lower a threshold, and never add `!important` to hide the problem.
