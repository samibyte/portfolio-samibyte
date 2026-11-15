# SPEC — Sami Adnan · Ocean Portfolio

Canonical build spec. This file replaces `plan.md` and `AGENT_PLAN.md` (both deleted; see `DECISIONS.md` D-100).
Read `AGENTS.md` first. Read only the sections your task names.

Precedence: `AGENTS.md` > `SPEC.md` > `phases/P*.md` > a skill. If two disagree, the higher one wins and you log the conflict in `DECISIONS.md`.

---

## 1. Locked constraints

Never change this table. Each row carries the only evidence that may close it.

| ID | Rule | Verified by |
|----|------|-------------|
| **C1** | On `/` at scroll 0 the waterline sits at 30% of viewport height from the top (70% water, 30% air). Same in the CSS fallback. | **A** `tests/c1.spec.ts`: sample column x=1%, boundary row in 27–33% of `innerHeight` |
| **C2** | Scroll = descent. Palette darkens, red channel is lost first, viewport ends near-black. | **A** `tests/c2.spec.ts`: last viewport, text hidden → mean luminance < 0.05 and mean B > mean R |
| **C3** | Scroll velocity and pointer disturb the water via underdamped springs (overshoot, then settle). | **A** `tests/c3.spec.ts`: `stepSpring` overshoots and settles to <5% of peak inside 3 s at 1/60 s and 1/30 s steps |
| **C4** | Text passes WCAG **2.2 AA** (4.5:1 body, 3:1 large/UI) against the rendered background in every zone. | **A** `scripts/contrast.ts` (palette incl. effect lift) + `tests/c4.spec.ts` (rendered pixels) |
| **C5** | Text is real HTML over one background ocean canvas and at most one bounded, `aria-hidden`, pointer-transparent foreground atmosphere canvas. Neither canvas owns a `requestAnimationFrame` loop; the foreground canvas is a 2D context, not a second WebGL context. Native scroll only: no scroll library, no wheel/touch `preventDefault`, no `transform` on `<main>`. | **A** grep in `gate.sh` + `tests/c5.spec.ts` (one ocean canvas + ≤1 `data-foreground-canvas`) |
| **C6** | Projects, Resume and Contact are reachable without scrolling from `/` at 1280×720 and 390×844 (mobile ≤ 2 taps). Holds with effects on and off. | **A** `tests/c6.spec.ts` |
| **C7** | 60 fps on a mid-range laptop. Fallbacks for weak GPU, coarse pointer, no WebGL2. Reduced motion = static. | **A** `tests/c7.spec.ts` (tier + quality logic), fallback screenshots. **U** real-hardware fps |
| **C8** | No invented fact, number, date, stack item or URL. Every unconfirmed value is a `[USER]` slot rendered as absent (never as placeholder text). | **A** `npm run check:content -- --strict` at P7 |

**A** = an agent can prove it from command output. **U** = owner only (hardware, taste, real facts).
An agent may never claim a **U** item as passed. Only the owner closes **U** items, in `qa/REPORT.md`.

---

## 2. Stack (pinned)

Latest stable as of **2026-11-13**. Pin exactly, commit the lockfile, and never let an agent bump a version as part of another task.

| Package | Version | Role |
|---|---|---|
| `next` | 16.4.6 | App Router |
| `react` / `react-dom` | 19.3.1 | UI |
| `tailwindcss` + `@tailwindcss/turbopack` | 4.3.5 | layout/spacing/type only |
| `ogl` | 1.0.11 | the water shader |
| `zod` | 4.6.7 | contact schema, shared client + server |
| `resend` | 6.38.0 | contact email |
| `typescript` | 6.0.3 | typecheck (`tsc`; TS 7 breaks `typescript-eslint`, see §9) |
| `@types/node` | 22.20.5 | matches the Node 22 runtime |
| `@types/react` / `@types/react-dom` | 19.3.0 / 19.3.0 | scaffold types |
| `eslint` / `eslint-config-next` | 10.14.0 / 16.4.6 | lint (Next 16 removed `next lint`) |
| `@playwright/test` | 1.65.0 | A-checks |
| `pngjs` / `@types/pngjs` | 7.0.0 / 6.0.5 | pixel assertions in Playwright |
| `tsx` | 4.23.15 | runs `scripts/*.ts` |
| `@lhci/cli` | 0.16.1 | Lighthouse (P6+, advisory) |

