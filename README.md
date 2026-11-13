# Sami Adnan — Ocean Portfolio

Scroll-driven portfolio: one fixed WebGL canvas (OGL) behind real HTML, with depth as the navigation metaphor. Next.js 16 · TypeScript · Tailwind 4 · OGL · Zod · Resend.

**Status:** scaffold not started. Build is driven by agents, one task per session.

## Start here

```bash
bash scripts/next-task.sh   # what to do this session
npm run gate                # typegen → tsc → eslint → build → c5-grep → contrast → content
npm run dev                 # http://localhost:3000
```

## Map

| File | What it is |
|---|---|
| `AGENTS.md` | Entry point for every agent. Read first. |
| `PROGRESS.md` | Task list. The first unchecked box is the current task. |
| `phases/P0–P7.md` | Task detail. Read one section. |
| `SPEC.md` | Locked constraints, pinned versions, architecture, zones, shader. |
| `CONTENT.md` | Verified copy from the live site + `[USER]` slots. |
| `DECISIONS.md` | Append-only decision log. |
| `SETUP_GUIDE.md` | How to run the build with free / multiple models. |

Human setup lives in `SETUP_GUIDE.md` §2. Nothing is deployed yet.
