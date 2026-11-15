import { test, expect } from "@playwright/test";
import {
  decideTier,
  tierSettings,
  evaluateFps,
  computeMeanFrameTime,
  resetAdaptiveQuality,
  round2,
  type QualityTier,
  type TierInputs,
} from "../lib/signal";
import { environmentAt } from "../lib/layout";
import { setSectionOffsets } from "../lib/zones";
import { T } from "../lib/tuning";

test.use({
  launchOptions: {
    args: [
      "--use-gl=angle",
      "--use-angle=gl",
      "--ignore-gpu-blocklist",
    ],
  },
});

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
      particleScale: 1,
      fauna: true,
      camera: true,
      glow: true,
      ripple: true,
    });
  });

  test("tier 1 caps DPR at 1, halves octaves and near particles, drops fauna and camera", () => {
    expect(tierSettings(1)).toEqual({
      canvas: true,
      static: false,
      dprCap: T.dprLow,
      octaves: T.octavesLow,
      particleScale: T.particleScaleLow,
      fauna: false,
      camera: false,
      glow: true,
      ripple: true,
    });
  });

  test("tier 2 removes far particles, fauna, camera, glow and ripple but keeps the canvas", () => {
    expect(tierSettings(2)).toEqual({
      canvas: true,
      static: false,
      dprCap: T.dprLow,
      octaves: T.octavesLow,
      particleScale: T.particleScaleLow,
      fauna: false,
      camera: false,
      glow: false,
      ripple: false,
    });
  });

  test("tier 3 is a static canvas", () => {
    expect(tierSettings(3)).toEqual({
      canvas: true,
      static: true,
      dprCap: T.dprMax,
      octaves: T.octaves,
      particleScale: 1,
      fauna: true,
      camera: true,
      glow: true,
      ripple: false,
    });
  });

  test("tier 4 has no canvas", () => {
    expect(tierSettings(4)).toEqual({
      canvas: false,
      static: true,
      dprCap: 0,
      octaves: 0,
      particleScale: 0,
      fauna: false,
      camera: false,
      glow: false,
      ripple: false,
    });
  });
});

test.describe("C7: adaptive quality evaluation (P6.2)", () => {
  test.beforeEach(() => {
    resetAdaptiveQuality();
  });

  test("computeMeanFrameTime computes average over durations", () => {
    expect(computeMeanFrameTime([])).toBe(0);
    expect(computeMeanFrameTime([0.016, 0.016, 0.016])).toBeCloseTo(0.016, 5);
    expect(computeMeanFrameTime([0.01, 0.03])).toBeCloseTo(0.02, 5);
  });

  test("fps >= 45 preserves full quality", () => {
    const res = evaluateFps(60, { adaptiveLow: false, dprCap: T.dprMax });
    expect(res).toEqual({ adaptiveLow: false, dprCap: T.dprMax });
  });

  test("fps < 45 but >= 30 drops DPR to T.dprMid", () => {
    const res = evaluateFps(40, { adaptiveLow: false, dprCap: T.dprMax });
    expect(res).toEqual({ adaptiveLow: false, dprCap: T.dprMid });
  });

  test("fps < 30 drops to tier 1 (adaptiveLow: true, dprCap: T.dprLow)", () => {
    const res = evaluateFps(25, { adaptiveLow: false, dprCap: T.dprMax });
    expect(res).toEqual({ adaptiveLow: true, dprCap: T.dprLow });
  });

  test("never upgrade mid-session: high fps after adaptiveLow stays tier 1", () => {
    const degraded = evaluateFps(20, { adaptiveLow: false, dprCap: T.dprMax });
    expect(degraded.adaptiveLow).toBe(true);
    expect(degraded.dprCap).toBe(T.dprLow);

    // Frame rate recovers to 60 fps
    const recovered = evaluateFps(60, degraded);
    expect(recovered.adaptiveLow).toBe(true);
    expect(recovered.dprCap).toBe(T.dprLow);
  });

  test("never upgrade mid-session: high fps after dprMid keeps dprMid", () => {
    const degraded = evaluateFps(38, { adaptiveLow: false, dprCap: T.dprMax });
    expect(degraded.adaptiveLow).toBe(false);
    expect(degraded.dprCap).toBe(T.dprMid);

    // Frame rate recovers to 60 fps
    const recovered = evaluateFps(60, degraded);
    expect(recovered.adaptiveLow).toBe(false);
    expect(recovered.dprCap).toBe(T.dprMid);
  });

  test("dprMid downgrades further to tier 1 if fps drops below 30", () => {
    const mid = evaluateFps(40, { adaptiveLow: false, dprCap: T.dprMax });
    expect(mid.dprCap).toBe(T.dprMid);

    const low = evaluateFps(22, mid);
    expect(low.adaptiveLow).toBe(true);
    expect(low.dprCap).toBe(T.dprLow);
  });
});