Node **≥ 22.19** (Lighthouse 13 requires it). `package.json` `"engines": { "node": ">=22.19" }`.

Install split — runtime `dependencies` are exactly `next`, `react`, `react-dom`, `ogl`, `zod`, `resend`. Everything else in the table (`tailwindcss`, `@tailwindcss/turbopack`, `typescript`, every `@types/*`, `eslint`, `eslint-config-next`, `@playwright/test`, `pngjs`, `tsx`, `@lhci/cli`) is a `devDependency`. The scaffold installs older defaults (`react@19.3.0`, `tailwindcss@4.3.3`, `typescript@^5`, `eslint@^9`); P0.2 upgrades them to the pins above with `npm i -E` (runtime) and `npm i -D -E` (dev). No `^`, no `~`.

**Excluded on purpose, do not add:**
- `lenis`, `locomotive-scroll`, `embla`, any scroll hijack → violates C5.
- `gsap`, `framer-motion`, `motion`, `three` → the single loop in §4 animates everything. One animation system.
- `sharp`, `canvas`, `puppeteer` → not needed.
- `@liquefy-ui/*`, `liquid-glass-js`, `@react-three/fiber`, any UI library that owns a `requestAnimationFrame` loop or a WebGL context → the in-house CSS glass system (`lib/glass.ts`, §3.13) is the replacement. See D-202.
- `liquid-glass-react`, `glasscn-ui` → CSS/SVG glass, but still a new dependency; use `lib/glass.ts` instead.
- Any new dependency. If one is truly required: stop, write it in `PROGRESS.md` Blockers, and ask.

**Fallback pins** (only if a pinned version breaks the build, log a `DECISIONS.md` row):
- `next@16.4.x` patch only.
- `typescript@7.0.2` **only** once `eslint-config-next`'s `typescript-eslint` accepts TS 7. Today `eslint .` dies with `typescript-eslint does not support TS 7.0`.

---

## 3. Architecture rules

