# Sami Adnan — Ocean Portfolio

Scroll-driven portfolio: one fixed WebGL canvas (OGL) behind real HTML, with depth as the navigation metaphor. Next.js 16 · TypeScript · Tailwind 4 · OGL · Zod · Resend.

Build state lives in `PROGRESS.md`; the first unchecked task is the current task. Agents read [`AGENTS.md`](AGENTS.md) first.

## Run

```bash
npm ci
cp .env.example .env.local   # fill in the values you have
npm run dev                  # http://localhost:3000
```

## Gate

```bash
npm run gate        # typegen → tsc → eslint → build → c5-grep → contrast → content
npx playwright test # A-checks
```

`npm run gate` writes `qa/gate.log` and fails fast. See [`AGENTS.md`](AGENTS.md) for the rules; `SPEC.md`, `phases/`, `DECISIONS.md` and `CONTENT.md` hold the detail.
