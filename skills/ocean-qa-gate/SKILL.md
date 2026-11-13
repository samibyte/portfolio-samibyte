---
name: ocean-qa-gate
description: Use before closing a phase and for all P6–P7 work. Runs the full gate, captures screenshots, and writes qa/REPORT.md with one evidence row per locked constraint, separating agent-provable A checks from owner-only U checks.
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

1. **Static gate.** `npm run gate`. Every step prints `PASS`.
2. **Screenshots.** `npx playwright test tests/shots.spec.ts` → `qa/screens/` at scroll 0/50/100%, desktop and mobile. Screenshots are **owner evidence**, not agent evidence. Do not describe them.
3. **Assertions.** Run `npx playwright test`. C1, C2, C3, C4, C5, C6, C7 must pass. A skipped test counts as a failure.
4. **Lighthouse (P6+).** `npm run lh` on `?fx=off` URLs. Record the numbers. If Chrome is unavailable, write `BLOCKED (no Chrome)` — do not remove the step from the gate, it was never in the gate.
5. **Report.** Rewrite `qa/REPORT.md`:

```md
# QA report — <date> — commit <sha>

| ID | Constraint | Evidence | Result |
|----|-----------|----------|--------|
| C1 | 70/30 hero | tests/c1.spec.ts (boundary 29.8%) | PASS |
| C7 | 60 fps | — | **U** OPEN |

## Lighthouse (`?fx=off`)
| URL | Perf | A11y | BP | SEO |

## Owner items (U)
- [ ] 60 fps on your laptop, 4× CPU throttle holds ≥ 30 fps
- [ ] Real phone, mid-range, scroll the whole page
- [ ] Confirm every `[USER]` in CONTENT.md

## Open items
- none | <what is still unresolved and who owns it>
```

## Rules

- Missing file = `FAIL`, not "skipped".
- Borderline = `NEEDS REVIEW`. Say so; do not round up.
- Never edit a constraint, a threshold or a test to make a row pass.
- Never commit scratch screenshots. Only `qa/screens/` and `qa/REPORT.md`.
- If two constraints conflict, stop and report — that is a spec bug, and `SPEC.md` §1 wins until the owner changes it.