1. **One loop.** `lib/signal.ts` is a module singleton, started by `<OceanProvider>` in the root layout. It runs with or without WebGL. Never create a second `requestAnimationFrame`.
2. Per frame: `dt = min(dt, T.dtMax)` → read `scrollY` + pointer → advance springs → write uniforms (if a canvas exists) → write CSS vars **only when the value changed**.
3. **No React state per frame.** `setState` only on discrete events (zone change, toggle, form status).
4. **Native scroll.** Read `window.scrollY` inside the loop. No `preventDefault` on `wheel`/`touchstart`/`touchmove`. No `transform` on `<main>`.
5. **Zones belong to sections.** Every `<section>` carries `data-zone="<ZoneId>"`. Text colour is static CSS keyed on `[data-zone]`, never a per-frame global var. Sections are separated by `T.gapVh` vh gaps that contain no text; colour blending happens only inside gaps.
6. **Layout cache** (`lib/layout.ts`): on load and on `ResizeObserver` of `<main>`, cache each section's `pageTop`/`pageBottom`. `lib/zones.ts` exposes `bgAt(pageY)`, `metersAt(pageY)`, `fxAt(pageY)`. Inside a section, lerp `bgTop→bgBot` top-to-bottom. In a gap, `smoothstep` between neighbours. Zone order need not be monotonic (case studies rise again).
7. **Waterline** (`/` only), GL space (0 = bottom, water where `uv.y < waterline`): `uWaterline = 0.7 + scrollY / vh`. It moves 1:1 with content, so hero and BuoyChip stay attached to the surface. Fully submerged at `scrollY ≈ 0.3 × vh`. Every other route: `uWaterline = 2`.
8. **z-order:** ocean canvas `fixed z-0` (`aria-hidden`, `pointer-events:none`) → `<main>` `z-1` → foreground atmosphere canvas `fixed z-2` when mounted (`aria-hidden`, `pointer-events:none`, D-211) → chrome `z-10` (Nav, DiveLine, toggle).
9. **CSS vars** are written on the element that consumes them (`--bob` on the chip, `--glow` on each skill node). Never per-frame on `:root` or `body`.
10. **`--vh`** is declared `1vh` in CSS as a pre-hydration fallback, then overwritten by JS with `innerHeight * 0.01` **px** (1% of viewport height, so `calc(var(--vh) * 100)` is the full height) on load and on width/orientation change only. CSS and GL both use it. Never trust bare `100vh` on mobile.
11. **SSR safety:** no `window`/`document` at module top level. No `getComputedStyle` during render.
12. **`?fx=off`** disables the canvas for Lighthouse, C6 and fallback tests. In development only, `window.__ocean` exposes the signal for tests.
13. **Glass UI is CSS-first.** Chrome, controls, fields, chips and instrument plates use `glass()` from `lib/glass.ts` and the `.glass` rules in `app/globals.css`; prose and display type sit directly on the water (D-208). No canvas, no WebGL context and no animation loop per surface. The only glass renderer is the bounded `FluidGlass` mark, driven by `onFrame` from `lib/signal.ts`. A UI dependency that owns a render loop or a WebGL context is excluded (§2). See `skills/glass-ui/SKILL.md`.

---

## 4. File tree

```text
AGENTS.md  SPEC.md  PROGRESS.md  DECISIONS.md  CONTENT.md  SETUP_GUIDE.md
phases/P0..P9.md   skills/*/SKILL.md   scripts/*   tests/*
app/       layout.tsx page.tsx globals.css icon.svg
           projects/[slug]/page.tsx  api/contact/route.ts
           opengraph-image.tsx  sitemap.ts robots.ts
components/ocean/    OceanProvider OceanCanvas shader
components/sections/ Hero Projects About Skills Contact
components/ui/       Nav DiveLine EffectsToggle BuoyChip ProjectCard BackToSurface
components/casestudy/ CaseStudy Architecture
components/form/     ContactForm
lib/       types tuning zones layout signal content projects contact-schema glass
public/    (delete the template SVGs; no binary assets)
tests/     helpers/pixels.ts c1 c2 c3 c4 c5 c6 c7 shots
```

No `src/`. Import alias `@/*` → repo root.

### Types (`lib/types.ts`)

```ts
export type ZoneId = 'surface' | 'sunlight' | 'twilight' | 'midnight' | 'abyss';

export interface Zone {
  id: ZoneId; label: string;
  metersFrom: number; metersTo: number;
  bgTop: string; bgBot: string;   // sRGB hex
  text: string;                   // body text, AA-checked
  accent: string;                 // decorative only, never text or focus
  rays: number; caustics: number; snow: number; glow: number; // 0–1
}

export interface Project {
  slug: string; title: string; tag: string;      // 'SYS' | 'WEB' | 'API' | 'APP'
  tagline: string; stack: string[];
  source?: string; live?: string;
  problem: string; solution: string; challenge: string; outcome: string; takeaway: string;
  role?: string;
  architecture?: string[];   // ordered node labels; hidden when absent
  decision?: { title: string; tradeoff: string; changed: string }; // hidden when absent
}
```

Rule: every optional field renders **nothing** when absent. Never print "N/A", "Coming soon" or an empty card.

---

## 5. Zones

Values are final. `scripts/contrast.ts` is the arbiter; if you change a hex, run it.

