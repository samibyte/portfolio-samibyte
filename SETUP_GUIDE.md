# SETUP GUIDE — owner operations

The design principle: **state lives in files, not in chat.** Any model can pick up where another stopped, so you can switch models between tasks.

This file is for the owner. Agents read `AGENTS.md`, one phase preamble, one task section, and at most one skill. The old bootstrap recipe for P0 is in git history; it is not needed again.

## Where state lives

| File | Purpose | Read by |
|---|---|---|
| `AGENTS.md` | Entry point: read order, loop, non-negotiables, evidence, blockers | Every agent, first |
| `PROGRESS.md` | Live task index. First unchecked line = the only task | `next-task.sh` only |
| `docs/PROGRESS-archive.md` | Completed P0–P6 rows | Nobody, unless auditing |
| `phases/P8.md`, `phases/P7.md` | Phase preamble (binding) + one section per task | One phase per session |
| `SPEC.md` | Locked constraints §1, stack, architecture, zones, shader, tuning | Only sections a task names |
| `CONTENT.md` | Verified copy + `[USER]` slots | P7.1 only |
| `DECISIONS.md` | Append-only decision log | `grep`, never whole |
| `qa/sessions.md` | One line per session | Owner |
| `qa/REPORT.md` | A/U evidence, U items stay `OPEN` | P7.4, P8.7 |
| `skills/*/SKILL.md` | Shader mechanics, a11y/contrast, QA gate | When the task or file path triggers one |

Tool wiring is already in place: `AGENTS.md` (automatic for most tools), `CLAUDE.md`, `.cursor/rules/ocean.mdc`, `.github/copilot-instructions.md`. The skills in `skills/` are plain files read by path — they are **not** registered in `.opencode/` or `.claude/`. If your tool wants a skills folder, copy or link them; do not maintain a second copy.

## After each agent session (2 minutes)

```bash
git log --oneline -3        # one commit, named P<n>.<m>
git show --stat HEAD        # only the files the task listed?
npm run gate                # PASS yourself; do not trust the report
npx playwright test         # the task's checks, if it named any
```

Compare the diff to the task's `Files:`. A commit that touches files outside the task is the most common early-warning sign of a model going off-plan. Revert it and retry with a smaller task.

## Prompts

**Kickoff:**

```
Follow AGENTS.md. Run bash scripts/next-task.sh, read the phase preamble it
prints, then do that one task. Run the task's Done checks and npm run gate
before ticking the box. Stop after one task.
```

**Recovery** (stuck, looping, or claiming success without output):

```
Stop. Do not edit. Paste the exact failing command and its first error line.
Then make the smallest fix and rerun npm run gate.
If it fails a third time on the same error, write it under Blockers in PROGRESS.md and stop.
```

**Cross-model review** (read-only, with a different model than the one that wrote the commit):

```
Review git show HEAD against SPEC.md §1 (C1–C8) and AGENTS.md.
List violations only, as file:line, and say which constraint.
Do not edit. If you find nothing, say "no violations" — do not invent issues.
```

**Handoff** (session must end early):

```
Do not commit a half-done task. Revert to HEAD, then write into PROGRESS.md
Blockers: what is done, what is not, the exact next command. Then stop.
```

## Model routing for what is left

| Tasks | Model quality | Why |
|---|---|---|
| P8.0–P8.1, P8.7, P7.2 | any capable model | harness, tokens, evidence, metadata |
| **P8.2–P8.6** | **strongest available** | GLSL, the waterline mask, the 11-tap budget, tier cuts — a weak model burns sessions here |
| P7.1 | human-assisted | facts and judgement; never let a model fill a slot |
| P7.3, P7.4 | human | accounts, deploy, the **U** report |

If the strongest model is rate-limited, spend it on P8.2 and P8.3.

## Known gaps — check before launch

- `CONTENT.md` still has 5 `[USER]` slots (domain, resume URL, per-project architecture, stack items to drop). P7.1 cannot be done by a model.
- Contact rate limiting is in-memory and best-effort (D-014). Not a real limiter on serverless; do not describe it as one.
- Lighthouse needs Chrome and Node ≥ 22.19. It is advisory and never part of `npm run gate` (D-194).
- `next/font/google` downloads at build time. On an offline build host, fall back to the system stack and log it.
- The **U** rows in `qa/REPORT.md` are the only thing between "the tests pass" and "it is actually good". Budget an hour for them.
- P8 changes the palette and the shader mask semantics. `SPEC.md` §5/§6/§7 still describe the pre-P8 ocean until the owner updates them after P8.1; D-195 records that the P8 phase wins meanwhile.
