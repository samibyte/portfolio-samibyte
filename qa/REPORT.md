# QA REPORT — Sami Adnan · Ocean Portfolio

Evidence for anything an agent cannot close by itself. Owner-only **U** rows live
here as `OPEN` until the owner closes them. Generated per task; not a changelog.

## Lighthouse (P6.7) — 2026-11-14 14:20 UTC-ish (Asia/Dhaka machine)

Command: `npm run lh` → `lhci autorun` (config: `lighthouserc.json`; Lighthouse
13.6.0, `@lhci/cli` 0.16.1, Google Chrome 157.0.8103.78; `?fx=off`; default
mobile form factor; `numberOfRuns: 1`; server: `npm run start` after
`npm run build`).

Gate thresholds (SPEC §P6 exit / phases P6.7): Performance ≥ 90 · Accessibility
≥ 95 · Best Practices ≥ 95 · SEO ≥ 95 — set as lhci `error` assertions in
`lighthouserc.json`. Lighthouse is **advisory** (D-126); it is deliberately not
part of `npm run gate`. The Playwright suite is the gate.

| URL | Performance | Accessibility | Best Practices | SEO |
|-----|-------------|---------------|----------------|-----|
| `/?fx=off` | 100 | 100 | 100 | 100 |
| `/projects/stitchlogic?fx=off` | 100 | 100 | 100 | 100 |

Raw reports: `qa/lh/localhost--2026_11_14_14_20_52.report.html` / `.report.json`
and `qa/lh/localhost-projects_stitchlogic-2026_11_14_14_21_03.report.html` /
`.report.json` (+ `qa/lh/manifest.json`). `lhci` exited 0 with all assertions
met.

### Informational only (never a gate)

Canvas-on run, `/` (same build, same Chrome, `numberOfRuns: 1`): Performance
100 · Accessibility 100 · Best Practices 100 · SEO 100. Recorded for reference
only; `?fx=off` is the Lighthouse profile this project gates on, and neither
canvas-on results nor repeated runs can block or close any task.

## Open (owner only — never closed by an agent)

| Item | SPEC | Status |
|------|------|--------|
| Real-hardware fps on a mid-range laptop (C7) | SPEC §1 (C7, **U**) | **OPEN** — needs the owner on real hardware |
| Ocean look: “beautiful/realistic” and the hero reading as water in front of the viewer (P8 goal) | P8 preamble (**U**) | **OPEN** — owner review of the refreshed `qa/screens/` set; an agent may not claim aesthetics |
| SPEC §5 palette text after the P8 retune | SPEC §5 (**U**) | **OPEN** — owner decision; `lib/zones.ts` is canonical until then |
