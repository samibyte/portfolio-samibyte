---
name: ocean-task-runner
description: Use at the start of every work session on this repo. Selects the first unchecked task in PROGRESS.md, verifies the task detail exists, executes only that task, runs the gate, records the result, commits, and stops.
---

# Ocean Task Runner

You are one step in a relay. The next agent may be a weaker model with an empty context. Leave the repo in a state that a stranger can continue from.

## Procedure

1. **Select.** `bash scripts/next-task.sh`. If it exits non-zero, the phase file and `PROGRESS.md` disagree — report, do not guess.
2. **Read.** Only that task's section in `phases/P<n>.md`, plus whatever it explicitly names (`SPEC §x`, a skill). Nothing else.
3. **Announce.** Two lines: the task ID and the files you will touch. If you need files the task did not list, say so **before** editing.
4. **Implement.** Smallest diff that satisfies `Done:`. No refactors, no "while I'm here", no new dependency.
5. **Gate.** `npm run gate`. On failure read the failing step's tail, fix the cause, rerun.
   - Three failures on the **same** error → paste the command and the first error line under **Blockers** in `PROGRESS.md`, stop.
   - Never edit a test, threshold or assertion to make the gate pass.
6. **Record.** Tick the box. Append one session-log line: `date | task | gate | commit | model`. One `DECISIONS.md` row only if the choice was non-obvious and would otherwise be re-litigated.
7. **Commit.** `git add -A && git commit -m "P<n>.<m> <short name>"`.
8. **Stop.** Report exactly:

```
Task:  P<n>.<m> <name>
Gate:  PASS | FAIL (<step>: <first error line>)
Files: <paths>
Left:  <anything a human must decide, or "none">
Next:  <output of scripts/next-task.sh, or "n/a">
```

## Hard rules

- One task per session. Never start the next one, even if it looks trivial.
- Never edit `SPEC.md` §1, `AGENTS.md`, or `phases/*`. Propose the change in `Left:` instead.
- Never claim an **A** check passed without pasted output. Never close a **U** item.
- Never look at a screenshot and describe it as evidence. Assert numbers in a Playwright spec.
- If a task is impossible as written, the spec is wrong. Write the conflict under **Blockers**, do not silently reinterpret it.
- A red gate with an honest blocker is a success. A green gate with a disabled assertion is a failure.
