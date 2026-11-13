# DECISIONS

One line per decision. Never delete a row — supersede it with a new row and set the old row's status to `Superseded by D-xxx`.
Format: `| ID | Date | Decision | Reason | Status |`. Add at the bottom with the next ID.

## Original plan (pre-review)

| ID | Date | Decision | Reason | Status |
|----|------|----------|--------|--------|
| D-001 | 2026-11-13 | Use OGL, not three.js | ~15 KB vs ~600 KB; one shader needs no more | Active |
| D-002 | 2026-11-13 | No Lenis | Replaces native wheel scrolling; violates C5 | Active |
| D-003 | 2026-11-13 | No framer-motion | Overlaps GSAP; one animation system | Superseded by D-107 |
| D-004 | 2026-11-13 | Waterline in GL UV space (0 = bottom); rest = 0.7, water below | A top-down mask rendered water on top | Active |
| D-005 | 2026-11-13 | Full-screen quad uses OGL `Triangle` | `Plane` spans ±0.5 and covers half the screen | Active |
| D-006 | 2026-11-13 | One rAF loop owned by `OceanCanvas` | Avoids competing loops and per-frame React state | Superseded by D-109 |
| D-007 | 2026-11-13 | CSS vars written only when the value changed | Avoids per-frame style recalc | Active |
| D-008 | 2026-11-13 | Surface and sunlight use dark text `#0a1628` | White measures 1.74:1 and 1.95:1 there | Active |
| D-009 | 2026-11-13 | One contact route at `app/api/contact/route.ts` | The original had two conflicting routes | Active |
| D-010 | 2026-11-13 | No camera tilt, no flowmap texture, no transform on `<main>` | Rotating text blurs it; breaks C4 and C5 | Active |
| D-011 | 2026-11-13 | Plunge bubbles are analytic in the shader | No second canvas needed | Active |
| D-012 | 2026-11-13 | Mobile is not reduced motion | Conflating them removes effects users did not ask to lose | Active |
| D-013 | 2026-11-13 | No `visibilitychange` handler | rAF already pauses in background tabs | Active |
| D-014 | 2026-11-13 | Contact rate limit is in-memory and best-effort | Serverless instances do not share memory; documented, not pretended | Active |
| D-015 | 2026-11-13 | Tailwind theme tokens are CSS variables in `globals.css` | Works across Tailwind majors | Active |
| D-016 | 2026-11-13 | Focus rings are two-tone (dark + light), not accent-only | Accent fails 3:1 in some zones | Superseded by D-127 |
| D-017 | 2026-11-13 | `sunlight.bgBot` is `#2a8f98` (was `#1a6b7a`) | 2.96:1 → 4.73:1 for dark text | Superseded by D-103 |
| D-018 | 2026-11-13 | Accent contrast is advisory (`WARN`), not a gate failure | Accent is decorative; only body text is gated | Active |

## Architecture review, 2026-11-13

Verified against `next@16.4.6`, `ogl@1.0.11`, `zod@4.6.7`, `typescript@7.0.2`, `tailwindcss@4.3.5`, WCAG 2.2, and the live site.

