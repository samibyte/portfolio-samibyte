# AGENTS.md

Entry point for every coding agent. You are one of several agents working on this repo in sequence. State lives in files, not in chat: `PROGRESS.md` + git are the handover. Assume the previous session was a weaker model and the next one knows nothing.

## Read order — and stop there

1. This file.
2. `PROGRESS.md` — the first unchecked task is your only task.
3. `phases/P<n>.md` — only the section for that task ID.
4. If the task names a skill, read `skills/<name>/SKILL.md`.
5. `SPEC.md` — only when a task points at a section (e.g. "SPEC §6").

Do not read the whole repo. Do not read other phases. Do not read `qa/`, git history or old screenshots.

## The loop (one task per session)

1. `bash scripts/next-task.sh` → task ID, phase file, expected files.
2. Announce: task ID, and the files you will touch. If you need more than the listed files, stop and say so before editing.
3. Make the smallest change that satisfies the task. Touch nothing else.
4. `npm run gate`. Fix and rerun. Never report a pass the gate did not print.
5. Tick the box in `PROGRESS.md`, add one `DECISIONS.md` row if you made a non-obvious choice, commit `P<n>.<m> <short name>`.
6. Stop. Do not start the next task.

Total budget per session: **one task, one commit, under 20 files**. If a task needs more, split it into `P<n>.<m>a/b/c` rows in `PROGRESS.md` and do only the first.

## Non-negotiables

- `SPEC.md` §1 (C1–C8) is locked. Never edit it. If a task appears to require breaking a constraint, stop — that is a spec bug, not a permission slip.
- Never invent a fact, number, date, employer, metric, technology or URL. Copy from `CONTENT.md`. Unconfirmed → `[USER: …]` in `CONTENT.md` and the field is omitted from the data file.
- Native scroll only. No scroll library, no `preventDefault` on wheel/touch, no `transform` on `<main>` (C5).
- One `requestAnimationFrame` loop, in `lib/signal.ts`. No second loop anywhere.
- No `setState` per frame. No `getComputedStyle` during render.
- Numbers live only in `lib/tuning.ts` and `lib/zones.ts`.
- No new dependency. If one is genuinely required: write it under **Blockers** in `PROGRESS.md` and stop.
- Never weaken a check to make it pass. Never change a threshold, skip a test, or delete an assertion.
- Never edit `SPEC.md`, `AGENTS.md`, or a `phases/*` file. Propose the change in your report instead.

## Evidence rules

Every constraint row in `SPEC.md` §1 is tagged **A** (an agent can prove it from output) or **U** (owner only).

- You may only claim **A** items, and only from command output you pasted.
- **U** items go in `qa/REPORT.md` as `OPEN`. You never close them.
- **Never judge a screenshot by looking at it.** You are a text model in a pipeline; visual claims are worthless. Use the pixel helpers in `tests/helpers/pixels.ts` and assert numbers.
- "It should work" and "I verified it" are not evidence. File path + command + output is.

## Commands

```bash
npm run dev                  # http://localhost:3000
npm run gate                 # typegen → tsc → eslint → build → c5-grep → contrast → content. Fail-fast.
STRICT=1 npm run gate        # + fails on any [USER] left in shipped code (P7 only)
npx playwright test          # A-checks (c1–c7) + screenshots
npx playwright test tests/c4.spec.ts   # one spec
npm run lh                   # Lighthouse, advisory, P6+ only
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
