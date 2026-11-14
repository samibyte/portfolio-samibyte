import { test, expect } from "@playwright/test";
import {
  decideTier,
  tierSettings,
  type QualityTier,
  type TierInputs,
} from "../lib/signal";
import { T } from "../lib/tuning";

const BASE: TierInputs = {
  fxOff: false,
  webglOk: true,
  reduced: false,
  coarse: false,
  width: 1280,
  adaptiveLow: false,
  forced: null,
};

const CASES: Array<{ name: string; input: Partial<TierInputs>; tier: QualityTier }> = [
  { name: "full desktop → 0", input: {}, tier: 0 },
  { name: "width exactly 768 stays full", input: { width: 768 }, tier: 0 },
  { name: "width 767 → 2", input: { width: 767 }, tier: 2 },
  { name: "coarse pointer → 2", input: { coarse: true }, tier: 2 },
  { name: "adaptive-low → 1", input: { adaptiveLow: true }, tier: 1 },
  {
    name: "adaptive-low + coarse → 2",
    input: { adaptiveLow: true, coarse: true },
    tier: 2,
  },
  {
    name: "adaptive-low + narrow width → 2",
    input: { adaptiveLow: true, width: 390 },
    tier: 2,
  },
  { name: "reduced motion → 3", input: { reduced: true }, tier: 3 },
  {
    name: "reduced + adaptive-low → 3",
    input: { reduced: true, adaptiveLow: true },
    tier: 3,
  },
  {
    name: "reduced + coarse → 3",
    input: { reduced: true, coarse: true },
    tier: 3,
  },
  { name: "?fx=off → 4", input: { fxOff: true }, tier: 4 },
  { name: "no WebGL2 → 4", input: { webglOk: false }, tier: 4 },
  {
    name: "?fx=off beats reduced motion → 4",
    input: { fxOff: true, reduced: true },
    tier: 4,
  },
  {
    name: "no WebGL2 + coarse → 4",
    input: { webglOk: false, coarse: true },
    tier: 4,
  },
];

test.describe("C7: quality tier decision", () => {
  for (const { name, input, tier } of CASES) {
    test(name, () => {
      expect(decideTier({ ...BASE, ...input })).toBe(tier);
    });
  }

  test("dev force wins over every input tuple", () => {
    for (const tier of [0, 1, 2, 3, 4] as const) {
      expect(
        decideTier({
          ...BASE,
          reduced: true,
          coarse: true,
          width: 390,
          fxOff: true,
          webglOk: false,
          forced: tier,
        }),
      ).toBe(tier);
    }
  });

  test("decision is pure: same input, same result", () => {
    const input: TierInputs = { ...BASE, adaptiveLow: true };
    expect(decideTier(input)).toBe(decideTier(input));
  });

  test("tier 0 is full quality", () => {
    expect(tierSettings(0)).toEqual({
      canvas: true,
      static: false,
      dprCap: T.dprMax,
      octaves: T.octaves,
      snowScale: 1,
      glow: true,
      ripple: true,
    });
  });

  test("tier 1 caps DPR at 1, halves octaves and snow", () => {
    expect(tierSettings(1)).toEqual({
      canvas: true,
      static: false,
      dprCap: T.dprLow,
      octaves: T.octavesLow,
      snowScale: T.snowLow,
      glow: true,
      ripple: true,
    });
  });

  test("tier 2 removes snow, glow and ripple but keeps the canvas", () => {
    const settings = tierSettings(2);
    expect(settings.canvas).toBe(true);
    expect(settings.static).toBe(false);
    expect(settings.dprCap).toBe(T.dprLow);
    expect(settings.octaves).toBe(T.octavesLow);
    expect(settings.snowScale).toBe(0);
    expect(settings.glow).toBe(false);
    expect(settings.ripple).toBe(false);
  });

  test("tier 3 is a static canvas", () => {
    const settings = tierSettings(3);
    expect(settings.canvas).toBe(true);
    expect(settings.static).toBe(true);
    expect(settings.ripple).toBe(false);
  });

  test("tier 4 has no canvas", () => {
    const settings = tierSettings(4);
    expect(settings.canvas).toBe(false);
    expect(settings.static).toBe(true);
    expect(settings.dprCap).toBe(0);
  });
});