| ID | Date | Decision | Reason | Status |
|----|------|----------|--------|--------|
| D-100 | 2026-11-13 | Merge `plan.md` + `AGENT_PLAN.md` into `SPEC.md` + `phases/P0–P7.md`; delete both originals | They contradicted each other on stack, waterline formula, content and verifiability. Two sources of truth is the single biggest failure mode for a multi-model build. | Active |
| D-101 | 2026-11-13 | Content is transcribed from the live site (`CONTENT.md`), 4 projects not 3 | `AGENT_PLAN.md` invented Yjs/Redis/tRPC/microservice narratives and a 512² headshot. C8 forbids that. The live site has four projects and no headshot. | Active |
| D-102 | 2026-11-13 | `abyss.text` `#a0b0c0` → `#b4c2d0` | With the permitted +0.06 effect lift, `#a0b0c0` measures 4.15:1 and fails C4. `#b4c2d0` measures 5.08:1. | Active |
| D-103 | 2026-11-13 | `sunlight.bgBot` `#2a8f98` → `#339FA8` | 4.73:1 leaves no margin for shader rounding. `#339FA8` measures 5.75:1 on the same hue. | Active |
| D-104 | 2026-11-13 | Vertex shader uses `attribute vec2 position` | `ogl@1.0.11` `Triangle` supplies `position` with `size: 2`. `AGENT_PLAN.md`'s `vec3` renders nothing. | Active |
| D-105 | 2026-11-13 | `uBg[5]` is sampled with a `mix` chain, never `uBg[i]` | Dynamic indexing of a uniform array is not portable in GLSL ES 1.00, and WebGL1 is a required fallback path. | Active |
| D-106 | 2026-11-13 | `stepSpring(x,v,target,dt)` is a pure export in `lib/signal.ts` | C3 must be provable by a unit test; a method bound to the loop cannot be. | Active |
| D-107 | 2026-11-13 | No GSAP, no ScrollTrigger; the single loop blends zones | `SPEC.md` §5 already derives colour from `bgAt(pageY)`. A second animation system duplicates scroll state and doubles the bundle. | Active |
| D-108 | 2026-11-13 | Text colour comes from `[data-zone]` CSS, never a per-frame global var | A per-frame var on `:root` invalidates style for the whole document every frame — a guaranteed C7 failure. | Active |
| D-109 | 2026-11-13 | The rAF loop is owned by `lib/signal.ts`, started by `<OceanProvider>` | It must run on routes and tiers with no canvas. A canvas-owned loop stops when the canvas unmounts. | Active |
| D-110 | 2026-11-13 | Lint runs `eslint .` directly; `"lint": "eslint ."` | Next 16 removed `next lint` and `next build` no longer lints. A stale script fails silently in CI. | Active |
| D-111 | 2026-11-13 | Typecheck is `next typegen && tsc --noEmit` | Route types only exist after generation; plain `tsc` on a fresh clone fails on `.next/types`. | Active |
| D-112 | 2026-11-13 | Scaffold at the repo root with `--no-agents-md --no-cache-components --disable-git` | The current Next template writes its own `AGENTS.md` and would overwrite the kit. A project-name argument creates a nested dir that breaks every path. | Active |
| D-113 | 2026-11-13 | Pin exact versions; commit `package-lock.json` | Floating ranges give different agents different installs of a stack that has three breaking majors in it. | Active |
| D-114 | 2026-11-13 | Every constraint is tagged **A** (agent-provable) or **U** (owner only) | Free models mark human-judgement checks as passed. Splitting the tags makes a false claim detectable. | Active |
| D-115 | 2026-11-13 | Add `pngjs` (+types) as a dev dependency for pixel assertions | C1, C2 and C4 need numbers, not opinions. A text model cannot look at a screenshot. | Active |
| D-116 | 2026-11-13 | No thumbnail or headshot placeholders; cards are typographic; OG via `next/og` | The live site uses no images. Placeholder JPEGs were wasted tasks and shipped fake assets. | Active |
| D-117 | 2026-11-13 | Resume links the verified Google Drive URL; no placeholder PDF | `/resume.pdf` did not exist on the live site. Shipping a fake PDF is a C8 violation. | Active |
| D-118 | 2026-11-13 | One token, `[USER: …]`, replaces `[VERIFY]`; the field is omitted, never rendered | Two tokens and two behaviours produced placeholder text in production. | Active |
| D-119 | 2026-11-13 | Add C8: honest content | The spec's own rule against invention was not a constraint, so nothing enforced it. | Active |
| D-120 | 2026-11-13 | C6 = nav links visible and reachable without scrolling (≤ 2 taps on mobile) | "Recruiter finishes in < 30 s" cannot be measured by a bot and so was never actually verified. | Active |
| D-121 | 2026-11-13 | C2 also asserts mean blue > mean red at the end of the page | "Red is lost first, blue last" was prose. This makes it a pixel assertion. | Active |
| D-122 | 2026-11-13 | No `sr-only` duplicate of the skills list | The visible list is already text; duplicating it doubles screen-reader output. | Active |
| D-123 | 2026-11-13 | The palette is authoritative; no Beer-Lambert formula in the shader | Two colour systems competed in the old spec. Palette colour is the only thing contrast can be checked against. | Active |
| D-124 | 2026-11-13 | Docs are phase-split; a session reads ~2 KB, not ~11 KB | `AGENT_PLAN.md` alone was ~22 KB. Free models have small contexts; a 5× cut is a direct quality win. | Active |
| D-125 | 2026-11-13 | Gate is fail-fast, logs to `qa/gate.log`, and skips contrast until `lib/zones.ts` exists | The old gate was red from P0.1 because it imported a file that did not exist yet, and every agent stalled on it. | Active |
| D-126 | 2026-11-13 | Lighthouse is advisory (P6+), never part of `npm run gate` | It needs a Chrome binary that many agent sandboxes do not have. Playwright is the gate. | Active |
| D-127 | 2026-11-13 | Focus ring is `2px solid var(--text)` with a 2 px offset | `--text` clears 3:1 in all five zones; the two-tone ring added complexity with no measurable gain. | Active |
| D-128 | 2026-11-13 | Node `>= 22.19` in `engines` | Lighthouse 13 requires it, and Node 18 is out of support for Next 16. | Active |
| D-129 | 2026-11-13 | Real email, real URLs, 4 verified projects replace every invented detail | `AGENT_PLAN.md` §7 asserted an email, project stacks and metrics that were never the owner's. | Active |
| D-130 | 2026-11-13 | `PNPM`/nested-dir scaffolding replaced by a single root command with explicit flags | One copy-pasteable command removes the most common first-session failure. | Active |
| D-131 | 2026-11-13 | `uBg` is a plain nested `Array` of 5 `[r,g,b]`, never `Float32Array(15)` | Verified in `ogl@1.0.11` `Program.js`: active name `uBg[0]` → `nameComponents=['0']` → the uniform survives only if `Array.isArray(uniform.value)`. A typed array fails, so OGL warns "not supplied" and never uploads. | Active |
| D-132 | 2026-11-13 | Caustics strength is `uFx.y × vUv.y`, not `× (1.0 - vUv.y)` | `vUv.y` is 1 at the top of the screen; the old formula put the strongest caustics on the deepest visible row. Physically and visually wrong. | Active |
| D-133 | 2026-11-13 | C5 gets a `c5-grep` step in `gate.sh`; behaviour is tested in `tests/c5.spec.ts` | SPEC §1 claims a gate grep that did not exist. Grep only banned imports — a bare `preventDefault` grep false-positives on every form submit. | Active |
| D-134 | 2026-11-13 | `scripts/contrast.ts` and `scripts/check-content.ts` ship with the kit; their tasks verify, not rewrite | A free model rewriting a verified 70-line script burns tokens and drifts. Verify the documented output, fix only a real mismatch. | Active |
| D-135 | 2026-11-13 | `lib/zones.ts` exposes `setSectionOffsets()`; `lib/layout.ts` pushes measurements in | P1.3 runs before `lib/layout.ts` exists. Inverting the dependency keeps P1.3 self-contained and keeps `zones.ts` free of DOM access (a Node script imports it). | Active |
| D-136 | 2026-11-13 | Tailwind plugin is `@tailwindcss/turbopack@4.3.5`, not `@tailwindcss/postcss`; `@types/pngjs` is `6.0.5` | `create-next-app@16.4.6` (verified from its published `dist/index.js`) defaults to Turbopack, installs `@tailwindcss/turbopack`, writes a `turbopack.rules` entry and no `postcss.config.mjs`. `@types/pngjs` has no 7.x release; 6.0.5 is the current latest. | Active |
| D-137 | 2026-11-13 | Pin `@types/node@22.20.5`, `@types/react@19.3.0`, `@types/react-dom@19.3.0` | The scaffold writes `^20` / `^19`; leaving them floating breaks the "pin exact versions" rule and `@types/node` 26 would type APIs Node 22 does not have. | Active |
| D-138 | 2026-11-13 | Scaffold in `/tmp/scaffold` and `tar`-copy in, instead of `create-next-app .` | `isFolderEmpty` only allows a tiny set of names; the kit's `AGENTS.md`/`SPEC.md`/`phases/` make the repo non-empty, so the in-place command always aborts. | Active |
| D-139 | 2026-11-13 | Pin `typescript@6.0.3`, not 7.0.2 | Reproduced: with TS 7.0.2 installed, `eslint .` exits 2 with `typescript-eslint does not support TS 7.0`. `eslint-config-next@16.4.6` pins `typescript-eslint@8` whose peer range is `<6.1.0`. TS 6.0.3 passes `tsc --version` and loads ESLint. | Active |
| D-140 | 2026-11-13 | Add `--no-react-compiler` to the scaffold command | `--yes` still reads saved `create-next-app` preferences; on a machine whose prefs have `reactCompiler:true` it silently installs `babel-plugin-react-compiler` and writes `reactCompiler:true` into `next.config.ts`. Every flag that changes the tree must be explicit. | Active |
| D-141 | 2026-11-13 | `--vh` = `innerHeight * 0.01` px; Hero is `calc(var(--vh) * 100)` tall with a hard `30%` gradient stop | C1 measures a boundary at 30% of the viewport. An undefined `--vh` makes `calc(var(--vh) * 25)` either 25 px or 18000 px, so the gap and the fallback split were both ambiguous. | Active |
| D-142 | 2026-11-13 | Home-page composition is task P1.18; each section renders its own `<section data-zone="…">` | No task created `app/page.tsx`, and no P1 section task said to emit `data-zone`. `lib/layout.ts` and C4 both walk `[data-zone]`, so the page would have rendered five untagged sections. | Active |
| D-143 | 2026-11-13 | A coarse pointer keeps the canvas (Tier 2); only `?fx=off`, reduced motion, or no WebGL2 bail out | P2.4 said "bail out when coarse", contradicting P6.1 (Tier 2 = DPR 1, fewer layers) and D-012 (mobile is not reduced motion). | Active |
| D-144 | 2026-11-13 | C3/P4.1 compare the **peak** and **settled** value, not the pointwise transient | Measured: 1/60 s vs 1/30 s Euler diverges by ~23% of peak at the overshoot, so a pointwise 10% test fails on correct code. Peak (1.3755 vs 1.3707) and final (1.0000) agree < 1%. | Active |
| D-145 | 2026-11-13 | No `axe-core`; P6.5 a11y checks are plain Playwright assertions | Adding axe is a new dependency, which the kit forbids. Target size (≥ 24×24) and duplicated-text are directly assertable with `boundingBox()` and the DOM. | Active |
| D-146 | 2026-11-13 | No-WebGL fallback is tested with `addInitScript` nulling `getContext`, not a third Playwright project | P6.4's Files did not include `playwright.config.ts`, and `?fx=off` already exercises the CSS path. A third project would have been an unscoped config edit. | Active |
| D-147 | 2026-11-13 | Favicon is `app/icon.svg` (added in P7.2); template SVGs deleted in P0.1 | `SPEC.md` §4 listed `public/favicon.svg`, which no task created. `create-next-app` writes `app/favicon.ico` and five template SVGs; Next serves `app/icon.svg`. | Active |
| D-148 | 2026-11-13 | Spring comment is `ζ ≈ 0.3`, not 0.27 | From the discrete map `[[1−DK, D],[−DK, D]]` at 60 fps: `|λ| = √0.85`, `θ ≈ 0.26` → `ζ ≈ 0.298`. The 0.27 value implied a peak of 1.41; the measured peak is 1.3755. | Active |
| D-149 | 2026-11-13 | Exclude scripts in tsconfig.json and skip content gate check when lib/ does not exist | scripts/contrast.ts imports lib/zones.ts (P1.3); Next.js typecheck fails during build if scripts/ is included in tsconfig. gate.sh content step skips cleanly until lib/ is created, per P0.3 spec | Active |
| D-150 | 2026-11-13 | Keep `eslint@10.14.0` even though `npm ls` flags peer ranges inside `eslint-config-next` | SPEC §2 pins it. The flagged peers are `eslint-plugin-import`/`jsx-a11y`/`react` ranges inside the Next config (they stop at `^9`), but `eslint .` passes and the gate is green. Do not "fix" this by downgrading ESLint. | Active |