| Zone | Meters | bgTop → bgBot | text | accent | rays | caustics | snow | glow |
|---|---|---|---|---|---|---|---|---|
| surface  | 0–30      | `#87CEEB` → `#00CED1` | `#0a1628` | `#87CEEB` | .5  | .3  | 0   | 0 |
| sunlight | 30–200    | `#00CED1` → `#339FA8` | `#0a1628` | `#00CED1` | .4  | .25 | .1  | 0 |
| twilight | 200–1000  | `#1a3a5c` → `#0d1f3c` | `#e0e8f0` | `#2a6496` | .15 | .08 | .4  | 0 |
| midnight | 1000–4000 | `#0a1628` → `#050d1a` | `#c0d0e0` | `#1a3a6e` | .02 | 0   | .7  | 0 |
| abyss    | 4000–6000 | `#050d1a` → `#020408` | `#b4c2d0` | `#ff9f43` | 0   | 0   | 1   | 1 |

Measured ratios (2026-11-13, `scripts/contrast.ts` logic):

| Zone | text on bgTop | text on bgBot | with +0.06 effect lift |
|---|---|---|---|
| surface  | 10.41 | 9.28 | n/a (dark text, effects add light) |
| sunlight | 9.28  | 5.75 | n/a |
| twilight | 9.41  | 13.28 | 5.65 |
| midnight | 11.52 | 12.36 | 5.66 |
| abyss    | 10.72 | 11.30 | 5.08 |

Consequences — do not re-derive these:
- Surface and sunlight **must** use dark text. White measures 1.74:1 and 1.95:1.
- `sunlight.bgBot` is `#339FA8`, not the natural `#1a6b7a` (2.96:1). D-017.
- `abyss.text` is `#b4c2d0`, not `#a0b0c0` (4.15:1 after the effect lift). D-102.
- Accent is decorative. `twilight.accent` measures 1.86:1 — a focus ring or link in accent would fail.
- Focus ring: `outline: 2px solid var(--text); outline-offset: 2px`. `--text` passes 3:1 in every zone.
- In light-text zones the shader may lift background luminance by at most **0.06**. `contrast.ts` checks this.

### Section → zone map

| Route | Section | Zone |
|---|---|---|
| `/` | Hero | surface |
| `/` | Projects | sunlight |
| `/` | About | twilight |
| `/` | Skills | midnight |
| `/` | Contact | abyss |
| `/projects/[slug]` | Problem | sunlight |
| | Solution | twilight |
| | Challenge (architecture + decision) | abyss |
| | Outcome | midnight |
| | Takeaway | twilight |

---

## 6. Shader

`components/ocean/shader.ts` exports `VERT` and `FRAG`. `SPEC` §6 is the full starting point; layers are added in P2–P3.

**Verified against `ogl@1.0.11`:** `Triangle` supplies `position` as **`vec2`** (`size: 2`, data `[-1,-1, 3,-1, -1,3]`) and `uv` as `vec2` in `0..2`. Use `attribute vec2 position`. Declaring `vec3 position` against that buffer is a bug and renders nothing.

```glsl
// VERT
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
```

