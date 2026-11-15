---
name: ocean-shader
description: Use when writing or debugging the WebGL water shader, OGL geometry, uniforms, the render loop, or any visual layer (flow, caustics, god rays, marine snow, glow, bubbles, turbulence, ripple).
---

# Ocean Shader

**P8 note.** For the split-level overhaul, `phases/P8.md` (Palette, Look, Noise budget, Locked constraints) is the visual spec and wins over this file's older layer descriptions. This skill covers the OGL/GLSL mechanics that still apply. Marine snow becomes particles in P8.4; the uniform gate stays `uFx.z`.

## Pinned facts (verified against `ogl@1.0.11`)

- `Triangle` gives `position` as **`vec2`** and `uv` as `vec2` in `0..2`. Declare `attribute vec2 position`. A `vec3` declaration against that buffer renders nothing.
- `Renderer` defaults to `webgl: 2` and silently falls back to WebGL1. Write **GLSL ES 1.00** and do not add a `#version` line — OGL does not rewrite your source.
- `Plane` spans ±0.5. Never use it as a full-screen quad.
- OGL ignores unknown uniforms silently. A layer with no visible effect is almost always a name mismatch.

## The three places a uniform must match

1. the GLSL declaration,
2. the `uniforms` object passed to `new Program(...)`,
3. the per-frame assignment in `OceanCanvas`.

Check them in that order, then set `uDebug` and render the intermediate value.

## Rules

- **Coordinates.** GL space: `uv.y = 0` is the bottom. Water where `uv.y < uWaterline`. Rest waterline `0.7` = 30% air.
- **Mask from undisplaced `vUv`.** Compute `wl` from `vUv.x` and `under` from `vUv.y`. Refraction, ripple, roll, turb and waves move the colour sample only; they must never move the C1 boundary.
- **One layer per task.** Each layer is gated by `uFx` (`rays, caustics, snow, glow`). Verify with the gate at 0 and at its real value.
- **Constant loop bounds.** GLSL ES 1.00: `for (int i = 0; i < MAX; i++) { if (float(i) >= uCount) break; ... }`.
- **No dynamic indexing** of `uBg[5]`. Use the `bgAt()` mix chain from `SPEC.md` §6.
- **No pure white** in particles, snow, glow or foam. It raises local background luminance past the 0.06 allowance and breaks C4.
- **Palette is authoritative.** Never add a second colour model (no Beer-Lambert, no tone map). `bgAt()` is the sea.
- **Absorption applies to water only.** Above the waterline the pixel is `uSky`.
- **Plunge is analytic** from `uPlunge`. No second canvas, no DOM particles.
- **Smooth, never hard-switch**, between zones: `smoothstep` across the gap.

## Compile-safety checklist

- [ ] `precision highp float;` is the first line of the fragment shader.
- [ ] Every `uniform` in GLSL exists in the `uniforms` object with the same type arity (`vec3` → `{ value: new Vec3() }`, `Float32Array(3)` or a plain `[r,g,b]`).
- [ ] Array uniforms (`vec3 uBg[5]`) use a plain nested `Array`, never a `Float32Array` — OGL's `Array.isArray(uniform.value)` test rejects typed arrays for `name[0]` uniforms and silently skips the upload.
- [ ] No `int`/`float` mixing without an explicit constructor (`float(i)`).
- [ ] No `texture2D` without a sampler.
- [ ] No array length expression that is not a literal.
- [ ] No division by a possible zero (`uAspect` is never 0, but `uWaterline` can exceed 1 — clamp inputs, not outputs).

## Performance budget

Count per-pixel noise calls against the phase's tap table. P8 allots **11 taps at `uOct = 4`** (8 at `uOct = 2`); see `phases/P8.md` → Noise budget. Any new tap must come out of that table.
Every layer count and amplitude comes from `lib/tuning.ts` and is wired as a uniform — no literal counts in GLSL. Literals are limited to `0`/`1` and named geometric constants listed in the tap-budget comment.
Adaptive quality lowers DPR and `uOct`. Never raise them mid-session.
If a layer drops below 45 fps, reduce its loop count before cutting the layer — and follow the cut order in `phases/P8.md` / `SPEC.md` §7.

## Done

- [ ] Gate uniform at 0 and at full strength produces a visible difference.
- [ ] No GLSL compile warning or console error.
- [ ] The mask is computed from undisplaced `vUv`; the waterline still measures 30% at scroll 0 (`tests/c1.spec.ts`).
- [ ] `window.__oceanDebug.layer` isolates the new layer using the P8 codes (`11`–`18`).
- [ ] `npm run gate` passes and the task's Playwright checks pass.
