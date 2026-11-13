// WCAG 2.2 AA contrast check for every zone (constraint C4).
//   npx tsx scripts/contrast.ts
//
// Body text        4.5:1  → gate
// Focus ring       3.0:1  → gate (`--text` is used as the ring colour)
// Large text       3.0:1  → gate (18.66px bold / 24px regular)
// Accent           3.0:1  → advisory only; accent is decorative (D-018)
//
// Light-text zones are additionally checked with +0.06 luminance added to the
// background, which is the maximum effect lift the shader is allowed (SPEC §5).
// Exit 1 on any gate failure.

import { ZONES } from '../lib/zones';

const BODY_MIN = 4.5;
const UI_MIN = 3.0;
const EFFECT_LIFT = 0.06;

function channelToLinear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Expected 6-digit hex, got "${hex}"`);
  const [r, g, b] = [0, 2, 4].map((i) => channelToLinear(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const isLightText = (text: string, bg: string) => luminance(text) > luminance(bg);

let failures = 0;
const worst: string[] = [];

for (const zone of ZONES) {
  const lt = luminance(zone.text);
  const rows: string[] = [];

  for (const bg of [zone.bgTop, zone.bgBot]) {
    const lb = luminance(bg);
    const body = ratio(lt, lb);
    const lifted = isLightText(zone.text, bg) ? ratio(lt, lb + EFFECT_LIFT) : body;
    const ok = Math.min(body, lifted) >= BODY_MIN;
    if (!ok) failures++;
    rows.push(
      `${bg} ${body.toFixed(2)}${lifted !== body ? ` (lift ${lifted.toFixed(2)})` : ''} ${ok ? 'ok' : 'FAIL'}`,
    );
    if (ok) worst.push(`${zone.id} ${Math.min(body, lifted).toFixed(2)}`);
  }

  const ring = Math.min(...[zone.bgTop, zone.bgBot].map((bg) => ratio(lt, luminance(bg))));
  if (ring < UI_MIN) {
    failures++;
    rows.push(`focus-ring ${ring.toFixed(2)} FAIL`);
  }

  const accent = Math.min(...[zone.bgTop, zone.bgBot].map((bg) => ratio(luminance(zone.accent), luminance(bg))));
  if (accent < UI_MIN) rows.push(`accent ${accent.toFixed(2)} (warn, decorative)`);

  console.log(`${rows.some((r) => r.includes('FAIL')) ? 'FAIL' : 'PASS'} ${zone.id.padEnd(9)} ${rows.join(' | ')}`);
}

if (failures > 0) {
  console.log(`\n${failures} failing pair(s). See skills/ocean-a11y-contrast/SKILL.md. Do not lower a threshold.`);
  process.exit(1);
}

console.log(`\nAll zones pass. Tightest body pair: ${worst.sort((a, b) => parseFloat(a.split(' ')[1]) - parseFloat(b.split(' ')[1]))[0]}`);
