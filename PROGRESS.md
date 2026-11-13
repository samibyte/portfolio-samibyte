# PROGRESS

**Phase:** P0 · **Next:** P0.5

Machine-readable task list. `scripts/next-task.sh` reads the first unchecked line: `- [ ] <ID> <title>`.
Tick a box only when `npm run gate` printed `GATE: PASS` **and** the commit exists.
Do not renumber. Do not delete a row. Split a hard task into `<ID>a`, `<ID>b` and insert it directly below.
Detail for each ID lives in `phases/P<n>.md` under `## <ID> <title>` — if `next-task.sh` says the heading is missing, stop and report.

## P0 Scaffold
- [x] P0.1 Scaffold the app at the repo root
- [x] P0.2 Pin versions and scripts
- [x] P0.3 Gate scripts
- [x] P0.4 Git baseline
- [ ] P0.5 Tokens, zones CSS, fallback gradient
- [ ] P0.6 Fonts
- [ ] P0.7 Playwright and pixel helper
- [ ] P0.8 Env contract and README

## P1 Content and layout (no WebGL)
- [ ] P1.1 `lib/types.ts`
- [ ] P1.2 `lib/tuning.ts`
- [ ] P1.3 `lib/zones.ts`
- [ ] P1.4 `lib/content.ts`
- [ ] P1.5 `lib/projects.ts`
- [ ] P1.6 `lib/contact-schema.ts`
- [ ] P1.7 `app/layout.tsx`
- [ ] P1.8 Nav
- [ ] P1.9 Hero
- [ ] P1.10 Projects + ProjectCard (static)
- [ ] P1.11 About
- [ ] P1.12 Skills
- [ ] P1.13 Contact + ContactForm
- [ ] P1.14 `/api/contact`
- [ ] P1.15 Case-study route
- [ ] P1.16 OG image
- [ ] P1.17 `scripts/check-content.ts`
- [ ] P1.18 Home page composition

## P2 Signal, water, waterline
- [ ] P2.1 `lib/layout.ts`
- [ ] P2.2 `lib/signal.ts`
- [ ] P2.3 OceanProvider
- [ ] P2.4 OceanCanvas
- [ ] P2.5 Shader core, flow, foam
- [ ] P2.6 Uniform wiring
- [ ] P2.7 Waterline and plunge
- [ ] P2.8 Reduced motion and `?fx=off`
- [ ] P2.9 C1 test

## P3 Depth
- [ ] P3.1 Contrast script
- [ ] P3.2 Caustics and god rays
- [ ] P3.3 Marine snow
- [ ] P3.4 Abyss glow
- [ ] P3.5 Plunge bubbles
- [ ] P3.6 Depth verification
- [ ] P3.7 Zone text polish

## P4 Physics and interaction
- [ ] P4.1 Spring unit test
- [ ] P4.2 Turbulence
- [ ] P4.3 Pointer

## P5 Content blending
- [ ] P5.1 BuoyChip
- [ ] P5.2 ProjectCard motion
- [ ] P5.3 Skills torch
- [ ] P5.4 DiveLine
- [ ] P5.5 Case-study dive and ascent

## P6 Performance, fallback, accessibility
- [ ] P6.1 Quality tiers
- [ ] P6.2 Adaptive quality
- [ ] P6.3 Effects toggle
- [ ] P6.4 No-WebGL fallback
- [ ] P6.5 Accessibility pass
- [ ] P6.6 C5 and C6 tests
- [ ] P6.7 Lighthouse

## P7 Launch
- [ ] P7.1 Resolve content slots
- [ ] P7.2 SEO surface
- [ ] P7.3 Deploy
- [ ] P7.4 Evidence report
- [ ] P7.5 Final gate

## Blockers
None.

## Session log
<!-- one line per session: date | task | gate | commit | model -->
2026-11-13 | P0.2 | GATE: PASS (2 skipped) | P0.2 Pin versions and scripts | big-pickle
2026-11-13 | P0.3 | GATE: PASS (2 skipped) | P0.3 Gate scripts | big-pickle
2026-11-13 | P0.4 | GATE: PASS (2 skipped) | P0.4 Git baseline | big-pickle