test.describe("C7: environment bridge (P10.2)", () => {
  test("environmentAt interpolates depth and local light from cached sections", () => {
    setSectionOffsets([
      { id: "hero", zone: "surface", pageTop: 0, pageBottom: 1000 },
      { id: "contact", zone: "abyss", pageTop: 1000, pageBottom: 2000 },
    ]);

    const surface = environmentAt(0);
    const halfway = environmentAt(500);
    const abyss = environmentAt(2500);

    expect(surface.depth).toBe(0);
    expect(halfway.depth).toBeCloseTo(15, 5);
    expect(abyss.depth).toBe(6000);

    // Local light is the luma of the background: bright surface, near-black abyss.
    expect(surface.light).toBeGreaterThan(0.6);
    expect(abyss.light).toBeLessThan(0.05);
    expect(surface.light).toBeGreaterThan(abyss.light);
  });

  test("round2 keeps two decimals and is stable", () => {
    expect(round2(0.123456)).toBe(0.12);
    expect(round2(-0.6789)).toBe(-0.68);
    expect(round2(1)).toBe(1);
    expect(round2(round2(0.4242))).toBe(0.42);
  });

  test("EnvVars writes rounded vars on its own element, never :root/body", async ({
    page,
  }) => {
    await page.goto("/?fx=off");
    const bridge = page.locator("[data-env]");
    await expect(bridge).toHaveCount(1);

    const read = () =>
      bridge.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          depth: style.getPropertyValue("--env-depth").trim(),
          light: style.getPropertyValue("--env-light").trim(),
          current: style.getPropertyValue("--env-current").trim(),
          phase: style.getPropertyValue("--env-phase").trim(),
        };
      });

    await expect.poll(async () => (await read()).depth).not.toBe("");
    const first = await read();
    for (const value of Object.values(first)) {
      expect(value).toMatch(/^-?\d+(\.\d{1,2})?$/);
    }

    const root = await page.evaluate(() => ({
      rootDepth: getComputedStyle(document.documentElement)
        .getPropertyValue("--env-depth")
        .trim(),
      bodyDepth: getComputedStyle(document.body)
        .getPropertyValue("--env-depth")
        .trim(),
      rootStyle: document.documentElement.getAttribute("style") ?? "",
      bodyStyle: document.body.getAttribute("style") ?? "",
    }));
    expect(root.rootDepth).toBe("");
    expect(root.bodyDepth).toBe("");
    expect(root.rootStyle).not.toContain("--env");
    expect(root.bodyStyle).not.toContain("--env");

    // Depth grows and light falls as the page descends.
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect
      .poll(async () => Number((await read()).depth), { timeout: 10_000 })
      .toBeGreaterThan(Number(first.depth) + 100);
    const bottom = await read();
    expect(Number(bottom.light)).toBeLessThan(Number(first.light));
  });

  test("reduced motion freezes motion vars and writes nothing at rest", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const bridge = page.locator("[data-env]");
    await expect(bridge).toHaveCount(1);

    const read = () =>
      bridge.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          depth: style.getPropertyValue("--env-depth").trim(),
          current: style.getPropertyValue("--env-current").trim(),
          phase: style.getPropertyValue("--env-phase").trim(),
        };
      });
    await expect.poll(async () => (await read()).depth).not.toBe("");

    const writes = await page.evaluate(async () => {
      const el = document.querySelector("[data-env]")!;
      let onElement = 0;
      let onChrome = 0;
      const elementObserver = new MutationObserver((records) => {
        onElement += records.length;
      });
      const chromeObserver = new MutationObserver((records) => {
        onChrome += records.length;
      });
      elementObserver.observe(el, {
        attributes: true,
        attributeFilter: ["style"],
      });
      chromeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
      chromeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["style"],
      });
      await new Promise((resolve) => setTimeout(resolve, 600));
      elementObserver.disconnect();
      chromeObserver.disconnect();
      return { onElement, onChrome };
    });

    // ~36 frames in 600 ms: writing every frame would show up here.
    expect(writes.onElement).toBe(0);
    expect(writes.onChrome).toBe(0);

    const before = await read();
    expect(before.current).toBe("0");
    expect(before.phase).toBe("0");

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect
      .poll(async () => Number((await read()).depth), { timeout: 10_000 })
      .toBeGreaterThan(Number(before.depth) + 100);
    const after = await read();
    expect(after.current).toBe("0");
    expect(after.phase).toBe("0");
  });
});

test.describe("C7: adaptive quality under CPU throttling (P6.2)", () => {
  test("4× CPU throttling lands on tier 1 and still renders", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Mobile viewports default to tier 2 per P6.1");
    test.slow();

    const client = await page.context().newCDPSession(page);
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    await page.addInitScript(() => {
      (window as unknown as { __ENABLE_OCEAN_DEBUG__?: boolean }).__ENABLE_OCEAN_DEBUG__ = true;
      // Low-end CPU simulation under 4x throttle: each frame takes ~40 ms (< 30 fps)
      function throttleWork() {
        const t0 = performance.now();
        while (performance.now() - t0 < 38) {}
        requestAnimationFrame(throttleWork);
      }
      requestAnimationFrame(throttleWork);
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Wait until rolling 2 s mean frame time after warmup brings tier to 1
    await page.waitForFunction(
      () => {
        const ocean = (window as unknown as { __ocean?: { tier: number } }).__ocean;
        return ocean !== undefined && ocean.tier === 1;
      },
      null,
      { timeout: 20_000 },
    );

    // Assert canvas exists, is visible, and has rendered geometry
    const canvas = page.locator("canvas[data-ocean-canvas]");
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });
});