```glsl
// FRAG — GLSL ES 1.00. No #version line: WebGL2 accepts 1.00 and OGL does not rewrite it.
precision highp float;

uniform float uTime, uWaterline, uTurb, uPlunge, uMouseVel, uAspect, uOct, uRipple;
uniform vec2  uMouse;        // 0..1, y up, init (-1., -1.)
uniform vec3  uSky;          // surface.bgTop
uniform vec3  uBg[5];        // bgAt() at the 5 viewport rows, top → bottom; uBg[0] = top
uniform vec4  uFx;           // rays, caustics, snow, glow at viewport centre
uniform int   uDebug;        // 0 = off

varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y);
}

float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {           // constant bound
    if (float(i) >= uOct) break;
    s += a * noise(p); p *= 2.03; a *= 0.5;
  }
  return s;
}

// Constant indices only — dynamic indexing of a uniform array is not portable in ES 1.00.
vec3 bgAt(float y) {
  float s = clamp((1.0 - y) * 4.0, 0.0, 4.0);
  vec3 c = mix(uBg[0], uBg[1], clamp(s,       0.0, 1.0));
  c = mix(c, uBg[2], clamp(s - 1.0, 0.0, 1.0));
  c = mix(c, uBg[3], clamp(s - 2.0, 0.0, 1.0));
  c = mix(c, uBg[4], clamp(s - 3.0, 0.0, 1.0));
  return c;
}

void main() {
  float t = uTime;
  vec2  m = vUv - uMouse, ma = m * vec2(uAspect, 1.0);
  vec2  uv = vUv + m * exp(-dot(ma, ma) * 30.0) * uRipple * (1.0 + uMouseVel);
  uv += sin(uv.yx * 10.0 + t * 2.0) * uTurb * 0.01;

  float wl = uWaterline + 0.012 * sin(uv.x * 6.0 + t * 1.5)
                        + 0.005 * sin(uv.x * 17.0 - t * 2.3);
  float under = 1.0 - smoothstep(wl - 0.003, wl + 0.003, uv.y);

  vec3 water = bgAt(vUv.y);
  water += (fbm(uv * vec2(2.5, 1.5) + vec2(t * 0.05, 0.0)) - 0.5) * 0.08 * (1.0 + uTurb);
  // layers 2–6 (SPEC §6.1) modify `water` here, multiplied by `under` and by uFx

  if (uDebug == 1) { gl_FragColor = vec4(vec3(under), 1.0); return; }
  gl_FragColor = vec4(mix(uSky, water, under), 1.0);
}
```

### 6.1 Layers

Add one per task. Total noise taps ≤ 12 per pixel at full quality (`uOct = 4`). Each optional layer is gated by its `uFx` component (0 disables it) or by `uPlunge`; flow and foam are always on. Verify each optional layer at 0 and at full strength.

1. **Flow** — `uOct`-octave `fbm` (4 at full quality) on `uv * vec2(2.5, 1.5)`, drift +x at `t * 0.05`, amplitude boosted by `uTurb`. ±0.04 on `water` at rest, ±0.08 at full turbulence.
2. **Caustics** — two passes of `abs(sin)` lattice on warped `uv`, strength `uFx.y × vUv.y` (strongest just below the surface, fading with depth). Multiply only, never add over the sky.
3. **God rays** — soft bands along `uv.x + (uWaterline - uv.y) * 0.3`, slow sway, strength `uFx.x`.
4. **Marine snow** — hash-grid particles, 2 parallax layers drifting up, count from `uFx.z × T.snowMax`, active only when `uFx.z > 0.01`.
5. **Abyss glow** — soft pulsing points, count `uFx.w × T.glowMax`, cool `#35e0c2`.
6. **Plunge bubbles** — count `T.bubbleMax`, analytic from `hash(i)`, driven by `uPlunge` (−1 = off). No extra canvas, no DOM.
7. **Foam** — thin bright line at `wl`, only when `uWaterline` is on screen.

The waterline must always be drawn by the shader (`under`), never by a DOM overlay.

---

## 7. Tuning (`lib/tuning.ts`)

The only file besides `lib/zones.ts` where numbers live.

```ts
export const T = {
  springK: 0.08, springD: 0.85,  // underdamped, ζ ≈ 0.3 (D-106)
  velocityNorm: 2500,            // px/s → [-1, 1], clamped
  dtMax: 1 / 20,                 // clamp after a background tab
  dprMax: 2, dprMid: 1.5, dprLow: 1,
  fpsLow: 30, fpsMid: 45, warmupS: 2,
  snowMax: 20, glowMax: 8, bubbleMax: 24, octaves: 4,
  plungeDuration: 3,             // s
  gapVh: 25,                     // empty band between sections
  bobPx: 8,
  ripple: 0.02,
} as const;
```

