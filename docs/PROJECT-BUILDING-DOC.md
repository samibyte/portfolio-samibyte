**Owner:** Sami Adnan

**Status:** Complete — interview submission

**Project Type:** Interactive Creative Developer Portfolio

**Built:** 13–15 November 2026 · Next.js 16 · TypeScript · WebGL (OGL) · 78 commits

**Repository:** [github.com/samibyte/portfolio-samibyte](https://github.com/samibyte/portfolio-samibyte)

---

## 1. What This Is

A personal portfolio where the website is the experience: you scroll, and you descend through an ocean. Content does not sit on top of a background — the water is the navigation metaphor and the visual identity.

It was also an experiment in AI-assisted development: a workflow where several different models work on the same codebase across many sessions without losing context. The repository, not the chat, is the source of truth.

---

## 2. The Thinking

I tried rain, space, forests and mountains first. The ocean won because it can be *deep*: it gives structure to a single-page portfolio without a conventional section stack. Depth becomes order, and order becomes navigation.

The page opens with 70% water and 30% air, then descends:

| Zone | Depth | Content |
| --- | --- | --- |
| Surface | 0–30 m | Hero |
| Sunlight | 30–200 m | Projects |
| Twilight | 200–1,000 m | About |
| Midnight | 1,000–4,000 m | Skills |
| Abyss | 4,000–6,000 m | Contact + closing |

Rules I set early because they protect the idea:

- **Native scroll only.** The animation reads scroll; it never owns it. No scroll library, no `preventDefault`.
- **Real HTML over one canvas.** Text stays selectable, accessible and contrast-checkable. The canvas is decorative.
- **One loop.** A single `requestAnimationFrame` in `lib/signal.ts`. Everything else subscribes to it.
- **Numbers live in data.** Palette and depth in `lib/zones.ts`, all motion and shader values in `lib/tuning.ts`. Visual changes are data changes.
- **No invented content.** If a fact is not verified, the field is omitted rather than faked.

The result should feel physical: scroll velocity disturbs the water through an underdamped spring, the pointer does the same, and the light, particles and marine life fall away as depth increases.

---

## 3. Architecture at a Glance

```
scroll + pointer (passive)
        ↓
lib/signal.ts — one rAF loop
  springs · quality tier · zone · frame listeners
        ↓
OceanCanvas  → one WebGL draw (uniforms from zones/tuning)
FluidGlass   → bounded closing mark
DOM          → rounded CSS variables (no React state per frame)
```

**Render.** One fixed WebGL2 canvas behind the HTML: sky, waterline, waves, flow, foam, refraction, analytic caustics, seven sun shafts, specular, particles, fauna, vignette and grain. A hard budget of ≤ 12 noise taps per pixel; optional layers are gated per tier and have debug outputs that tests measure.

**Layout.** Sections are separated by 25 vh text-free gaps. `lib/zones.ts` interpolates palette, depth and effect weights; text colour is static CSS per zone, so contrast is provable instead of guessed.

**Performance.** Five quality tiers: full, reduced DPR, coarse/narrow, static reduced-motion, no canvas. Adaptive downshift is one-way, based on a rolling FPS window. Fallbacks keep all content and navigation: `?fx=off`, no WebGL2, context loss.

**UI.** One in-house CSS-first glass system (`lib/glass.ts` + `.glass` rules) for chrome, controls and surfaces. I rejected the ready-made liquid-glass libraries: they own a frame loop and a WebGL context, which breaks the one-loop rule. The replacement adds no canvas and mixes each zone's own colour, so it cannot lower contrast.

**Content and routes.** Verified copy from `CONTENT.md`; typed data; case-study route per project; `POST /api/contact` with Zod validation, honeypot, minimum-time check and an in-memory per-IP throttle; sitemap, robots, icon, OG image, Person JSON-LD.

**Accessibility.** Real text, skip link, visible focus, 24×24 targets, linked form errors, `aria-current`, decorative canvas hidden, reduced motion is a static frame.

---

## 4. The Agent System

**Problem.** I used several models, typically 3–6 in rotation, because of free-tier limits. Each has its own context, so without shared state agents duplicate work, re-decide settled questions and claim success they have not verified.

**Principle.** Project state lives in files, not in chat.

| File | Job |
| --- | --- |
| `AGENTS.md` | Entry point: read order, loop, non-negotiables, evidence rules, blocked procedure |
| `PROGRESS.md` | Task index; the first unchecked row is the next task |
| `phases/P0–P10.md` | Phase preambles (locked constraints, tiers, evidence) and one task per section |
| `SPEC.md` | Locked contract: C1–C8, stack, architecture rules, zone table, shader budget |
| `CONTENT.md` | Verified copy; owner-only gaps stay `[USER]` and are never rendered |
| `DECISIONS.md` | Append-only decisions with the rejected alternative (133 rows) |
| `skills/` | Task-scoped instructions: shader, contrast, glass, QA |
| `scripts/` | `gate.sh`, `next-task.sh`, `check-c5.sh`, `contrast.ts`, `check-content.ts` |

**The loop, every session.** Read `AGENTS.md` → run `next-task.sh` → read only the phase preamble, your task and the skills it names → announce the files → smallest diff → run the gate and the task's own checks → tick, log, commit `P<n>.<m>` → stop.

**Why it worked.** Any model could resume from the repo alone. Bad work was cheap to detect because "done" meant command output, not a claim. Decisions stayed traceable. And the next agent could not quietly change direction: the contract and the task index were files it had to read.

---

## 5. How I Prompted (Habits That Mattered)

1. **Write the contract before asking for code.** Constraints C1–C8 and the stack were locked before the first component. Prompts then enforce a spec instead of inventing one.
2. **One task per prompt.** One ID, one file list, one commit. Large asks produce large unreviewable diffs.
3. **Bound the reading.** "Read lines 1–93 and the task section; do not read the whole repo." Context bloat is where agents start improvising.
4. **Make "done" executable.** Every task named the commands and counts that prove it — not adjectives like "polished".
5. **Demand pasted output.** "It should work" is not evidence. File path + command + output is.
6. **Never weaken a check.** No skipped tests, no relaxed thresholds, no deleted assertions to get green. A red gate with an honest blocker beats a fake pass.
7. **Use placeholders, not guesses.** Missing facts became `[USER]` in `CONTENT.md`, and the field was omitted from the UI.
8. **Give a stop condition.** "If the same error fails three times, write the command and error under Blockers and stop." It kept agents from grinding or hiding failures.
9. **Split hard tasks.** `P10.1a/b/c` instead of one giant prompt; only the first runs per session.
10. **Keep decisions append-only.** Record the choice and why the alternative lost, so no agent re-opens it next session.
11. **Route by cost of error.** Cheap models for layout and transcription; strongest model for shaders and the ocean; a different model for review.
12. **Review the diff and the app myself.** I own content truth, architecture, deployment and final acceptance.

---

## 6. The Process, in Short

Three days, 78 commits, 63 recorded sessions, eight model labels, ten shipped phases (P0–P9) plus a planned P10.

- **P0** — scaffold, pinned stack, tokens, fonts, gate, Playwright. Gate before pixels.
- **P1** — verified content and every section/route, still static. No invented facts.
- **P2–P3** — the single loop, layout cache, zone model, ocean shader, waterline and depth.
- **P4–P5** — springs, pointer torch, dive line, project motion, case-study dive/ascent.
- **P6** — quality tiers, reduced motion, no-WebGL fallback, accessibility, C5/C6 tests, Lighthouse.
- **P8** — art overhaul: sky, surface, caustics, rays, particles, fauna, camera grade.
- **P9** — one glass system; rejected the library that owned a loop.
- **P7** — content closure, SEO surface, deploy attempt (blocked).
- **P10** — editorial redesign specified, not shipped.

The failures are the useful part. A bottom-left toggle broke the waterline constraint; a mobile grid overflow silently cancelled focus scrolling; a stale dev server hid whether the canvas mounted. Tests caught all three. The agent system did not prevent mistakes — it made them visible and handoff cheap.

---

## 7. Verification

```bash
npm run gate        # PASS typegen, typecheck, lint, build, c5-grep, contrast, content → GATE: PASS
npx playwright test # 131 passed, 1 skipped (132 checks, desktop + mobile)
```

The gate fails fast on a build error, a banned scroll/animation import, a contrast regression or an unresolved content slot. The browser suite proves the constraints (waterline at 30%, AA contrast on rendered pixels, no scroll hijack, reachability, focus and targets) plus 26 visual assertions with numbers — boundary 30.1%, near/far flow ratio 3.58, vignette 0.0588 under the 0.06 cap, static tier pixel-identical across frames.

Lighthouse, recorded with `?fx=off`: **100/100/100/100** on `/` and a case-study route. Treated as advisory.

Evidence rule: **A** items may be claimed only from pasted output; **U** items stay open for the owner. Screenshots are artefacts, never evidence.

---

## 8. Status and What's Next

Shipped and verified: the ocean experience, all sections and routes, contact flow, SEO surface, fallbacks, accessibility, glass UI, test suite, agent kit.

Open, deliberately:

- **Deployment refresh** — the existing Vercel build is stale (missing sitemap/robots/icon and JSON-LD); needs the owner's account. `npm run build` passes.
- **Real-hardware fps (C7, U)** — tiers and throttled rendering are tested; 60 fps on a mid-range laptop is not measurable headlessly.
- **P10 redesign** — planned, but two tasks need owner-only amendments to `AGENTS.md` and `SPEC.md`. I did not edit them; the blockers are recorded.
- **Contact throttle** — in-memory, per instance. Fine for a portfolio, not production anti-abuse.

---

## 9. Links

| Resource | Link |
| --- | --- |
| Repository | [github.com/samibyte/portfolio-samibyte](https://github.com/samibyte/portfolio-samibyte) |
| Live portfolio | [samibyte.vercel.app](https://samibyte.vercel.app) — earlier build; refresh pending |
| Contract and process | `AGENTS.md` · `SPEC.md` · `PROGRESS.md` · `DECISIONS.md` |
| Evidence | `qa/sessions.md` · `qa/REPORT.md` · `tests/` |

```bash
npm ci && npm run gate && npx playwright test && npm run dev
```

*Submitted 15 November 2026.*
