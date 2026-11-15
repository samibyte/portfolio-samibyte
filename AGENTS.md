# AGENTS.md

Entry point for every coding agent. You are one of several agents working on this repo in sequence. State lives in files, not in chat: `PROGRESS.md` + git are the handover. Assume the previous session was a weaker model and the next one knows nothing.

## Read order — and stop there

1. This file.
2. `bash scripts/next-task.sh`. Do not open `PROGRESS.md`; it is a task index, not reading material.
3. `phases/P<n>.md`: read **everything above your task's heading**, then your `## <ID>` section. That preamble — locked constraints, look, tiers, evidence, stop conditions — is binding for every task in the phase.
4. Read `skills/<name>/SKILL.md` when the task names it, or when you touch its trigger:
   - `components/ocean/**` or the loop in `lib/signal.ts` → `skills/ocean-shader/SKILL.md`
   - any colour, text, focus or motion change → `skills/ocean-a11y-contrast/SKILL.md`
   - `lib/glass.ts`, the "Glass UI" block in `app/globals.css`, or any `components/ui|sections|form|casestudy` surface → `skills/glass-ui/SKILL.md`
   - `qa/REPORT.md`, or a phase exit → `skills/ocean-qa-gate/SKILL.md`
5. `SPEC.md`: only the sections the phase or task names. `DECISIONS.md`: only via `grep -n "<topic>" DECISIONS.md`. Never read either whole.

Do not read the whole repo, other phases, `qa/screens/`, `qa/lh/`, old reports or git history.

## The loop (one task per session)

1. `bash scripts/next-task.sh` → task ID, phase file, read range, files.
2. Announce: task ID, and the files you will touch. If you need more than the listed files, stop and say so before editing.
3. Make the smallest change that satisfies the task's **Done**. Touch nothing else.
4. `npm run gate`. It is necessary, not sufficient: also run the commands the task's **Done** names (usually `npx playwright test tests/<spec>.ts`) and paste the counts. Fix and rerun. Never report a pass the gate did not print.
5. Tick the box in `PROGRESS.md`, append one line to `qa/sessions.md` (`date | task | gate | checks | commit | model`), add one `DECISIONS.md` row if the choice was non-obvious, commit `P<n>.<m> <short name>`.
6. Stop. Do not start the next task.

Total budget per session: **one task, one commit, under 20 files**. If a task needs more, split it into `P<n>.<m>a/b/c` rows in `PROGRESS.md` and do only the first.

Report exactly:

```
Task:   P<n>.<m> <name>
Gate:   PASS | FAIL (<step>: <first error line>)
Checks: <spec>: <passed>/<total>, <skips>
Files:  <paths>
Left:   <anything a human must decide, or "none">
Next:   <output of scripts/next-task.sh, or "n/a">
```

## Non-negotiables

- `SPEC.md` §1 (C1–C8) is locked. Never edit it. If a task appears to require breaking a constraint, stop — that is a spec bug, not a permission slip.
- Never invent a fact, number, date, employer, metric, technology or URL. Copy from `CONTENT.md`. Unconfirmed → `[USER: …]` in `CONTENT.md` and the field is omitted from the data file.
- Native scroll only. No scroll library, no `preventDefault` on wheel/touch, no `transform` on `<main>` (C5).
- One `requestAnimationFrame` loop, in `lib/signal.ts`. No second loop anywhere. Glass UI motion is CSS only; it never starts a loop.
- No `setState` per frame. No `getComputedStyle` during render.
- Tunable numbers live in `lib/tuning.ts` and `lib/zones.ts`. GLSL literals are `0`/`1` or named geometric constants listed in the phase's tap-budget comment.
- No new dependency. If one is genuinely required: write it under **Blockers** in `PROGRESS.md` and stop. A UI library that owns a `requestAnimationFrame` loop or a WebGL context (`@liquefy-ui/*`, `liquid-glass-js`, `three`, `@react-three/fiber`, `framer-motion`, `motion`) is not "genuinely required": use `lib/glass.ts` (D-202).
- Never weaken a check to make it pass. Never change a threshold, skip a test, or delete an assertion.
- Never edit `SPEC.md`, `AGENTS.md`, or a `phases/*` file. Propose the change in your report instead.