Cut order under load: **DPR → `uOct` → god rays → caustics → marine snow → abyss glow → flow**. Never cut the waterline, foam, or the palette.

---

## 8. Content

Every string the site renders lives in `lib/content.ts` or `lib/projects.ts`, transcribed from `CONTENT.md`. `CONTENT.md` is the verified source (fetched 2026-11-13 from `https://samibyte.vercel.app/`). Copy it verbatim — do not rewrite, embellish or "improve" it.

- Unconfirmed value → `[USER: what is needed]` in `CONTENT.md`, and the field is **omitted** from the data file.
- `npm run check:content` warns on `[USER]` until P7, then must pass with `--strict`.
- If you cannot fetch or read a value, do not guess. Write the `[USER]` slot.

---

## 9. Gotchas (each one has cost a real build)

- OGL `Triangle.position` is `vec2`, not `vec3`. OGL `Plane` spans ±0.5 — never use it full-screen.
- GL y is up. The waterline is in GL space; screen-space y is inverted.
- `uniform vec3 uBg[5]` must be indexed with **constants**. Use the `bgAt` mix chain.
- Constant loop bounds in GLSL ES 1.00. Escape with `if (cond) break;`.
- OGL ignores unknown uniforms silently. A layer that does nothing is almost always a name mismatch across three places: GLSL declaration, `Program` `uniforms` object, per-frame assignment. Enable `Program`'s `uDebug` path first.
- **Array uniforms need a plain nested `Array`, not a `Float32Array`.** WebGL reports the active name as `uBg[0]`; OGL splits the `[0]` off and only keeps the uniform when `Array.isArray(uniform.value)` is true. A `Float32Array(15)` fails that test → `warn("Active uniform uBg[0] has not been supplied")` and **nothing is uploaded**. Declare `uniforms.uBg = { value: [[r,g,b], …×5] }`. `flatten()` also requires `value[0].length`, which nested triples satisfy. OGL copies into a shared scratch buffer and uploads on every `render()`, so mutate the same nested array in place each frame and never keep a reference to the flattened result.
- Next 16: there is no `next lint`. Run `eslint .`. `next build` no longer lints.
- Next 16: `params`/`searchParams` are `Promise`s — `const { slug } = await params`.
- Typecheck needs generated route types: run `next typegen` before `tsc --noEmit`.
- **Do not pin `typescript@7`.** `eslint-config-next@16.4.6` pulls `typescript-eslint@8`, whose peer range is `<6.1.0` and which throws at import time: `typescript-eslint does not support TS 7.0`. `tsc` 7 runs, but `eslint .` cannot. Pin `typescript@6.0.3`; revisit when typescript-eslint ships TS 7 support.
- Tailwind v4: `@import "tailwindcss";` is the first line of `globals.css`. There is no `tailwind.config.js`. Do not map zone colours into `@theme` — they are runtime CSS vars.
- `create-next-app@16.4.6` defaults to **Turbopack** and installs `@tailwindcss/turbopack` plus a `turbopack.rules` entry for `*.css` in `next.config.ts`; it writes **no** `postcss.config.mjs`. Do not add `@tailwindcss/postcss` — it is not used by this scaffold.
- Zod v4: `z.email()` (not `z.string().email()`), errors via `error.issues`, first path segment via `issue.path[0]`.
- Resend: `new Resend(key)` then `resend.emails.send({ from, to, subject, text })`. `onboarding@resend.dev` only delivers to the account owner's address — use it for dev, a verified domain in production.
- Clamp `dt`. The first frame after a background tab is huge.
- Never `setState` per frame. Never `getComputedStyle` in render. Never per-frame vars on `:root`.
- No `visibilitychange` handler: `requestAnimationFrame` already pauses.
- React 19 StrictMode mounts effects twice in dev. Every WebGL resource needs a real cleanup path (`WEBGL_lose_context`).
