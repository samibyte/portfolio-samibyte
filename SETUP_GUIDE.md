# SETUP GUIDE — running this build with free models

The design principle: **state lives in files, not in chat.** `PROGRESS.md`, `DECISIONS.md` and git hold everything. Any model can pick up where another stopped, so you can switch models between tasks — and you should.

Written for a pipeline where 3–6 different models touch the repo over the build.

---

## 1. What is in the kit

| File | Purpose | Read when |
|---|---|---|
| `AGENTS.md` | Entry point: read order, loop, non-negotiables, blocker protocol | Every session, first |
| `PROGRESS.md` | Machine-readable task list. First unchecked line = the only task | Every session |
| `phases/P0–P7.md` | Task detail, one section per task ID | One section per session |
| `SPEC.md` | Constraints, versions, architecture, zones, shader, tuning, gotchas | Only when a task names a section |
| `CONTENT.md` | Verified copy + `[USER]` slots | P1.4, P1.5, P7.1 |
| `DECISIONS.md` | Append-only decision log. Prevents re-litigating | When deciding |
| `skills/*/SKILL.md` | Task runner, shader, contrast, QA gate | When a task names one |
| `scripts/gate.sh` | typegen → tsc → eslint → build → c5-grep → contrast → content. Fail-fast | After every task |
| `scripts/next-task.sh` | Prints the task, its phase file and its file list | Every session, first command |
| `scripts/check-c5.sh` | Bans scroll-hijack / second animation libraries (imports) | Gate + P6.6 |
| `scripts/contrast.ts` | WCAG 2.2 AA check for all five zones | Gate + P3.1 |
| `scripts/check-content.ts` | Blocks unresolved `[USER]` slots | Gate + P7.1 |
| `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/rules/ocean.mdc` | One-line pointers to `AGENTS.md` | Automatically |

A session reads about **2 KB** of instructions (`AGENTS.md` + one task + one skill), not the whole plan. That is the point: `AGENT_PLAN.md` alone used to be 22 KB, which is most of a small model's usable context before any code.

---

## 2. One-time setup (~5 minutes)

**Step 1 — scaffold in a temp dir, then copy in.** Do it yourself; interactive prompts are where agents get stuck. `create-next-app` refuses this repo because the kit's own files are not on its allowlist, so scaffold elsewhere and copy the generated project in:

```bash
cd ~/samibyte-portfolio          # the repo that already contains this kit
rm -rf /tmp/scaffold && mkdir -p /tmp/scaffold
npx create-next-app@latest /tmp/scaffold --ts --tailwind --eslint --app --no-src-dir \
  --import-alias "@/*" --use-npm --no-cache-components --no-agents-md \
  --no-react-compiler --no-agent-feedback --disable-git --yes
(cd /tmp/scaffold && tar --exclude=.git --exclude=README.md --exclude=node_modules --exclude=.next -cf - .) \
  | tar -xf - -C .
npm ci
```

Four flags are load-bearing:

- `--no-agents-md` — the default Next 16 template writes its own `AGENTS.md` and **would overwrite this kit's entry point**.
- `--no-cache-components` — keeps Next 16 caching semantics simple enough for a small model to reason about.
- `--no-react-compiler` — `--yes` otherwise reuses saved preferences and installs `babel-plugin-react-compiler`; this build does not use it.
- `--disable-git` — git is task P0.4, after the gate exists.

The `tar` step excludes the template `README.md` so the kit's stays. Never pass a project name that creates a nested folder (`/tmp/scaffold/ocean-portfolio`) — every path in `SPEC.md` would break. Check afterwards that `AGENTS.md`, `README.md` and `SPEC.md` are untouched (`git status` once P0.4 exists).

**Step 2 — make the scripts runnable and check the wiring.**

```bash
chmod +x scripts/gate.sh scripts/next-task.sh scripts/check-c5.sh
bash scripts/next-task.sh
```

It should print `TASK P0.1 … FILES …`. If it prints `DETAIL MISSING`, the kit is corrupted — stop and re-copy it instead of editing around it.

**Step 3 — wire your tool.** `AGENTS.md` is the de-facto standard and most tools read it automatically. Confirm against each tool's current docs, because these paths change.

| Tool | Instruction file | Skills |
|---|---|---|
| OpenCode / Codex / most 2026 agents | `AGENTS.md` (root, automatic) | `.opencode/skill/<name>/SKILL.md` or the tool's documented folder |
| Claude Code | `CLAUDE.md` (included) | copy `skills/` to `.claude/skills/` |
| Cursor | `.cursor/rules/ocean.mdc` (included) | reference `skills/` from the rule |
| VS Code Copilot | `.github/copilot-instructions.md` (included) | reference `skills/` from `AGENTS.md` |

