---
name: ocean-qa-gate
description: Use before closing a task or phase, and for all P7–P8 evidence work. Runs the static gate and the task's Playwright checks, captures screenshots, and writes qa/REPORT.md with one evidence row per locked constraint, separating agent-provable A checks from owner-only U checks.
---

# Ocean QA Gate

A constraint is closed by an **artifact plus a number**, never by reading the code and agreeing with yourself.

## A vs U

| Tag | Who | Evidence |
|---|---|---|
| **A** | any agent | a command whose output you pasted, or a Playwright assertion that passed |
| **U** | owner only | a human looked at real hardware, or confirmed a fact |

You may write `PASS` for **A** only. Every **U** row goes into `qa/REPORT.md` as `OPEN`, with one sentence saying exactly what to check. You never close a **U** row, even if the code "obviously" works.

## Procedure

1. **Task checks.** Run the commands the task's **Done** names, usually one of:
   ```bash
   npx playwright test tests/c1.spec.ts tests/c2.spec.ts
   npx playwright test tests/c4.spec.ts
   npx playwright test tests/look.spec.ts
   npm run shot            # 8 PNGs → qa/screens/ (gitignored)
   ```
   Paste the pass/skip counts. A green static gate is not a green task.
2. **Static gate.** `npm run gate`. Every step prints `PASS`.
3. **Phase exit.** `npx playwright test` (c1–c7 + look + shots). The phase file lists the exact specs and screenshots it requires.
   - **Skips:** a skip that the phase or the test declares for a project (e.g. c7 on mobile) is expected — report it as `N skipped`. An **unexpected** skip is a failure. A skip never counts as a pass.
4. **Screenshots.** `npm run shot` → `qa/screens/`. Screenshots are **owner evidence**, not agent evidence. Do not describe them.
5. **Lighthouse (P7 only).** `npm run lh` on `?fx=off` URLs. Advisory (D-194), never part of `npm run gate`. If Chrome is unavailable, write `BLOCKED (no Chrome)`; do not remove the step.
6. **Report.** Rewrite `qa/REPORT.md`:

```md
# QA report — <date> — commit <sha>

| ID | Constraint | Evidence | Result |
|----|-----------|----------|--------|
| C1 | 70/30 hero | tests/c1.spec.ts (boundary 29.8%) | PASS |
| C7 | 60 fps | — | **U** OPEN |
| C8 | No invented fact | content --strict: 0 slots | PASS |

## Playwright
| Spec | Passed | Skipped | Result |

## Lighthouse (`?fx=off`)
| URL | Perf | A11y | BP | SEO |

## Owner items (U)
- [ ] 60 fps on your laptop, 4× CPU throttle holds ≥ 30 fps
- [ ] Real phone, mid-range, scroll the whole page
- [ ] Visual review of qa/screens/ (P8 beauty/realism)
- [ ] Confirm every `[USER]` in CONTENT.md

## Open items
- none | <what is still unresolved and who owns it>
```

## Rules

- Missing file = `FAIL`, not "skipped".
- Borderline = `NEEDS REVIEW`. Say so; do not round up.
- Never edit a constraint, a threshold or a test to make a row pass.
- Never commit screenshots or `qa/gate.log`; both are gitignored. Only `qa/REPORT.md`, `qa/sessions.md` and the `qa/lh/` reports are committed.
- If two constraints conflict, stop and report — that is a spec bug, and `SPEC.md` §1 wins until the owner changes it.