## UI: one glass system

Chrome, controls, fields, chips and instrument plates use `lib/glass.ts` + the `.glass` rules in `app/globals.css`. Prose and display type sit directly on the water: no card fill, border or shadow around body copy, journey, project content or skill text. Read `skills/glass-ui/SKILL.md` before changing a surface. The owner made this the house style on 2026-11-15 (D-202), narrowed on 2026-11-16 (D-208).

- `glass({ variant, tone, interactive, className })` is the only way to style a chrome element, control, chip, field or instrument plate. Do not hand-roll `rounded-* border ... bg-*` for a panel, bar, card, control, chip or field.
- Glass is **CSS-first**: `color-mix`, gradients, inset highlights, state transitions. No canvas, no WebGL context, no JS animation loop, no dependency.
- The only glass renderer is the bounded `FluidGlass` mark, which subscribes to `onFrame` in `lib/signal.ts`. Keep it that way.
- `variant` is the shape: `panel`, `bar`, `card`, `control`, `chip`, `field`. `tone` is the fill: `clear`/`regular`/`strong` (zone-aware), `solid` (`--text` fill), `chrome` (fixed dark `--panel`).
- Text stays `var(--text)`. Zone-aware tones mix from the zone's own `--bg-top`, so the fill moves away from the text and cannot lower contrast. Never put body copy on a blurred backdrop.
- `prefers-reduced-motion` makes every glass transition static. Do not add a continuous CSS animation to a surface; continuous liquid motion belongs to `FluidGlass`.
- The evidence is `tests/c4.spec.ts` (text contrast), `tests/c5.spec.ts` (no extra ocean canvas, no scroll hijack) and `tests/c6.spec.ts` (targets/focus). Do not add a test that only asserts a class name.

## Evidence rules

Every constraint row in `SPEC.md` §1 is tagged **A** (an agent can prove it from output) or **U** (owner only).

- You may only claim **A** items, and only from command output you pasted.
- **U** items go in `qa/REPORT.md` as `OPEN`. You never close them.
- **Never read a screenshot or an old report as evidence.** Use the pixel helpers in `tests/helpers/pixels.ts` and assert numbers.
- "It should work" and "I verified it" are not evidence. File path + command + output is.

`qa/` is write-only for you: you may rewrite `qa/REPORT.md` and append to `qa/sessions.md`; do not read `qa/screens/`, `qa/lh/` or a previous report.

## Commands

```bash
npm run dev                  # http://localhost:3000
npm run gate                 # typegen → tsc → eslint → build → c5-grep → contrast → content. Fail-fast.
STRICT=1 npm run gate        # + fails on any [USER] left in shipped code (P7 only)
npx playwright test          # A-checks c1–c7 + look + shots; builds and starts the app
npx playwright test tests/c4.spec.ts   # one spec
npm run shot                 # screenshots only → qa/screens/ (gitignored)
npm run lh                   # Lighthouse, advisory, P7 only
npx tsx scripts/contrast.ts  # palette only
bash scripts/next-task.sh    # what to do next
```

`npm run gate` writes `qa/gate.log`. If it fails, read the failing step's tail — not the whole log.

## Tools without a terminal

If you cannot run shell commands, you cannot close a task. Produce the diff as a patch in your reply, say `GATE: NOT RUN`, and do not tick the box. A human or the next agent applies it.

## Blocked? Follow this exactly

| Situation | Action |
|---|---|
| Gate fails 3× on the **same** error | Write the exact command + first error line under **Blockers** in `PROGRESS.md`, stop. |
| A required fact, asset or URL is missing | `[USER: …]` in `CONTENT.md`, omit the field, continue with the rest of the task. Only stop if the task is impossible without it. |
| The spec contradicts itself or the environment | Write one `DECISIONS.md` row with the conflict and the reading you chose, continue. |
| A task requires breaking C1–C8 | Stop. Write it under **Blockers**. Do not implement it. |
| Your tool cannot do the task (no shell, no file write) | Say so, output a patch, stop. |

Never invent a workaround that hides a failure. A red gate with an honest blocker is worth more than a green gate with a disabled test.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