**Step 4 — test the wiring.** New chat, first message:

> Run `bash scripts/next-task.sh` and paste the output. Then list the files you would touch. Do not edit anything.

If it names the right task, its file list is plausible, and it has not touched the repo: good. If it invents a task, your tool is not reading `AGENTS.md`.

---

## 3. The session loop

One task per session. New chat every time — long chats degrade small models faster than they help.

**Kickoff prompt:**

```
Follow AGENTS.md. Run bash scripts/next-task.sh, then do that one task.
Run npm run gate before ticking the box. Stop after one task.
```

**After each session (2 minutes, you are the QA gate):**

```bash
git log --oneline -3        # one commit, named P<n>.<m>
git show --stat HEAD        # only the files the task listed?
npm run gate                # PASS yourself; do not trust the report
npm run dev                 # look at it
```

Compare the diff to the task's `Files:`. A commit that touches files outside the task is the most common early-warning sign of a model going off-plan. Revert it with `git restore --staged --worktree .` and retry with a smaller task.

---

## 4. Extra prompts

**Recovery** (stuck, looping, or claiming success without output):

```
Stop. Do not edit. Paste the exact failing command and its first error line.
Then make the smallest fix and rerun npm run gate.
If it fails a third time on the same error, write it under Blockers in PROGRESS.md and stop.
```

**Plan first** (use for P2.4, P2.5, P3.2–P3.5, P6.2):

```
Before editing, list the files and the ordered steps. Wait for my OK. Change nothing yet.
```

**Cross-model review** (read-only, run with a *different* model than the one that wrote the commit — this catches more than any prompt tweak):

```
Review git show HEAD against SPEC.md §1 (C1–C8) and AGENTS.md.
List violations only, as file:line, and say which constraint.
Do not edit. If you find nothing, say "no violations" — do not invent issues.
```

**Handoff** (when a session must end early):

```
Do not commit a half-done task. Revert to HEAD, then write into PROGRESS.md
Blockers: what is done, what is not, the exact next command. Then stop.
```

---

## 5. Which model for which task

Free models differ much more in instruction-following than in raw coding. Route by failure cost.

| Tasks | Model quality | Why |
|---|---|---|
| P0, P1, P5 (mostly), P7.2 | any capable model | transcription and layout; the gate catches errors |
| P2.1–P2.3 | mid | the loop and layout cache are hard to retrofit |
| **P2.4, P2.5, P3.2–P3.5** | **strongest available** | GLSL and WebGL lifecycle; a weak model will burn 10 sessions here |
| P4.1, P6.1, P6.2 | strong | pure functions with unit tests — cheap to verify, expensive to get subtly wrong |
| P1.4, P1.5, P7.1 | human-assisted | facts and judgement; never let a model "fill in" a slot |
| P7.3, P7.4 | human | accounts, deploy, and the **U** report |

If the strongest model is rate-limited, spend it on P2.5. The shader is the only part where a wrong answer still *looks* finished.

---

## 6. What actually fails with free models, and the countermeasure

| Failure | Countermeasure already in the kit |
|---|---|
| Does 4 tasks in one session | `next-task.sh` prints one task; the kickoff prompt says stop; `git show --stat` is your check |
| Edits files outside the task | `Files:` on every task; commit review |
| Marks checks passed without running them | **A**/**U** split; gate output is the only accepted evidence |
| Describes a screenshot as proof | Explicitly forbidden; pixel helpers in `tests/helpers/pixels.ts` |
| Invents a metric to fill a gap | `[USER: …]` slot + `check-content.ts --strict` at P7 |
| Disables a test to get green | "Never weaken a check" in `AGENTS.md` + the recovery prompt |
| Re-reads the whole plan every turn | phase-split docs; 2 KB read budget |
| Drifts from the plan in a long chat | one task per chat, new chat each time |
| Loses the plot after a rate-limit restart | all state in `PROGRESS.md` + git |
| Re-litigates an old choice | `DECISIONS.md` is append-only |

---

## 7. Known gaps — check before launch

- `CONTENT.md` `[USER]` slots: final domain, resume hosting, per-project `role`/`architecture`/`decision`, and the skills the owner may not want to defend. P7.1 cannot be done by a model.
- Contact form rate limiting is in-memory and best-effort (D-014). It is not a real limiter on serverless. Acceptable for a portfolio; do not describe it as otherwise.
- `ogl` last published 2025-01; it is stable and pinned. Do not "upgrade" it.
- Lighthouse needs Chrome and Node ≥ 22.19. It is **not** part of `npm run gate` for that reason (D-126).
- `next/font/google` downloads at build time. On an offline build host, fall back to the system stack and log it.
- The **U** rows in `qa/REPORT.md` are the only thing standing between "the tests pass" and "it is actually good". Budget an hour for them.
