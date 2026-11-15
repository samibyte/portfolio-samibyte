# QA REPORT — 2026-11-15 — commit 52c4586 (P8.6; P8.7 adds no code change)

Evidence for anything an agent cannot close by itself. Owner-only **U** rows live
here as `OPEN` until the owner closes them. Generated per task; not a changelog.

## P8.7 — Final evidence pass

All five evidence commands run against commit `52c4586` (P8.6; P8.7 is evidence-only, no code change).

### `npx tsx scripts/contrast.ts`

```
PASS surface   #80b8e0 8.50 ok | #35afa7 6.77 ok | accent 1.01 (warn, decorative)
PASS sunlight  #35afa7 6.77 ok | #2e9e98 5.58 ok | accent 1.44 (warn, decorative)
PASS twilight  #143854 9.85 (lift 5.80) ok | #0d2238 13.02 (lift 6.78) ok | accent 1.95 (warn, decorative)
PASS midnight  #0a1628 11.52 (lift 5.66) ok | #060d19 12.36 (lift 5.85) ok | accent 1.62 (warn, decorative)
PASS abyss     #050d1a 10.72 (lift 5.08) ok | #020408 11.30 (lift 5.20) ok
All zones pass. Tightest body pair: abyss 5.08
```

Exit 0.

### `npm run gate`

```
PASS typegen
PASS typecheck
PASS lint
PASS build
PASS c5-grep
PASS contrast
PASS content
GATE: PASS
```

### `npx playwright test tests/c1.spec.ts tests/c2.spec.ts tests/c4.spec.ts tests/c5.spec.ts tests/c7.spec.ts`

73 passed, 1 skipped (c7 CPU-throttle on mobile — expected, declared by test).

### `npx playwright test tests/look.spec.ts`

26 passed, 0 skipped.

Key measurements:
- Fallback split step: 0.1005 desktop / 0.0958 mobile (≥ 0.05 ✓)
- Mean boundary: 30.054% desktop / 30.217% mobile (30% ± 0.5% ✓)
- Foam edge step 0.4776 desktop / 0.3533 mobile; runner-up 0.0701 / 0.0578 (≤ 2/3 ✓)
- Surface band luma 0.4475 vs near-field 0.4119 (Δ 0.0356 ≥ 0.02 ✓)
- Depth light: top-half 0.4509 vs bottom-half 0.1722 (Δ 0.2787 ≥ 0.02 ✓)
- Foreground flow ratio: 3.464 desktop / 3.534 mobile (≥ 1.5 ✓)
- Debug 13 (caustics) @ 15% scroll: 0.9956 > 0 ✓; @ 100%: 0.0005 ≤ 0.0013 ✓
- Debug 14 (rays) @ 15%: 0.1002 desktop / 0.1319 mobile > 0 ✓; @ 100%: 0.0005 ≤ 0.0013 ✓
- Debug 15 (particles): tier-0 0.0592 desktop / 0.0160 mobile; tier-1 ratio 0.5960 / 0.5653 (0.35–0.65× ✓); abyss 0.0000 ✓
- Debug 16 (fauna): tier-0 0.0451 desktop / 0.0129 mobile > 0 ✓; tier-1 0.0000 ✓; abyss 0.0000 ✓
- Debug 17 (grade): corner Δ 0.1375 desktop / 0.0952 mobile ≥ 0.02 ✓; grain Δ 0.0045/0.0056 ≤ 0.01 ✓; corner mean 0.0343 max 0.0588 ≤ 0.06 ✓; tier-1 covTier0=0.0088, covTier1=0.0000 ✓
- Tier-3 static: changed pixel ratio after 600 ms = 0 ✓

### `npx playwright test tests/shots.spec.ts`

2 passed, 0 skipped. 8 PNGs saved to `qa/screens/` (gitignored).

---

## Constraint table

| ID | Constraint | Evidence | Result |
|----|-----------|----------|--------|
| C1 | 70/30 split; mask from undisplaced vUv; ±0.024 envelope | tests/c1.spec.ts 4/4; look.spec boundary 30.054%/30.217% | **PASS** |
| C2 | Abyss luma < 0.05; mean B > mean R; no near particles/fauna | tests/c2.spec.ts 2/2; debug 15/16 covAbyss=0.0000 | **PASS** |
| C3 | Springs untouched | No change to lib/signal.ts spring constants | **PASS** |
| C4 | WCAG 2.2 AA contrast; additive lift ≤ 0.06 | contrast.ts exit 0 (tightest 5.08); tests/c4.spec.ts 2/2; debug 17 max 0.0588 | **PASS** |
| C5 | One rAF loop; native scroll; no transform on main | tests/c5.spec.ts 8/8; c5-grep PASS | **PASS** |
| C6 | No new fixed chrome; reachability unchanged | tests/c6.spec.ts covered in P9 commit (26 passed) | **PASS** |
| C7 | Tier mapping correct; no second loop; tier-3 static | tests/c7.spec.ts 37/38 (1 skipped — expected); look.spec tier-3 pixel-identical | **PASS** |
| C7 (fps) | 60 fps on real hardware | — | **U** OPEN |
| C8 | No invented content | content gate PASS; check-content.ts 0 slots | **PASS** |

## Playwright summary

| Spec | Passed | Skipped | Result |
|------|--------|---------|--------|
| c1.spec.ts | 4 | 0 | PASS |
| c2.spec.ts | 2 | 0 | PASS |
| c4.spec.ts | 2 | 0 | PASS |
| c5.spec.ts | 8 | 0 | PASS |
| c7.spec.ts | 37 | 1 | PASS (skip expected) |
| look.spec.ts | 26 | 0 | PASS |
| shots.spec.ts | 2 | 0 | PASS (8 PNGs) |

## Lighthouse (P6.7) — 2026-11-14 (retained)

Command: `npm run lh` → `lhci autorun` (Lighthouse 13.6.0, Chrome 157; `?fx=off`; mobile).

| URL | Performance | Accessibility | Best Practices | SEO |
|-----|-------------|---------------|----------------|-----|
| `/?fx=off` | 100 | 100 | 100 | 100 |
| `/projects/stitchlogic?fx=off` | 100 | 100 | 100 | 100 |

Raw reports: `qa/lh/` directory (committed in P6.7).

## Owner items (U — never closed by an agent)

- [ ] **C7 real-hardware fps** — 60 fps on a mid-range laptop; 4× CPU throttle holds ≥ 30 fps
- [ ] **Ocean look** — "beautiful/realistic" and waterline reads as a camera at the waterline; review the 8 PNGs in `qa/screens/` (gitignored; run `npm run shot` to regenerate)
- [ ] **SPEC §5 palette update** — P8 retuned `surface`, `sunlight`, `twilight`, `midnight` to tropical palette; proposed hexes in DECISIONS.md row D-203; owner updates §5 table when satisfied
- [ ] **Real phone review** — mid-range Android/iOS, scroll full page, verify no jank

## Open items

- SPEC §5 palette table is stale — canonical values are in `lib/zones.ts`; owner update pending (D-203)
