# PROGRESS

**Phase:** P3 · **Next:** P3.1

Machine-readable task list. `scripts/next-task.sh` reads the first unchecked line: `- [ ] <ID> <title>`.
Tick a box only when `npm run gate` printed `GATE: PASS` **and** the commit exists.
Do not renumber. Do not delete a row. Split a hard task into `<ID>a`, `<ID>b` and insert it directly below.
Detail for each ID lives in `phases/P<n>.md` under `## <ID> <title>` — if `next-task.sh` says the heading is missing, stop and report.

## P0 Scaffold
- [x] P0.1 Scaffold the app at the repo root
- [x] P0.2 Pin versions and scripts
- [x] P0.3 Gate scripts
- [x] P0.4 Git baseline
- [x] P0.5 Tokens, zones CSS, fallback gradient
- [x] P0.6 Fonts
- [x] P0.7 Playwright and pixel helper
- [x] P0.8 Env contract and README

## P1 Content and layout (no WebGL)
- [x] P1.1 `lib/types.ts`
- [x] P1.2 `lib/tuning.ts`
- [x] P1.3 `lib/zones.ts`
- [x] P1.4 `lib/content.ts`
- [x] P1.5 `lib/projects.ts`
- [x] P1.6 `lib/contact-schema.ts`
- [x] P1.7 `app/layout.tsx`
- [x] P1.8 Nav
- [x] P1.9 Hero
- [x] P1.10 Projects + ProjectCard (static)
- [x] P1.11 About
- [x] P1.12 Skills
- [x] P1.13 Contact + ContactForm
- [x] P1.14 `/api/contact`
- [x] P1.15 Case-study route
- [x] P1.16 OG image
- [x] P1.17 `scripts/check-content.ts`
- [x] P1.18 Home page composition

## P2 Signal, water, waterline
- [x] P2.1 `lib/layout.ts`
- [x] P2.2 `lib/signal.ts`
- [x] P2.3 OceanProvider
- [x] P2.4 OceanCanvas
- [x] P2.5 Shader core, flow, foam
- [x] P2.6 Uniform wiring
- [x] P2.7 Waterline and plunge
- [x] P2.8 Reduced motion and `?fx=off`
- [x] P2.9 C1 test

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
2026-11-13 | P0.5 | GATE: PASS (2 skipped) | P0.5 Tokens, zones CSS, fallback gradient | big-pickle
2026-11-13 | P0.6 | GATE: PASS (2 skipped) | P0.6 Fonts | big-pickle
2026-11-13 | P0.7 | GATE: PASS (2 skipped); shots 2 passed, 6 files | P0.7 Playwright and pixel helper | big-pickle
2026-11-13 | P0.8 | GATE: PASS (2 skipped); dev HTTP 200 | P0.8 Env contract and README | big-pickle
2026-11-14 | P1.1 | GATE: PASS (1 skipped) | P1.1 lib/types.ts | big-pickle
2026-11-14 | P1.2 | GATE: PASS (1 skipped) | P1.2 lib/tuning.ts | big-pickle
2026-11-14 | P1.3 | GATE: PASS | P1.3 lib/zones.ts | big-pickle
2026-11-14 | P1.4 | GATE: PASS; content 0 unresolved | P1.4 lib/content.ts | big-pickle
2026-11-14 | P1.5 | GATE: PASS | P1.5 lib/projects.ts | big-pickle
2026-11-14 | P1.6 | GATE: PASS; good:true bad:false | P1.6 lib/contact-schema.ts | big-pickle
2026-11-14 | P1.7 | GATE: PASS; skip link first Tab | P1.7 app/layout.tsx | big-pickle
2026-11-14 | P1.8 | GATE: PASS; desktop 6 links, mobile 2 taps | P1.8 Nav | big-pickle
2026-11-14 | P1.9 | GATE: PASS; boundary 30.00% / 29.98% | P1.9 Hero | big-pickle
2026-11-14 | P1.10 | GATE: PASS; 4 cards, 0 image requests | P1.10 Projects + ProjectCard (static) | big-pickle
2026-11-14 | P1.11 | GATE: PASS; 4 bio / 4 principles / 4 journey | P1.11 About | big-pickle
2026-11-14 | P1.12 | GATE: PASS; 5 groups, 29 data-skill items | P1.12 Skills | big-pickle
2026-11-14 | P1.13 | GATE: PASS; 3/labels linked; invalid 3×aria-invalid; 404→error status; 200 stub→success status | P1.13 Contact + ContactForm | big-pickle
2026-11-14 | P1.14 | GATE: PASS; no key 503; bad 400; honeypot/fast 200; valid+key 200 (Resend mocked); repeat 429 | P1.14 `/api/contact` | big-pickle
2026-11-14 | P1.15 | GATE: PASS; 4 static paths; nope 404; 5 zones in SPEC order; sticky 64→64; arch SVG 3 nodes/2 links | P1.15 Case-study route | big-pickle
2026-11-14 | P1.16 | GATE: PASS; /opengraph-image 200 image/png 1200x630 | P1.16 OG image | big-pickle
2026-11-14 | P1.17 | GATE: PASS; default 0/exit 0; strict [USER] exit 1; scripts/ ignored | P1.17 `scripts/check-content.ts` | big-pickle
2026-11-14 | P1.18 | GATE: PASS; 5 zones in order; 4 gaps 25vh/0 text; 1 main, no transform | P1.18 Home page composition | big-pickle
2026-11-14 | P2.1 | GATE: PASS; 5 sections measured | P2.1 lib/layout.ts | big-pickle
2026-11-14 | P2.2 | GATE: PASS; stepSpring pure verified (60fps 1.3755, 30fps 1.3707, settled 1.0000) | P2.2 lib/signal.ts | big-pickle
2026-11-14 | P2.3 | GATE: PASS; --vh set, loop running without canvas | P2.3 OceanProvider | big-pickle
2026-11-14 | P2.4 | GATE: PASS; canvas mounts, ?fx=off bails out, 0 errors | P2.4 OceanCanvas | big-pickle
2026-11-14 | P2.5 | GATE: PASS; shader core, flow, foam visible, 0 errors | P2.5 Shader core, flow, foam | big-pickle
2026-11-14 | P2.6 | GATE: PASS; continuous gradient surface to abyss verified | P2.6 Uniform wiring | big-pickle
2026-11-14 | P2.7 | GATE: PASS; waterline & plunge wired, context lifecycle fixed | P2.7 Waterline and plunge | flash
2026-11-14 | P2.8 | GATE: PASS; reduced motion static render, ?fx=off bailout, EffectsToggle stub | P2.8 Reduced motion and `?fx=off` | flash
2026-11-14 | P2.9 | GATE: PASS; npx playwright test tests/c1.spec.ts 4 passed (effects on & ?fx=off) | P2.9 C1 test | flash
