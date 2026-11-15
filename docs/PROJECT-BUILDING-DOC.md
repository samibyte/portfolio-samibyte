**Owner:** Sami Adnan

**Status:** Complete — interview submission

**Project Type:** Interactive Creative Developer Portfolio

**Built:** 13–15 November 2026 · Next.js 16 · TypeScript · WebGL (OGL) · 78 commits

**Repository:** [github.com/samibyte/portfolio-samibyte](https://github.com/samibyte/portfolio-samibyte)

---

## Submission Summary

This repository is my submission for the interview task: build a personal portfolio that is distinctive, interactive and technically sound, and show how it was built.

There are two deliverables, and they are meant to be judged together:

- **The product** — a working portfolio with an animated, scroll-driven ocean, five depth zones, real HTML content, a case-study route, a contact form with server-side validation, and an accessibility and performance story that is enforced by tests.
- **The process** — a repository-owned operating system for AI agents (`AGENTS.md`, `PROGRESS.md`, `SPEC.md`, `phases/`, `skills/`, `scripts/`) that let me run eight different model labels on one codebase across 78 commits without losing context, and verify their output rather than trusting it.

**Where to look first**

| What | Where |
| --- | --- |
| The experience | `npm run dev` → `http://localhost:3000` |
| The engineering contract | `SPEC.md` §1 (C1–C8), §3 (architecture rules), §6 (shader) |
| The agent system | `AGENTS.md`, `PROGRESS.md`, `phases/P0–P10.md`, `skills/` |
| The evidence | §11 of this document, `tests/`, `qa/sessions.md` |
| What is not finished | §15 of this document |

Run the verification yourself:

```bash
npm ci
npm run gate            # typegen → typecheck → lint → build → c5-grep → contrast → content
npx playwright test     # 132 checks across c1–c7, look, shots
```

---

## 1. Project Overview

The goal was to build a personal portfolio that represents my personality and creativity through an immersive, interactive web experience.

Rather than following a conventional portfolio layout, I built an ocean-themed environment where the website itself becomes an experience.

The ocean serves as both the visual identity and the navigation concept. Visitors gradually explore deeper layers of the ocean as they scroll, discovering different sections of the portfolio along the way.

The project is also an experiment in AI-assisted software development, particularly in building a workflow where multiple AI coding agents can collaborate on the same codebase without losing project context.

Both goals were met. The applied result is a Next.js application with one fixed WebGL canvas behind real HTML, five depth zones derived from scroll position, and a verification pipeline that fails the build on a constraint violation. The process result is an agent kit that turned a chat-dependent workflow into a file-dependent one.

## 2. Creative Direction

### The Concept: Representing myself through an ocean

At first, I considered many different themes, from rain and the cosmos to forests and mountains. But the ocean felt like the most fitting way to represent me — an environment that could reflect my personality and creativity.

The website begins with approximately 70% of the viewport occupied by water, with the remaining portion showing the world above the surface. As visitors scroll, they progressively descend into the ocean. The environment becomes darker and deeper, while relevant content and portfolio sections emerge throughout the journey.

The waterline is not decorative: it is a locked, measured constraint (C1). On `/` at scroll 0, the boundary sits at 30% of viewport height, in both the WebGL scene and the CSS fallback, and a pixel test asserts it.

### The Experience as Built

| Stop | Zone | Depth band | Content |
| --- | --- | --- | --- |
| Above the surface | Surface | 0–30 m | Hero: name, role, one-line statement, Projects and Resume |
| Shallow water | Sunlight | 30–200 m | Projects — five cards, each with an architecture preview |
| Deeper water | Twilight | 200–1,000 m | About — bio, principles, journey |
| Dark water | Midnight | 1,000–4,000 m | Skills — five groups, 29 items, lit by a pointer torch |
| Sea floor | Abyss | 4,000–6,000 m | Contact, then a closing plate in the deep |

Each zone owns its palette, text colour, and effect weights (`rays`, `caustics`, `snow`, `glow`). The palette loses red first as depth increases, which is why the last viewport measures near-black with more blue than red (C2). Sections are separated by 25 vh text-free gaps; colour blending happens only inside those gaps, so contrast can be proven rather than estimated.

### Interaction Design

The experience is highly interactive rather than a collection of static animations:

- **Fully animated water** — four sine wave trains, dual-layer counter-flow, refraction, analytic caustics, seven sun shafts, surface foam and specular crests, all in one fragment shader.
- **Scroll as descent** — scroll velocity feeds an underdamped spring, so fast scrolling disturbs the water and it overshoots then settles.
- **Pointer response** — pointer velocity feeds a second spring; the water reacts and a torch follows the pointer over the skills field.
- **Environmental transitions** — palette, effect weights, particles and fauna are interpolated per frame from the scroll position, not switched by class names.
- **Depth-aware ambient life** — four parallax particle layers (far, mid, near bokeh, lens droplets) and seven fauna silhouettes, all gated by depth so the abyss stays empty.
- **Content that emerges** — buoy chip, dive line readout, case-study dive/ascent, project card motion, glass chrome.

Scrolling is never hijacked. It is native browser scroll; the animation reads from it. That is enforced by a grep in the gate and a real wheel-event test (C5).

---

## 3. Engineering Approach

The central technical challenge was implementing a visually complex experience while keeping it maintainable, performant and accessible. The implementation had to demonstrate more than visual creativity; it had to reflect sound frontend engineering practice.

Each consideration below is paired with the mechanism that addresses it, so the claim is inspectable:

| Consideration | How it is addressed |
| --- | --- |
| Animation performance | One `requestAnimationFrame` loop in `lib/signal.ts`; shaders instead of DOM animation; noise tap budget ≤ 12 per pixel; adaptive quality tiers |
| Smooth rendering | Frame delta clamped to 1/20 s after a background tab; springs are frame-rate independent (verified at 60 fps and 30 fps) |
| Responsive behaviour | Layout cache recomputed on `ResizeObserver`; DPR capped by tier; measured at 1280×720 and 390×844 |
| Component architecture | Server components for content; one client boundary per interactive surface; `glass()` as the only surface vocabulary |
| Resource management | Ocean renderer dynamically imported with a context-loss handler that removes the canvas; the closing mark is the only other GL surface and falls back to a static wordmark without WebGL2 or under `?fx=off` |
| Scroll and pointer | Passive listeners only; velocity springs; no `preventDefault`, no scroll library, no `transform` on `<main>` |
| Accessibility | Real HTML over a decorative canvas; WCAG 2.2 AA contrast measured from rendered pixels; skip link; 24×24 targets; visible focus; reduced motion is a static frame |
| Testing | 132 Playwright checks, a 7-step gate, pixel helpers that assert numbers instead of eyeballing screenshots |

Two rules did most of the architectural work:

1. **Numbers live in one place.** All tunable values are in `lib/tuning.ts` and `lib/zones.ts`; GLSL literals are `0`/`1` or geometric constants. A visual change is a data change, not a shader edit.
2. **Frame writes are not React writes.** Nothing calls `setState` per frame. Frame state lives in a mutable signal object; React re-renders only on discrete events (zone change, toggle, form status).

---

## 4. Multi-Agent Development System

### The Problem

I used multiple AI coding agents throughout the development process. Since many available agents and models have free usage limits, relying on a single agent would have created unnecessary restrictions.

However, switching between agents introduces a significant problem: each agent has its own conversation context. Without a shared source of truth, agents lose track of:

- What has already been implemented.
- Which tasks are currently in progress.
- Why certain technical decisions were made.
- What constraints must be respected.
- What should be implemented next.

In practice, the failure mode is not that an agent cannot write code. It is that an agent with no memory re-litigates decisions, duplicates work, "fixes" a constraint it does not know exists, and reports success it has not verified.

### The Solution: Project-Owned Agent Context

I built an agent instruction kit around one principle:

**Project state lives in files, not in chat.**

The repository is the shared memory and the source of truth for every agent that touches the project. This allowed me to switch between models and tools while preserving development context.

The system is deliberately pipeline-shaped: the first unchecked line in `PROGRESS.md` is the next task, and the agent that picks it up does not need to know who did the previous one.

### Agent Kit Structure

| File | Responsibility |
| --- | --- |
| `AGENTS.md` | Entry point: read order, the loop, non-negotiables, evidence rules, blocked-state procedure |
| `PROGRESS.md` | Machine-readable task index and current state; the next task is the first unchecked row |
| `phases/P0–P10.md` | Binding per-phase preambles (constraints, look, tiers, evidence, stop conditions) and per-task specs |
| `SPEC.md` | The locked technical contract: C1–C8, stack pins, architecture rules, zone table, shader budget |
| `CONTENT.md` | Verified source copy plus owner-only `[USER]` slots; nothing may be invented outside it |
| `DECISIONS.md` | Append-only decision log (133 rows) with reason and status |
| `skills/` | Task-scoped instructions: ocean shader, a11y/contrast, glass UI, QA gate |
| `scripts/gate.sh` | Seven-step, fail-fast quality pipeline |
| `scripts/next-task.sh` | Prints the next task, its read range and the files it may touch |
| `scripts/check-c5.sh` | Greps shipped code for banned scroll/animation imports; the behavioural half of C5 is a browser test |
| `scripts/contrast.ts` | WCAG 2.2 AA palette verification, including allowed effect lift |
| `scripts/check-content.ts` | Detects unresolved `[USER]` placeholders in shipped code |

Pointers for Claude Code, Cursor and GitHub Copilot redirect to `AGENTS.md`, so there is one rulebook rather than four drifting ones.

### How Agents Share Context

Every agent follows the same workflow:

1. Read `AGENTS.md`.
2. Run `scripts/next-task.sh` to get the task ID, phase file, read range and allowed files.
3. Read only the phase preamble, the named task, and the skills the task triggers.
4. Implement only that task; announce the file list before editing.
5. Run `npm run gate`, plus the checks the task's **Done** names.
6. Tick the box, append one line to `qa/sessions.md`, add a `DECISIONS.md` row if the choice was non-obvious, commit `P<n>.<m> <name>`.
7. Stop. One task per session.

The next agent continues from repository state, not from a conversation.

### How It Held Up

| Measure | Result |
| --- | --- |
| Commits | 78 |
| Phases completed | P0–P9 (P10 planned) |
| Session lines in `qa/sessions.md` | 63 records with gate result and checks (one chore line is `n/a`) |
| Models used | 8 distinct model labels (see §5) |
| Context handoffs that required re-reading the repo | Every session — by design |
| Constraint regressions caught by the checks | Multiple (e.g. a bottom-left toggle broke C1; a mobile grid overflow broke focus scrolling) |

The two failure cases are the useful evidence. The agent kit did not prevent mistakes; it made them cheap to detect and cheap to hand off.

### Why This Approach?

- Avoids dependence on a single AI provider.
- Makes switching between free and paid models easier.
- Reduces repeated context loading.
- Prevents agents from independently changing project direction.
- Makes development progress recoverable.
- Keeps implementation decisions traceable.
- Encourages smaller, verifiable units of work.
- Makes "done" a repository fact rather than a chat claim.

---

## 5. AI-Assisted Development Workflow

I used different AI agents depending on the task, their capabilities, and their available usage limits.

The intention was never to let AI agents independently build the entire project. I defined the direction, assigned tasks, evaluated output, and decided what was accepted.

### Tools Used

- **OpenCode** — primary AI-assisted coding environment.
- **Antigravity** — secondary environment and agent workflow.
- **Model routing** — free and paid models selected per task, not per session.

The setup is intentionally tool-agnostic: any agent that can read `AGENTS.md` and run a shell can contribute.

### Task Allocation in Practice

Model labels as recorded in `qa/sessions.md`:

| Model label | Sessions | Work actually routed there |
| --- | --- | --- |
| `big-pickle` | 34 | Scaffold, content and UI shell, ocean overhaul, evidence harness, agent-kit refactor |
| `deepseek-v4.1-flash-free` | 12 | Interaction details, quality tiers, case-study motion, glass UI, content, SEO |
| `flash` | 9 | Spring wiring, waterline, effects toggle, C1 test, depth polish |
| `flash-high` | 2 | Adaptive quality, palette pass |
| `Claude Sonnet 4.6 Thinking` | 2 | Fauna, final tuning and evidence report |
| `openrouter-free` | 2 | C5/C6 tests, Lighthouse |
| `gemini-flash` | 1 | Refraction, caustics and rays |
| `deepseek-flash` | 1 | Particle system |

The routing rule was the cost of being wrong:

- Routine layout and transcription → capable lightweight models.
- Complex animation and shader work → strongest available model.
- Review → a different model from the one that wrote the commit.
- Personal facts, content accuracy, deployment and final acceptance → me, not an agent.

### Human Review

AI-generated code was not treated as complete when it compiled.

I reviewed diffs, ran the gate, opened the app, and inspected the actual rendered result. Several fixes exist only because the automated checks passed while the experience was still wrong — a bottom-left effects toggle that broke the C1 waterline at `x=1%`, a mobile grid whose 676 px SVG preview inflated the layout viewport and silently cancelled focus scrolling, a stale dev server that masked whether the canvas mounted at all.

The cross-model review process is the counterweight to agent optimism: a different model reads the latest commit against `SPEC.md` and reports, without editing.

---

## 6. Quality Assurance

### The Gate

`npm run gate` runs seven steps and stops at the first failure:

1. **Type generation** — Next.js route types.
2. **TypeScript** — `tsc --noEmit`, strict.
3. **ESLint** — including Next's rules.
4. **Production build** — the real build, not a dev compile.
5. **C5 grep** — no banned scroll or animation import (`lenis`, `locomotive-scroll`, `embla`, `gsap`, `framer-motion`, `motion`, `three`). The behavioural half — one canvas, no `transform` on `<main>`, a real wheel event not `preventDefault`ed — is in `tests/c5.spec.ts`.
6. **Contrast** — WCAG 2.2 AA over the zone palette, with the permitted shader lift included.
7. **Content** — unresolved `[USER]` slots in shipped code (`STRICT=1` makes them fatal).

Run on the submitted tree:

```
PASS typegen
PASS typecheck
PASS lint
PASS build
PASS c5-grep
PASS contrast
PASS content

GATE: PASS
```

The gate is necessary, not sufficient. It cannot tell whether the water looks good.

### The Test Suite

`npx playwright test` builds the app, starts it, and runs the same suite against a desktop and a mobile project:

```
1 skipped
131 passed (37.2s)
```

| Spec | Checks | What it proves |
| --- | --- | --- |
| `c1` | 4 | Waterline at 30% of viewport, effects on and CSS fallback |
| `c2` | 2 | Last viewport is near-black (mean luma < 0.05) with blue > red |
| `c3` | 4 | Spring is pure, overshoots, and settles inside 3 s at 60 and 30 fps |
| `c4` | 2 | Every text element meets AA against the rendered background |
| `c5` | 8 | No `<main>` transform, one canvas, real wheel events not prevented |
| `c6` | 26 | Fallbacks, 24×24 targets, Tab pass, skip link, form errors, mobile reachability, nav state |
| `c7` | 58 | Tier decision purity, per-tier settings, adaptive downshift, CPU-throttled render |
| `look` | 26 | Palette, foam edge, surface band, flow ratio, depth light, layer coverage, particles, fauna, grade, static tier |
| `shots` | 2 | Screenshots at 0/15/50/100% scroll |

The one skip is an expected mobile CPU-throttling case, not a disabled assertion.

Pixel assertions go through `tests/helpers/pixels.ts` and compare numbers (luma, coverage, boundary row, frame delta). Screenshots are artefacts for the owner; they are never treated as evidence by an agent.

### Manual Verification

Passing automated checks does not mean the experience is good, so I also checked by hand:

- Visual inspection of the surface, plunge, each zone transition, and the case-study dive.
- Responsive behaviour at desktop and mobile widths, including the fixed chrome.
- Animation smoothness and whether the scroll spring overshoots and settles believably.
- Pointer and scroll interaction on the real page, not only in tests.
- Readability in every zone, and reduced-motion behaviour.
- Browser compatibility in Chromium, and the no-WebGL2 fallback path.
- Content accuracy against `CONTENT.md` — no invented metric, employer, date or URL.

**Automated checks and manual verification are separate responsibilities.** A green gate does not close a **U** item.

### Lighthouse (recorded 2026-11-14)

Recorded in `qa/sessions.md` for P6.7, Lighthouse 13.6 / Chrome 157, mobile, with `?fx=off` for a deterministic measurement:

| Route | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` | 100 | 100 | 100 | 100 |
| `/projects/stitchlogic` | 100 | 100 | 100 | 100 |

Canvas-on runs were also 100 across the four categories, but they are treated as informational because headless frame timing is not a meaningful performance claim.

---

## 7. Development Principles

The principles that guided the build, and how each was enforced:

1. **Creative direction first** — every implementation task names the intended experience effect; a change that does not contribute is rejected even if it is technically neat.
2. **Shared project context** — knowledge lives in the repository (`AGENTS.md`, `SPEC.md`, `DECISIONS.md`), never only in a conversation.
3. **Small, controlled tasks** — one task, one commit, under 20 files; hard tasks are split into `a/b/c` rows.
4. **Human ownership** — I own architecture, direction, content truth and final acceptance.
5. **Independent verification** — an agent's claim is not evidence; command output is.
6. **Traceable decisions** — 133 decision rows, each with the alternative and why it lost.
7. **Performance matters** — complex visuals may not cost usability; quality tiers and adaptive downshift exist so the page degrades instead of stuttering.
8. **Tool independence** — the project must be understandable and maintainable regardless of which agent, or human, opens it next.

One more principle emerged during the build:

9. **Constraints are code, not intentions.** C1–C8 are tested. A constraint that only exists in a document gets broken by the third agent.

---

## 8. What Was Built

### Pages and Routes

| Route | Description |
| --- | --- |
| `/` | Hero → Projects → About → Skills → Contact → Closing, one continuous dive |
| `/projects/[slug]` | Case study for five projects: KeySpace, StitchLogic, Syncora, EduAnalytics, Smart Inventory System |
| `/api/contact` | Zod-validated contact endpoint with honeypot, minimum-time check, in-memory per-IP throttle and Resend delivery |
| `/sitemap.xml`, `/robots.txt`, `/icon.svg`, `/opengraph-image` | SEO and identity surface |

### Experience Surface

- **One fixed ocean WebGL2 canvas** behind real HTML, `aria-hidden`, pointer-transparent, dynamically imported.
- **Five zones** with their own palette, text colour, effect weights and depth band.
- **Animated water**: four wave trains, dual counter-flow, domain-warped refraction, analytic caustics, seven sun shafts, foam line, specular crests, distance fog and perspective depth.
- **Ambient life**: parallax particles (14 far / 7 mid / 4 near bokeh / 3 lens droplets), five fish schools and two jellyfish, all depth-gated and tier-gated.
- **Camera grade**: 6%-capped vignette, 1% grain, x-only drift and a 0.195° colour-only roll.
- **Scroll and pointer springs** driving turbulence, ripple and the skills torch.
- **Chrome**: fixed nav, dive-line depth readout with meters and zone label, buoy chip, effects toggle, back-to-surface control.
- **Glass UI**: one CSS-first glass system (`lib/glass.ts` + `.glass` rules) for every panel, bar, card, control, chip and field, with zone-aware tones so the fill always moves away from the text.
- **`FluidGlass`**: one bounded liquid-glass mark in the closing section, the only glass renderer that animates continuously, driven by the single loop.

### Fallbacks

- `?fx=off` — static CSS gradient, full content, same navigation.
- No WebGL2 — detected before mount, static gradient, full content.
- Context loss — canvas removed, static gradient, full content.
- Reduced motion — tier 3: static frame, no time progression, identical pixels across frames.
- Weak GPU — tier 1/2: lower DPR, fewer octaves, fewer particles, no fauna or camera.
- Coarse pointer / narrow viewport — tier 2 by default.

### Engineering Surface

- Strict TypeScript, typed content and project data, Zod schema shared by form and route.
- `lib/layout.ts` layout cache (`ResizeObserver`), `lib/zones.ts` palette/depth/effect interpolation, `lib/signal.ts` the single frame loop.
- 133 recorded decisions, 63 session records, a 7-step gate, 132 browser checks.
- Full keyboard path, skip link, labelled form errors, 24×24 targets, `aria-current`, decorative canvas hidden from assistive tech.

---

## 9. Technical Architecture

### Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16.4 (App Router) | Server-rendered content, route handlers, metadata and image routes in one runtime |
| Language | TypeScript 6.0, strict | The content model and agent contract are easier to enforce with types |
| Styling | Tailwind 4.3 + runtime CSS variables | Zone colours are runtime values, not build-time theme tokens |
| Renderer | OGL 1.0.11 | Small WebGL2 wrapper with a `render()` entry point the single loop can call once per frame |
| Validation | Zod 4.6 | One schema for the client form and the route handler |
| Email | Resend 6.38 | Server-side delivery without exposing a provider SDK to the client |
| Tests | Playwright 1.65 + pngjs | Real browser, real pixels, numbers instead of screenshots |

No scroll library, no animation framework, no UI component library, no second animation loop, and no additional GL surface beyond the ocean canvas and the bounded closing mark.

### The Frame Path

```
scroll / pointer events (passive)
        │
        ▼
lib/signal.ts — one requestAnimationFrame loop
  • clamp dt (≤ 1/20 s)
  • underdamped springs for scroll velocity and pointer velocity
  • quality tier decision (pure function)
  • adaptive FPS evaluation after a 2 s warm-up
  • active zone from the layout cache
  • notify frame listeners (canvas, FluidGlass, torch, dive line)
        │
        ├──▶ OceanCanvas: write uniforms, one full-screen draw
        ├──▶ FluidGlass: update uniforms, draw its bounded mark
        └──▶ DOM instruments: rounded CSS vars, no React state
```

Rules that follow from it:

- React state changes only on discrete events (zone change, toggle, form status).
- The shader samples the palette from uniforms uploaded from `lib/zones.ts`; it does not own colour.
- Layout positions are cached and invalidated by `ResizeObserver`, never read per frame.
- `getComputedStyle` is not called during render.

### Zones and Depth

`lib/zones.ts` is the single source for palette, depth and effect weights:

| Zone | Depth | Surface role |
| --- | --- | --- |
| Surface | 0–30 m | Hero |
| Sunlight | 30–200 m | Projects |
| Twilight | 200–1,000 m | About |
| Midnight | 1,000–4,000 m | Skills |
| Abyss | 4,000–6,000 m | Contact and closing |

`bgAt`, `metersAt` and `fxAt` interpolate inside a section and `smoothstep` across the 25 vh gaps. Text colour is static CSS keyed on `[data-zone]`; it never changes per frame, which is what makes contrast provable.

### Shader Budget

The fragment shader has a hard budget of ≤ 12 noise taps per pixel at full quality (`uOct = 4`). Each optional layer is gated by its `uFx` component, so tier 1 and 2 reduce cost without a second shader:

- flow 4 taps (domain warp reuses one)
- sky clouds ≤ 3 taps
- refraction 2 taps
- god rays 1 tap
- particles 1 tap
- caustics, foam, specular, fauna, grade: analytic, 0 taps

Each optional layer — plus the sky/surface pass and the camera grade — has a debug output (`uDebug` 11–17) so tests can measure its coverage in isolation rather than inferring it from a pretty picture.

### Content Pipeline

`CONTENT.md` is the verified source. `lib/content.ts` and `lib/projects.ts` carry the transcribed values from it; unconfirmed fields are omitted rather than rendered as placeholders. `scripts/check-content.ts` greps shipped code for `[USER]`, and `STRICT=1` makes any hit fatal. The final content pass recorded zero unresolved slots.

### Contact Flow

Client form → Zod validation → `POST /api/contact` → honeypot and minimum-time check → in-memory per-IP throttle → Resend. The route returns `503` without a key, `400` on invalid input, `200` for a honeypot or fast submission (silently accepted), `429` on repeat. Errors are linked to their fields with `aria-invalid` and `aria-describedby`. The throttle is explicitly not production-grade anti-abuse (see §15).

### Glass UI

`lib/glass.ts` exposes `glass({ variant, tone, interactive, className })`, the only way to style a surface. Variants are shapes (`panel`, `bar`, `card`, `control`, `chip`, `field`); tones are fills (`clear`, `regular`, `strong` zone-aware, `solid`, `chrome`). It is CSS-first: `color-mix`, gradients, inset highlights and state transitions. It creates no canvas and no loop. The one continuous glass renderer is `FluidGlass`, which subscribes to `onFrame`.

### Accessibility Model

- Real HTML text over a decorative canvas; the canvas is `aria-hidden` and not focusable.
- Skip link first in tab order; visible 2 px zone-coloured focus ring.
- 24×24 minimum targets; mobile navigation reachable in ≤ 2 taps from a cold load.
- Form labels programmatically linked; validation errors announced.
- Reduced motion is a static render, not a faster animation.
- Every text/background pair is measured from rendered pixels, not assumed from tokens.

---

## 10. Development Progress

All interview-scope work is complete; the code is committed and verified. The checklist below reflects verified completion, not intent.

### Foundation and Process

- [x] Established the ocean-themed creative direction.
- [x] Defined the concept of a scroll-driven underwater experience.
- [x] Designed a project-owned context system for multiple AI agents.
- [x] Created the central agent instruction structure (`AGENTS.md`, `PROGRESS.md`, `SPEC.md`, `phases/`, `skills/`).
- [x] Established task-based development and handoff workflows (`next-task.sh`, one task per session, session log).
- [x] Added automated quality and validation scripts (gate, C5 grep, contrast, content).
- [x] Established cross-model review and verification procedures.

### Product

- [x] Scaffolded and pinned the application (Next.js 16, React 19, TypeScript 6, Tailwind 4).
- [x] Built the typed content layer from verified copy, with owner-only slots omitted rather than faked.
- [x] Built the full page composition: Hero, Projects, About, Skills, Contact, Closing.
- [x] Implemented the single WebGL ocean canvas and the CSS fallback.
- [x] Implemented the five-zone depth model with per-zone palette and effect weights.
- [x] Implemented the animated water: waves, flow, foam, refraction, caustics, rays, specular.
- [x] Implemented scroll and pointer springs, plunge, turbulence and the skills torch.
- [x] Implemented ambient particles, marine life, camera drift, vignette and grain.
- [x] Implemented quality tiers 0–4, adaptive downshift, reduced motion and `?fx=off`.
- [x] Implemented the case-study route with dive and ascent choreography.
- [x] Implemented the contact form and `/api/contact` with validation, honeypot, timing and rate limit.
- [x] Implemented the glass UI system and the bounded `FluidGlass` mark.
- [x] Implemented SEO surface: metadata, sitemap, robots, icon, Open Graph image, Person JSON-LD.
- [x] Implemented the accessibility pass: focus, targets, labels, announcements, fallbacks.

### Verification

- [x] Wrote the C1–C7 browser suites and the look/shots evidence suites.
- [x] Added the pixel helper library and numeric assertions.
- [x] Recorded Lighthouse results for `/` and a case-study route.
- [x] Recorded 133 decisions and 63 session lines.
- [x] Produced a final evidence report with **A** items passed and **U** items left open.

### Documentation

- [x] Recorded the visual direction and the zone model.
- [x] Documented the frontend architecture and the single-loop frame path.
- [x] Recorded animation and rendering decisions, including rejected alternatives.
- [x] Documented the working ocean environment and its evidence.
- [x] Documented the quality tiers, adaptive behaviour and fallback paths.
- [x] Recorded the significant AI-assisted implementation sessions.
- [x] Added the build and verification instructions to `README.md`.
- [ ] Record final deployment — **deployment is the one open item; see §15.**

---

## 11. Verification and Evidence

Evidence rules used throughout: every constraint in `SPEC.md` §1 is tagged **A** (an agent can prove it from output) or **U** (owner only). Only **A** items are claimed, and only from pasted command output.

### Constraint Evidence

| ID | Constraint | Evidence | Status |
| --- | --- | --- | --- |
| C1 | Waterline at 30% of viewport, effects on and off | `tests/c1.spec.ts` — 4/4, boundary sampled across `x=10–90%` | PASS |
| C2 | Scroll is descent; last viewport near-black with blue > red | `tests/c2.spec.ts` — 2/2, mean luma < 0.05 | PASS |
| C3 | Underdamped springs overshoot and settle | `tests/c3.spec.ts` — 4/4 at 1/60 s and 1/30 s | PASS |
| C4 | WCAG 2.2 AA against rendered background in every zone | `scripts/contrast.ts` + `tests/c4.spec.ts` — 2/2, desktop and mobile | PASS |
| C5 | Real HTML over one canvas, native scroll only | Gate grep + `tests/c5.spec.ts` — 8/8, wheel not prevented | PASS |
| C6 | Projects, Resume, Contact reachable at both viewports, ≤ 2 taps on mobile | `tests/c6.spec.ts` — 26/26 | PASS |
| C7 | Quality tiers and fallbacks; reduced motion static | `tests/c7.spec.ts` — 58 checks, 57 pass + 1 expected mobile skip (the 4× CPU throttle runs on desktop) | PASS (logic) |
| C7 (U) | 60 fps on real mid-range hardware | Not measurable from a headless browser — OPEN for the owner | OPEN |
| C8 | No invented fact, number, date, stack item or URL | `STRICT=1 npm run check:content` — 0 unresolved slots; every value traced to `CONTENT.md` | PASS |

### Look Evidence (numbers, not screenshots)

From the final `look` run (the values below are the mobile project's printed numbers; the desktop project asserts the same thresholds):

- Mean waterline boundary: **30.1%** (target 30% ± 0.5%).
- Surface band: rows 30–45% at least 0.02 luma brighter than rows 55–70%.
- Foreground flow ratio: near field changes ~3.5× faster than far field (threshold 1.5).
- Depth light: top-half water 0.456 luma vs bottom-half 0.174 (Δ 0.282).
- Layer coverage at 15% scroll / 100% scroll: refraction 0.0007 / 0.0012, caustics 0.9954 / 0.0012, rays 0.1318 / 0.0012.
- Particles: 0.0592 at tier 0, 0.0353 at tier 1, 0.0000 in the abyss.
- Fauna: 0.0452 at tier 0, 0.0000 at tier 1 and in the abyss.
- Grade: vignette corner 0.0588 below the 0.06 cap; grain 0.0061 below the 0.01 cap; tier 3 frames 600 ms apart are pixel-identical.

### Reproducible Commands

```bash
npm run gate                              # GATE: PASS (7/7 steps)
npx playwright test                       # 131 passed, 1 skipped (132 total)
npx playwright test tests/c4.spec.ts      # contrast in rendered pixels
npx tsx scripts/contrast.ts               # palette only
STRICT=1 npm run check:content            # 0 unresolved slots
npm run shot                              # screenshots → qa/screens/ (gitignored)
npm run lh                                # Lighthouse (advisory, recorded above)
```

---

## 12. Development Log

Entries reflect real commits. Dates are the commit dates; models are the labels recorded in `qa/sessions.md`.

### 2026-11-13 — Foundation, agent kit, and a fail-fast gate

**Objective.** Put the project on rails before writing the experience: pinned stack, typing, tokens, fonts, tests, and the agent contract.

**Approach.** Eight tasks (`P0.1`–`P0.8`), each one commit. Scaffold at the repo root, pin exact versions, replace the default scripts, write the gate, establish tokens and the zone CSS with a fallback gradient, choose fonts, add Playwright with a pixel helper, document the environment contract.

**AI Assistance.**
- Agent/model: `big-pickle`.
- Assigned task: P0.1–P0.8.
- Generated output: scaffold configuration, gate script, CSS tokens, Playwright config, pixel helper.
- Changes made after review: kept the fallback gradient in the same commit as the tokens so C1 could be tested before the canvas existed.

**Challenges.** The temptation was to start with the shader. Starting with the gate meant every later visual change was already measured.

**Decisions.** Fail-fast gate; no dependency that owns a frame loop; CSS fallback is a first-class path, not a degraded one.

**Verification.** `GATE: PASS` with two not-yet-applicable steps skipped at that stage; dev server returned HTTP 200.

**Evidence.** Commits `0c2e626` → `05da3d3`; `qa/sessions.md` P0.2–P0.8.

**Next steps.** Content and UI shell.

### 2026-11-14 — Verified content and the full UI shell

**Objective.** Build every section and route from verified copy, with no invented facts, before layering animation on top.

**Approach.** Eighteen tasks: types, tuning, zones, content, projects, contact schema, layout, nav, hero, projects, about, skills, contact, API, case study, OG image, content checker, composition. Server components for content; one client boundary per interactive surface.

**AI Assistance.**
- Agent/model: `big-pickle`.
- Assigned task: P1.1–P1.18.
- Generated output: typed content modules, all sections, contact endpoint, case-study route, OG image.
- Changes made after review: rejected placeholder copy; every unconfirmed field was omitted rather than rendered.

**Challenges.** The content rule (C8) is stricter than it looks. It forced the data layer to be honest about missing fields, which in turn made the UI handle absence instead of pretending.

**Decisions.** `CONTENT.md` is the only source; the contact schema is shared by client and server; project cards ship without images and rely on an architecture preview.

**Verification.** Boundary 30.00% / 29.98%; four project cards with zero image requests; five skill groups with 29 items; form invalid 3×, 404 → error, 200 stub → success; `/api/contact` no-key 503, bad 400, honeypot/fast 200, valid 200, repeat 429; OG image 1200×630.

**Evidence.** Commits `2dca531` → `2f4c45a`.

**Next steps.** The ocean canvas.

### 2026-11-14 — The ocean: one loop, one canvas, five zones

**Objective.** Make the page descend convincingly without hijacking scroll or costing the content its accessibility.

**Approach.** `lib/signal.ts` as the only loop; `lib/layout.ts` as the layout cache; `lib/zones.ts` as palette and depth interpolation; `OceanCanvas` as a dynamic client boundary that uploads uniforms and draws once per frame. Then the shader core: waves, flow, foam, waterline, plunge.

**AI Assistance.**
- Agent/model: `big-pickle`, then `flash`.
- Assigned task: P2.1–P2.9, then P3.1–P3.7.
- Generated output: signal loop, provider, canvas, shader core, uniform wiring, depth tests.
- Changes made after review: fixed a context lifecycle bug where the loop kept notifying a disposed canvas.

**Challenges.** The waterline is the collision point between art and constraint. Waving the surface visually is fine; moving the measured boundary is not. The solution was to keep the mask on undisplaced UVs and displace only colour.

**Decisions.** Springs are unit-tested pure functions; the shader never owns colour; gaps between sections are text-free so blending cannot lower contrast.

**Verification.** Continuous gradient from surface to abyss; boundary inside 27–33%; C2 and C4 passing; contrast max delta 0.0196; zero text in gaps.

**Evidence.** Commits `adab047` → `a6493cb`; `qa/sessions.md` P2.1–P3.7.

**Next steps.** Interaction.

### 2026-11-14 — Interaction: springs, torch, dive line, case study

**Objective.** Make scrolling and pointing feel physical, and give the depth metaphor a readable instrument.

**Approach.** Pointer velocity into a second spring; a torch that follows the pointer across the skills field; a dive line that reports zone, meters and progress; a case study that dives from the current depth and ascends on return; project cards with CSS-only motion.

**AI Assistance.**
- Agent/model: `flash`, then `deepseek-v4.1-flash-free`.
- Assigned task: P4.3, P5.1–P5.5.
- Generated output: pointer wiring, buoy chip, card motion, torch, dive line, dive/ascent.
- Changes made after review: cached element centres, scoped the glow variable to the fields, kept all motion inside `onFrame`.

**Challenges.** The torch initially read layout every frame. Caching centres and writing one CSS variable per frame kept it inside the performance rules.

**Decisions.** No per-frame `setState`; CSS transitions for discrete motion; the dive line is chrome, not content, so it is excluded from contrast screenshots.

**Verification.** Pointer spring wired to the shader; buoy tracked without layout shift; zones surface → sunlight → twilight → midnight → abyss with 4 live mutations; meters 15 → 687 → 4,944; case-study luma 0.189 → 0.013 → 0.005; ascent 1,999 → 0 in 100 ms under reduced motion.

**Evidence.** Commits `84f3baa` → `4c32429`.

**Next steps.** Make it survive weak hardware and assistive technology.

### 2026-11-14 — Quality tiers, accessibility, and the evidence suite

**Objective.** Turn "it looks good on my machine" into a tiered, tested experience.

**Approach.** A pure tier decision (`decideTier`) and per-tier settings; adaptive FPS evaluation with no mid-session upgrade; reduced motion as tier 3; no-WebGL fallback; an effects toggle; then C5/C6 suites; then Lighthouse.

**AI Assistance.**
- Agent/model: `deepseek-v4.1-flash-free`, `flash-high`, `openrouter-free`.
- Assigned task: P6.1–P6.7.
- Generated output: tier logic, adaptive quality, fallback paths, accessibility fixes, C5/C6 tests, Lighthouse config.
- Changes made after review: moved the effects toggle from bottom-left to bottom-right after it broke C1; removed a colour transition from skill chips that failed C4; fixed the mobile grid overflow that cancelled focus scrolling.

**Challenges.** Three separate failures were caught by measurement, not by looking: the toggle at `x=1%`, the chip transition, and a 676 px SVG inflating the layout viewport to 1,041 px on a 390 px screen.

**Decisions.** Never upgrade quality mid-session; degradations are one-way. Fallbacks keep every section and every navigation target. Lighthouse is advisory and recorded, not a gate.

**Verification.** `c7` 58 checks; CPU throttled 4× → tier 1 and still renders; no-WebGL2 and context-loss both show all five zones; 24×24 targets; Tab pass with no trap, invisible or obscured focus; mobile focus scroll restored (0 → 753); Lighthouse 100/100/100/100 on both routes.

**Evidence.** Commits `a22ccce` → `7c0cbe0`; `qa/sessions.md` P6.1–P6.7.

**Next steps.** Art direction overhaul — the water was correct but not yet convincing.

### 2026-11-15 — Ocean overhaul: light, matter, life

**Objective.** Replace a flat gradient with water that reads as a physical medium.

**Approach.** Eight tasks: evidence harness, palette, sky and surface, refraction and caustics and rays, particles replacing marine snow, fauna, camera and grade, tune. Every layer got a debug output and a numeric test.

**AI Assistance.**
- Agent/model: `big-pickle`, `flash-high`, `gemini-flash`, `deepseek-flash`, `Claude Sonnet 4.6 Thinking`.
- Assigned task: P8.0–P8.7.
- Generated output: sky and cloud field, waterline band and foam, analytic caustics, seven sun shafts, four parallax particle layers, five fish schools and two jellyfish, vignette and grain.
- Changes made after review: deleted a dead scan loop in the look spec; fixed a stale dev server that masked whether the canvas mounted; measured the vignette at the surface stop because mid-water flow noise was the same size as the effect.

**Challenges.** The noise budget is the binding constraint. Caustics and fauna had to be analytic to stay under 12 taps. The vignette had to be a separable corner product, not a radial falloff, to stay under the 6% cap at every aspect ratio.

**Decisions.** D-200 (sun anchor and perspective flow), D-203 (analytic fauna), D-205 (separable grade), D-206 (evidence-only final pass). Rejected: three.js (banned by §2/C5) and a radial vignette profile (D-205).

**Verification.** 26/26 look checks; 131 passed / 1 skipped across the suite; every layer measured at full strength, at tier 1, and in the abyss; contrast unchanged.

**Evidence.** Commits `332ffa7` → `52c4586`; D-200, D-203, D-205, D-206.

**Next steps.** Unify the UI so it belongs in the water.

### 2026-11-15 — One glass system, content closure, SEO surface

**Objective.** Make every surface feel like it belongs to the environment, close the remaining content questions, and finish the discoverability layer.

**Approach.** `lib/glass.ts` plus a CSS block, migrated chrome and cards; FluidGlass as the only continuous renderer; owner answered the four content slots; sitemap, robots, icon, JSON-LD; deployment attempted.

**AI Assistance.**
- Agent/model: `deepseek-v4.1-flash-free`, `big-pickle`.
- Assigned task: P9.0–P9.2, P7.1–P7.3.
- Generated output: glass contract, migration, evidence, content decisions, SEO routes.
- Changes made after review: rejected `@liquefy-ui/*` and `liquid-glass-js` because their renderer owns a frame loop and a WebGL context per lens; wrote the in-house CSS-first system instead.

**Challenges.** The attractive option was also the incorrect one. The glass library looked right and violated C5 the moment it was added. The replacement adds no canvas and no loop, and its zone-aware fill cannot lower contrast by construction.

**Decisions.** D-202 (in-house glass), D-207 (content slots resolved with dated answers), D-214 (single `SITE_URL`). Deployment recorded as **BLOCKED**, not silently skipped.

**Verification.** `c4` + `c5` + `c6` 36/36; sitemap returns 6 URLs; robots allows all with `Sitemap` and `Host`; JSON-LD parses with 3 `sameAs` URLs; strict content reports 0 slots.

**Evidence.** Commits `ae458ea`, `837a78a`, `0b7447e`, `f57cfeb`.

**Next steps.** Editorial redesign (P10) and redeploy — see §15.

### 2026-11-15 — Editorial redesign planned (P10)

**Objective.** Remove the remaining "template over a background" feel: replace the top navbar and cards with a left dock, depth-based layout rhythm, and content that sits in the water.

**Approach.** A ten-task phase: left dock, type contract and narrowed glass scope, environment bridge, a bounded 2D foreground atmosphere canvas, water-aware blocks, a sculptural hero masthead, and section-by-section rebuilds.

**AI Assistance.**
- Agent/model: planning by `big-pickle`; not implemented.
- Assigned task: P10.0–P10.10.
- Generated output: a binding phase plan with two explicit owner blockers.
- Changes made after review: stopped rather than editing `AGENTS.md` or `SPEC.md`, which are owner-only.

**Challenges.** Two tasks require owner amendments the agent is not allowed to make: narrowing the glass rule to chrome and controls, and allowing one bounded foreground 2D canvas. Both are documented in `PROGRESS.md` **Blockers** and `DECISIONS.md` D-208/D-211.

**Decisions.** The redesign is an evolution, not a restructure: section order, zone map, C6 destinations and the case-study route stay, so existing evidence remains valid.

**Verification.** n/a — planning only. The submitted tree is the verified P0–P9 build.

**Evidence.** Commit `179e44f`; D-208–D-213.

**Next steps.** Owner answers the two amendments; then P10.0.

---

## 13. Challenges and Key Decisions

The full record is `DECISIONS.md` (133 rows). These are the ones that shaped the result.

**1. The glass library that had to be rejected (D-202).**
The requested liquid-glass look had an obvious library answer. It also created a `requestAnimationFrame` loop and a WebGL context per lens, which breaks C5, the single-loop rule and the performance budget. I wrote a CSS-first system instead: zone-aware `color-mix` fills, no canvas, no loop, and a fill that mathematically moves away from the text colour so contrast cannot regress. `FluidGlass` remained the one continuous renderer, on the single loop.

**2. Water that is correct but not convincing (D-200, D-203, D-205).**
The first water passed every test and still looked flat. The fix was not more effects; it was physical structure — sun shafts anchored to the stable waterline, perspective scaling for foreground flow, analytic caustics, parallax particles, and a graded camera. Each addition had to fit the existing tap budget, so most of the work was subtraction.

**3. Measurement beats observation (D-204).**
A 676 px architecture SVG inside a grid item set `min-width: auto` and inflated the mobile layout viewport from 390 px to 1,041 px. Nothing looked broken. Focus scrolling was silently cancelled, and the Tab test failed with "Expected > 12, received 7". The fix was one `min-w-0` and an explicit labelled scroll container. The lesson is in the test, not the CSS.

**4. Constraints must be executable.**
C1 broke because a fixed toggle sat at the left edge where the waterline was sampled. It was found because the constraint was code, not a paragraph. Every constraint that mattered ended up as code.

**5. Honest absence over invented content (C8).**
The easiest way to make the portfolio look complete is to invent a metric or a role line. The content rule forbids it. Unconfirmed fields are omitted and flagged; the UI handles absence. The final strict scan reports zero unresolved slots, which means every shipped fact has a source.

**6. Stop at the owner boundary.**
P10 needs an amendment to `AGENTS.md` and `SPEC.md`. Agents may not edit either. The work stopped there and was recorded as a blocker with the current tree left green. That is a deliberate process outcome, not an accident of tooling.

---

## 14. Retrospective

### What the interview task actually tested

Not "can you build a portfolio". The interesting constraints were:

- **Taste under constraint.** A 30% waterline, a fixed canvas and a 12-tap shader budget are creative limits. The design had to emerge from them rather than ignore them.
- **Engineering judgement.** The right answer was often "no": no scroll library, no glass library, no second canvas, no three.js, no invented content.
- **Process design.** A codebase that survives eight different model labels is a codebase with a real contract, a real task index and real evidence.
- **Self-review.** The most valuable output of the process is not the 78 commits; it is the ability to say "this is blocked, here is why, here is the exact next step".

### What went well

- The checks caught regressions that visual review missed, three times.
- The phase preamble kept agents from re-deciding settled questions; the decision log made the alternatives inspectable.
- Numeric evidence made subjective claims falsifiable: "the water is deeper" became "top half 0.456 vs bottom half 0.174".
- The fallback paths were built early, so accessibility and no-WebGL were never a late retrofit.
- Splitting work into one-task sessions kept every commit reviewable.

### What I would do differently

- **Build the evidence harness before the effects.** The first water passed tests that could not see what was wrong. The look suite should have existed in P2.
- **Pin the visual reference earlier.** Some of P8 was spent discovering that "more effect" was the wrong direction.
- **Route reviews more aggressively.** Cross-model review happened, but not on every commit; a fixed review step after each phase would have caught the mobile viewport issue sooner.
- **Write the submission document in parallel.** This report was assembled at the end from `qa/sessions.md`. A running log would have been cheaper and more accurate.

### What I would tell another developer doing this

1. Make the constraints executable before you make them beautiful.
2. Give every agent the same entry point and the same evidence rule.
3. Never let an agent close a **U** item.
4. Keep the fallback in the definition of done.
5. Treat blocked as a valid, reportable outcome. A red gate with an honest blocker is worth more than a green gate with a disabled test.

---

## 15. Honest Limitations and What Remains

The submitted build is complete, verified and committed. These items are genuinely open, and I would rather state them than have them discovered.

| Item | State | Why it is open |
| --- | --- | --- |
| **Deployment refresh** | BLOCKED | As recorded on 2026-11-15, the existing Vercel project returns an older build: `/sitemap.xml`, `/robots.txt` and `/icon.svg` return 404, JSON-LD is absent, and `og:image` points at localhost. Completing the deploy needs the owner's Vercel credentials; the agent environment has none. `npm run build` passes, so a redeploy is a one-command step. |
| **Real-hardware frame rate (C7, U)** | OPEN | Headless browser timing is not a mid-range laptop. Tiers, adaptive downshift and the CPU-throttle test are verified; the 60 fps claim is not. |
| **Subjective visual quality** | OPEN | The look suite proves structure (boundary, foam edge, flow ratio, depth light, layer coverage). It cannot prove beauty. |
| **P10 editorial redesign** | PLANNED | Ten tasks are specified and two are blocked on owner-only amendments to `AGENTS.md` and `SPEC.md`: narrowing the glass rule to chrome/controls, and allowing one bounded foreground 2D canvas. I did not edit those files. |
| **Palette table in `SPEC.md` §5** | OPEN | The shipped palette is measured and passing; the spec table has not been updated by the owner. |
| **Screenshot and recording set** | PARTIAL | `npm run shot` produces eight screenshots at 0/15/50/100% on desktop and mobile, but they are build artefacts and gitignored, not a curated milestone gallery. |
| **Contact throttle durability** | KNOWN LIMIT | The per-IP throttle is an in-memory `Map`, so it resets on cold start and is per instance. Adequate for a portfolio contact form; not a production anti-abuse system. |
| **Lighthouse under canvas** | INFORMATIONAL | Recorded at 100 across categories, but treated as informational because headless frame timing is not a performance claim. |

None of these are hidden failures. Each has a recorded state, an owner, and a next action.

---

## 16. Project Links

| Resource | Link |
| --- | --- |
| Repository | [github.com/samibyte/portfolio-samibyte](https://github.com/samibyte/portfolio-samibyte) |
| Live portfolio | [samibyte.vercel.app](https://samibyte.vercel.app) — deployed from an earlier build; refresh pending (see §15) |
| Development journal | This document |
| Agent contract | `AGENTS.md` · `SPEC.md` · `PROGRESS.md` · `DECISIONS.md` |
| Session log | `qa/sessions.md` |
| Evidence report | `qa/REPORT.md` |
| Design references | `lib/zones.ts` (palette and depth), `lib/tuning.ts` (all motion and shader numbers) |

---

## 17. Review Guide

For a reviewer with ten minutes:

```bash
git clone https://github.com/samibyte/portfolio-samibyte.git
cd portfolio-samibyte
npm ci
npm run gate            # expect: 7 × PASS, GATE: PASS
npx playwright test     # expect: 131 passed, 1 skipped
npm run dev             # http://localhost:3000
```

What to try in the browser:

1. Load `/` — waterline at 30%, animated surface, hero text above water.
2. Scroll slowly — palette darkens, content emerges, the dive line reports depth.
3. Scroll fast — the water is disturbed and settles (spring overshoot).
4. Move the pointer over the skills field — the torch follows.
5. Press Tab from load — skip link first, visible focus, no trap.
6. Toggle reduced motion — the scene becomes a static frame with identical pixels.
7. Open `/?fx=off` — the full page and navigation remain, on a static gradient.
8. Open a project, then use the dive/ascent transition back to `/`.
9. Submit the contact form with invalid input — errors are announced and linked.
10. Disable WebGL2 — the page still works, with the fallback.

What to read, in order: `SPEC.md` §1 (the constraints), `lib/signal.ts` (the single loop), `lib/zones.ts` (the depth model), `components/ocean/shader.ts` (the layer budget), `AGENTS.md` (the process), `DECISIONS.md` (why the alternatives lost).

---

## 18. Project Objective

The final result demonstrates two things:

**The product:** a distinctive, immersive portfolio that showcases creativity, frontend engineering, interaction design and attention to detail — while remaining real HTML, keyboard-usable, contrast-verified and honest about its content.

**The process:** a structured approach to AI-assisted development where multiple agents collaborate through shared project context, controlled task execution, human review and independent verification — and where "done" is a repository fact, not a model's claim.

This project was not only about building a portfolio. It was an exploration of how to build software effectively when AI agents are part of the development process: how to give them enough context to be useful, enough constraint to be safe, and enough scrutiny that their output can be trusted.

---

*Submitted 15 November 2026. The document is maintained alongside the repository; the open items in §15 are the only unfinished work.*
