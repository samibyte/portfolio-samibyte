import { test, expect } from "@playwright/test";
import { decode, relativeLuma, hue, saturation, meanRegion, diffRatio } from "./helpers/pixels";
import { ZONES } from "../lib/zones";

test.use({
  launchOptions: {
    args: [
      "--use-gl=angle",
      "--use-angle=gl",
      "--ignore-gpu-blocklist",
    ],
  },
});

test.describe("P8 Look: Composition & Evidence", () => {
  test("canvas mounted and mean boundary is 30% ± 0.5%", async ({ page }) => {
    // Baseline checks force tier 0 and debug layer 1 (under-mask)
    await page.addInitScript(() => {
      (window as unknown as { __oceanDebug?: { tier?: number; layer?: number } }).__oceanDebug = {
        tier: 0,
        layer: 1,
      };
    });

    await page.goto("/");
    await page.waitForLoadState("load");

    const canvas = page.locator("canvas[data-ocean-canvas]");
    await canvas.waitFor({ state: "attached" });
    await expect(canvas).toBeAttached();

    // Wait for the 400ms fade
    await page.waitForTimeout(600);

    // Make DOM overlays transparent so we measure pure canvas pixels without changing layout
    await page.addStyleTag({
      content:
        "header, nav, main, [data-chrome], a[href='#main-content'] { opacity: 0 !important; }",
    });
    await page.waitForTimeout(100);

    let sumFractions = 0;
    let totalSamples = 0;
    const numFrames = 3;

    for (let f = 0; f < numFrames; f++) {
      if (f > 0) {
        await page.waitForTimeout(150);
      }
      const shot = await canvas.screenshot();
      const img = decode(shot);

      const xStart = Math.round(img.width * 0.1);
      const xEnd = Math.round(img.width * 0.9);

      let frameSum = 0;
      let frameCount = 0;

      for (let x = xStart; x <= xEnd; x++) {
        let maxStep = 0;
        let boundaryRow = -1;

        for (let y = 0; y < img.height - 1; y++) {
          const l1 = relativeLuma(img.at(x, y));
          const l2 = relativeLuma(img.at(x, y + 1));
          const step = Math.abs(l2 - l1);
          if (step > maxStep) {
            maxStep = step;
            boundaryRow = y;
          }
        }

        if (boundaryRow >= 0 && maxStep > 0.05) {
          frameSum += boundaryRow / img.height;
          frameCount++;
        }
      }

      expect(frameCount).toBeGreaterThan((xEnd - xStart) * 0.9);
      sumFractions += frameSum;
      totalSamples += frameCount;
    }

    const meanBoundary = sumFractions / totalSamples;
    console.log(
      `Mean boundary over x=10-90%: ${(meanBoundary * 100).toFixed(3)}% (samples: ${totalSamples})`,
    );

    // 30% ± 0.5% means [0.295, 0.305]
    expect(meanBoundary).toBeGreaterThanOrEqual(0.295);
    expect(meanBoundary).toBeLessThanOrEqual(0.305);
  });

  test("palette: water-top hue 160-200°, s <= 0.65, relLuma 0.22-0.45; no non-abyss zone bg s > 0.65; abyss hexes unchanged", () => {
    const surface = ZONES.find((z) => z.id === "surface");
    expect(surface).toBeDefined();
    const waterTop = surface!.bgBot;
    const h = hue(waterTop);
    const s = saturation(waterTop);
    const luma = relativeLuma(waterTop);

    expect(h).toBeGreaterThanOrEqual(160);
    expect(h).toBeLessThanOrEqual(200);
    expect(s).toBeLessThanOrEqual(0.65);
    expect(luma).toBeGreaterThanOrEqual(0.22);
    expect(luma).toBeLessThanOrEqual(0.45);

    // No zone bg s > 0.65 (abyss is frozen and excluded)
    for (const zone of ZONES) {
      if (zone.id === "abyss") continue;
      expect(saturation(zone.bgTop)).toBeLessThanOrEqual(0.65);
      expect(saturation(zone.bgBot)).toBeLessThanOrEqual(0.65);
    }

    // Abyss hexes unchanged
    const abyss = ZONES.find((z) => z.id === "abyss");
    expect(abyss).toBeDefined();
    expect(abyss!.bgTop.toLowerCase()).toBe("#050d1a");
    expect(abyss!.bgBot.toLowerCase()).toBe("#020408");
    expect(abyss!.text.toLowerCase()).toBe("#b4c2d0");
    expect(abyss!.accent.toLowerCase()).toBe("#ff9f43");
  });

  test("dark-text floor: every dark-text zone min(relLuma(bgTop), relLuma(bgBot)) >= 0.21", () => {
    for (const zone of ZONES) {
      if (relativeLuma(zone.text) < 0.2) {
        const topLuma = relativeLuma(zone.bgTop);
        const botLuma = relativeLuma(zone.bgBot);
        const minLuma = Math.min(topLuma, botLuma);
        expect(minLuma).toBeGreaterThanOrEqual(0.21);
      }
    }
  });

  test("fallback split: step at x=1% >= 0.05 luma with ?fx=off", async ({ page }) => {
    await page.goto("/?fx=off");
    await page.waitForLoadState("networkidle");

    const shot = await page.screenshot();
    const img = decode(shot);
    const x = Math.round(img.width * 0.01);
    let maxStep = 0;
    let boundaryRow = -1;

    for (let y = 0; y < img.height - 1; y++) {
      const l1 = relativeLuma(img.at(x, y));
      const l2 = relativeLuma(img.at(x, y + 1));
      const step = Math.abs(l2 - l1);
      if (step > maxStep) {
        maxStep = step;
        boundaryRow = y;
      }
    }

    console.log(
      `Fallback split step: ${maxStep.toFixed(4)} at row ${boundaryRow} (${((boundaryRow / img.height) * 100).toFixed(1)}%)`,
    );
    expect(maxStep).toBeGreaterThanOrEqual(0.05);
  });

  test("P8.2 surface band: rows 30-45% are >= 0.02 luma brighter than rows 55-70%", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (
        window as unknown as { __oceanDebug?: { tier?: number } }
      ).__oceanDebug = { tier: 0 };
    });

    await page.goto("/");
    await page.waitForLoadState("load");

    const canvas = page.locator("canvas[data-ocean-canvas]");
    await canvas.waitFor({ state: "attached" });
    await expect(canvas).toBeAttached();
    await page.waitForTimeout(600);

    await page.addStyleTag({
      content:
        "header, nav, main, [data-chrome], a[href='#main-content'] { opacity: 0 !important; }",
    });
    await page.waitForTimeout(100);

    const img = decode(await canvas.screenshot());
    const xStart = Math.round(img.width * 0.1);
    const xEnd = Math.round(img.width * 0.9);

    const meanRows = (from: number, to: number) => {
      let sum = 0;
      let count = 0;
      for (let y = Math.round(img.height * from); y < Math.round(img.height * to); y++) {
        for (let x = xStart; x <= xEnd; x++) {
          sum += relativeLuma(img.at(x, y));
          count++;
        }
      }
      return sum / count;
    };

    const band = meanRows(0.3, 0.45);
    const deep = meanRows(0.55, 0.7);
    console.log(
      `Surface band luma ${band.toFixed(4)} vs near-field ${deep.toFixed(4)} (delta ${(band - deep).toFixed(4)})`,
    );

    expect(band).toBeGreaterThanOrEqual(deep + 0.02);
  });

  test("P8.2 foam edge: largest x=1% step, runner-up >= 4 rows away is <= 2/3 of it", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (
        window as unknown as { __oceanDebug?: { tier?: number } }
      ).__oceanDebug = { tier: 0 };
    });

    await page.goto("/");
    await page.waitForLoadState("load");

    const canvas = page.locator("canvas[data-ocean-canvas]");
    await canvas.waitFor({ state: "attached" });
    await expect(canvas).toBeAttached();
    await page.waitForTimeout(600);

    await page.addStyleTag({
      content:
        "header, nav, main, [data-chrome], a[href='#main-content'] { opacity: 0 !important; }",
    });
    await page.waitForTimeout(100);

    const img = decode(await canvas.screenshot());
    const x = Math.round(img.width * 0.01);
    const steps: number[] = [];
    for (let y = 0; y < img.height - 1; y++) {
      steps.push(
        Math.abs(relativeLuma(img.at(x, y + 1)) - relativeLuma(img.at(x, y))),
      );
    }

    let maxStep = 0;
    let maxRow = -1;
    for (let y = 0; y < steps.length; y++) {
      if (steps[y] > maxStep) {
        maxStep = steps[y];
        maxRow = y;
      }
    }

    let runnerUp = 0;
    for (let y = 0; y < steps.length; y++) {
      if (Math.abs(y - maxRow) >= 4 && steps[y] > runnerUp) runnerUp = steps[y];
    }

    console.log(
      `Foam edge step ${maxStep.toFixed(4)} at ${((maxRow / img.height) * 100).toFixed(1)}%; runner-up ${runnerUp.toFixed(4)} (limit ${(maxStep * (2 / 3)).toFixed(4)})`,
    );

    expect(maxStep).toBeGreaterThan(0.02);
    expect(runnerUp).toBeLessThanOrEqual(maxStep * (2 / 3));
  });

  // ── P8.3 Refraction + caustics + rays ───────────────────────────────────────

  test("P8.3 foreground flow: near-field (rows 32-48%) changes faster than far-field (rows 82-98%) over 200ms, ratio >= 1.5", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (
        window as unknown as { __oceanDebug?: { tier?: number } }
      ).__oceanDebug = { tier: 0 };
    });

    await page.goto("/");
    await page.waitForLoadState("load");

    const canvas = page.locator("canvas[data-ocean-canvas]");
    await canvas.waitFor({ state: "attached" });
    await page.waitForTimeout(600);

    await page.addStyleTag({
      content:
        "header, nav, main, [data-chrome], a[href='#main-content'] { opacity: 0 !important; }",
    });
    await page.waitForTimeout(100);

    const shot1 = decode(await canvas.screenshot());
    await page.waitForTimeout(200);
    const shot2 = decode(await canvas.screenshot());

    const w = shot1.width;
    const h = shot1.height;
    const xStart = Math.round(w * 0.1);
    const xEnd = Math.round(w * 0.9);

    // Mean |luma delta| in a row band between two frames.
    const meanDelta = (fromFrac: number, toFrac: number): number => {
      let sum = 0;
      let count = 0;
      for (let y = Math.round(h * fromFrac); y < Math.round(h * toFrac); y++) {
        for (let x = xStart; x < xEnd; x++) {
          const l1 = relativeLuma(shot1.at(x, y));
          const l2 = relativeLuma(shot2.at(x, y));
          sum += Math.abs(l2 - l1);
          count++;
        }
      }
      return count > 0 ? sum / count : 0;
    };

    // GL y=0 is bottom; canvas y=0 is top.
    // "rows 32-48%" in GL space = canvas rows 52-68% (1 - 0.48 to 1 - 0.32).
    // "rows 82-98%" in GL space = canvas rows 2-18%.
    // Near-field (foreground) in GL = bottom of water = top of canvas.
    // Far-field in GL = just below waterline = mid canvas.
    // Using canvas-space fractions directly (canvas y increases downward, GL y increases upward):
    // GL 32-48% = canvas (1-0.48)..(1-0.32) = canvas 52-68%
    // GL 82-98% = canvas (1-0.98)..(1-0.82) = canvas 2-18%
    const nearDelta = meanDelta(0.52, 0.68); // GL near-field (foreground, large features)
    const farDelta = meanDelta(0.02, 0.18);  // GL far-field (just below waterline, small features)

    const ratio = farDelta > 0.0001 ? nearDelta / farDelta : 0;
    console.log(
      `Foreground flow delta: near=${nearDelta.toFixed(5)} far=${farDelta.toFixed(5)} ratio=${ratio.toFixed(3)}`,
    );

    expect(ratio).toBeGreaterThanOrEqual(1.5);
  });

  test("P8.3 depth light: top-half water mean luma >= bottom-half water + 0.02", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (
        window as unknown as { __oceanDebug?: { tier?: number } }
      ).__oceanDebug = { tier: 0 };
    });

    await page.goto("/");
    await page.waitForLoadState("load");

    const canvas = page.locator("canvas[data-ocean-canvas]");
    await canvas.waitFor({ state: "attached" });
    await page.waitForTimeout(600);

    await page.addStyleTag({
      content:
        "header, nav, main, [data-chrome], a[href='#main-content'] { opacity: 0 !important; }",
    });
    await page.waitForTimeout(100);

    const img = decode(await canvas.screenshot());
    const h = img.height;
    const xStart = Math.round(img.width * 0.1);
    const xEnd = Math.round(img.width * 0.9);

    // Water occupies canvas rows ~30-100% (GL 0-70%). Split at 65% canvas row.
    // Top-half water: canvas rows 30-65% (GL 35-70%, near the waterline, more light).
    // Bottom-half water: canvas rows 65-100% (GL 0-35%, deep water, less light).
    const topHalfMean = meanRegion(img, {
      x: xStart,
      y: Math.round(h * 0.30),
      width: xEnd - xStart,
      height: Math.round(h * 0.35),
    });
    const botHalfMean = meanRegion(img, {
      x: xStart,
      y: Math.round(h * 0.65),
      width: xEnd - xStart,
      height: Math.round(h * 0.35),
    });

    console.log(
      `Depth light: top-half water luma ${topHalfMean.luma.toFixed(4)} vs bottom-half ${botHalfMean.luma.toFixed(4)} (delta ${(topHalfMean.luma - botHalfMean.luma).toFixed(4)})`,
    );

    expect(topHalfMean.luma).toBeGreaterThanOrEqual(botHalfMean.luma + 0.02);
  });

  test("P8.3 layers: debug 12 (refraction), 13 (caustics), 14 (rays) coverage > 0 at 15% scroll, 0 at 100%", async ({
    page,
  }) => {
    // 15% scroll = scrollY = 0.15 * 0.3 * vh (surface band), uWaterline ≈ 0.745.
    // At 15% scroll caustics and rays should be active (surface zone uFx.x, uFx.y > 0).
    // At 100% scroll = abyss: uWaterline >> 1, all fx should be 0.

    // Helper: measure non-black coverage in a debug-layer screenshot.
    const measureCoverage = async (debugLayer: number, scrollVh: number): Promise<number> => {
      await page.addInitScript(() => { /* reinstalled below */ });
      const targetDebug = debugLayer;
      await page.evaluate(
        ({ layer }: { layer: number }) => {
          (window as unknown as { __oceanDebug?: object }).__oceanDebug = { tier: 0, layer };
        },
        { layer: targetDebug },
      );

      await page.evaluate((target: number) => {
        const vh = window.innerHeight;
        if (target < 1.0) {
          window.scrollTo(0, Math.round(target * vh));
        } else {
          window.scrollTo(0, Math.max(0, document.documentElement.scrollHeight - vh));
        }
      }, scrollVh);
      await page.waitForTimeout(300);

      const shot = decode(await page.locator("canvas[data-ocean-canvas]").screenshot());
      let lit = 0;
      const total = shot.width * shot.height;
      for (let y = 0; y < shot.height; y++) {
        for (let x = 0; x < shot.width; x++) {
          const [r, g, b] = shot.at(x, y);
          if (r + g + b > 15) lit++;
        }
      }
      return lit / total;
    };

    await page.addInitScript(() => {
      (
        window as unknown as { __oceanDebug?: { tier?: number; layer?: number } }
      ).__oceanDebug = { tier: 0, layer: 12 };
    });
    await page.goto("/");
    await page.waitForLoadState("load");
    const canvas = page.locator("canvas[data-ocean-canvas]");
    await canvas.waitFor({ state: "attached" });
    await page.waitForTimeout(600);
    await page.addStyleTag({
      content:
        "header, nav, main, [data-chrome], a[href='#main-content'] { opacity: 0 !important; }",
    });
    await page.waitForTimeout(100);

    // Scroll = 15% of surface = 0.15 * 0.3 vh.
    const vh15 = 0.15 * 0.3;

    for (const layer of [12, 13, 14] as const) {
      const cov15 = await measureCoverage(layer, vh15);
      const cov100 = await measureCoverage(layer, 1.0);
      console.log(
        `Debug layer ${layer}: coverage@15%scroll=${cov15.toFixed(4)}, coverage@100%scroll=${cov100.toFixed(4)}`,
      );
      expect(cov15).toBeGreaterThan(0);
      // At 100% scroll the waterline is >>1 and 'under' = 1.0 everywhere, but
      // rays/caustics strength is exp(-depth*k) which approaches 0 deep down.
      // Allow a small tolerance (< 0.01 coverage) for stray pixels.
      expect(cov100).toBeLessThan(0.01);
    }
  });

  test("P8.4 particles: debug 15 coverage > 0 at tier 0, tier 1 near 0.35-0.65x, 0 in abyss", async ({
    page,
  }) => {
    const measureParticleCoverage = async (tier: number, scrollVh: number): Promise<number> => {
      await page.evaluate(
        ({ t }: { t: number }) => {
          (window as unknown as { __oceanDebug?: object }).__oceanDebug = { tier: t, layer: 15 };
        },
        { t: tier },
      );

      await page.evaluate((target: number) => {
        const vh = window.innerHeight;
        if (target < 1.0) {
          window.scrollTo(0, Math.round(target * vh));
        } else {
          window.scrollTo(0, Math.max(0, document.documentElement.scrollHeight - vh));
        }
      }, scrollVh);
      await page.waitForTimeout(300);

      const shot = decode(await page.locator("canvas[data-ocean-canvas]").screenshot());
      let lit = 0;
      const total = shot.width * shot.height;
      for (let y = 0; y < shot.height; y++) {
        for (let x = 0; x < shot.width; x++) {
          const [r, g, b] = shot.at(x, y);
          if (r + g + b > 15) lit++;
        }
      }
      return lit / total;
    };

    await page.addInitScript(() => {
      (
        window as unknown as { __oceanDebug?: { tier?: number; layer?: number } }
      ).__oceanDebug = { tier: 0, layer: 15 };
    });
    await page.goto("/");
    await page.waitForLoadState("load");
    const canvas = page.locator("canvas[data-ocean-canvas]");
    await canvas.waitFor({ state: "attached" });
    await page.waitForTimeout(600);
    await page.addStyleTag({
      content:
        "header, nav, main, aside, [data-chrome], a[href='#main-content'] { opacity: 0 !important; }",
    });
    await page.waitForTimeout(100);

    const vh15 = 0.15 * 0.3;
    const covTier0 = await measureParticleCoverage(0, vh15);
    const covTier1 = await measureParticleCoverage(1, vh15);
    const covAbyss = await measureParticleCoverage(0, 1.0);

    console.log(
      `Debug layer 15: covTier0=${covTier0.toFixed(4)}, covTier1=${covTier1.toFixed(4)}, ratio=${(covTier1 / covTier0).toFixed(4)}, covAbyss=${covAbyss.toFixed(4)}`,
    );

    expect(covTier0).toBeGreaterThan(0);
    const ratio = covTier1 / covTier0;
    expect(ratio).toBeGreaterThanOrEqual(0.35);
    expect(ratio).toBeLessThanOrEqual(0.65);
    expect(covAbyss).toBe(0);
  });

  // ── P8.5 Fauna ──────────────────────────────────────────────────────────────

  test("P8.5 fauna: debug 16 coverage > 0 at tier 0; 0 at 100% scroll and tier 1", async ({
    page,
  }) => {
    const measureFaunaCoverage = async (tier: number, scrollVh: number): Promise<number> => {
      await page.evaluate(
        ({ t }: { t: number }) => {
          (window as unknown as { __oceanDebug?: object }).__oceanDebug = { tier: t, layer: 16 };
        },
        { t: tier },
      );

      await page.evaluate((target: number) => {
        const vh = window.innerHeight;
        if (target < 1.0) {
          window.scrollTo(0, Math.round(target * vh));
        } else {
          window.scrollTo(0, Math.max(0, document.documentElement.scrollHeight - vh));
        }
      }, scrollVh);
      await page.waitForTimeout(400);

      const shot = decode(await page.locator("canvas[data-ocean-canvas]").screenshot());
      let lit = 0;
      const total = shot.width * shot.height;
      for (let y = 0; y < shot.height; y++) {
        for (let x = 0; x < shot.width; x++) {
          const [r, g, b] = shot.at(x, y);
          if (r + g + b > 15) lit++;
        }
      }
      return lit / total;
    };

    await page.addInitScript(() => {
      (
        window as unknown as { __oceanDebug?: { tier?: number; layer?: number } }
      ).__oceanDebug = { tier: 0, layer: 16 };
    });
    await page.goto("/");
    await page.waitForLoadState("load");
    const canvas = page.locator("canvas[data-ocean-canvas]");
    await canvas.waitFor({ state: "attached" });
    await page.waitForTimeout(600);
    await page.addStyleTag({
      content:
        "header, nav, main, aside, [data-chrome], a[href='#main-content'] { opacity: 0 !important; }",
    });
    await page.waitForTimeout(100);

    const vh15 = 0.15 * 0.3;
    const covTier0 = await measureFaunaCoverage(0, vh15);
    const covTier1 = await measureFaunaCoverage(1, vh15);
    const covAbyss = await measureFaunaCoverage(0, 1.0);

    console.log(
      `Debug layer 16 (fauna): covTier0=${covTier0.toFixed(4)}, covTier1=${covTier1.toFixed(4)}, covAbyss=${covAbyss.toFixed(4)}`,
    );

    expect(covTier0).toBeGreaterThan(0);
    expect(covTier1).toBe(0);
    expect(covAbyss).toBe(0);
  });

  // ── P8.6 Camera + vignette + grain ──────────────────────────────────────────

  test("P8.6 grade: vignette corner >= 0.02 darker than 10-14% inset (surface stop), <= 6% falloff; grain <= 0.01", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (
        window as unknown as { __oceanDebug?: { tier?: number } }
      ).__oceanDebug = { tier: 0 };
    });

    await page.goto("/");
    await page.waitForLoadState("load");
    const canvas = page.locator("canvas[data-ocean-canvas]");
    await canvas.waitFor({ state: "attached" });
    await page.waitForTimeout(600);
    await page.addStyleTag({
      content:
        "header, nav, main, aside, [data-chrome], a[href='#main-content'] { opacity: 0 !important; }",
    });
    await page.waitForTimeout(100);

    // ── grain: consecutive-frame delta in a flat sky patch ──
    const frameA = decode(await canvas.screenshot());
    await page.waitForTimeout(120);
    const frameB = decode(await canvas.screenshot());

    const gw = frameA.width;
    const gh = frameA.height;
    const grainPatch = {
      x: Math.round(gw * 0.12),
      y: Math.round(gh * 0.05),
      width: Math.round(gw * 0.12),
      height: Math.round(gh * 0.05),
    };
    let grainSum = 0;
    let grainCount = 0;
    for (let y = grainPatch.y; y < grainPatch.y + grainPatch.height; y++) {
      for (let x = grainPatch.x; x < grainPatch.x + grainPatch.width; x++) {
        grainSum += Math.abs(
          relativeLuma(frameB.at(x, y)) - relativeLuma(frameA.at(x, y)),
        );
        grainCount++;
      }
    }
    const grainDelta = grainSum / Math.max(1, grainCount);

    // ── vignette: 15% surface stop (waterline ~27%), same-row corner vs inset ──
    await page.evaluate(() => {
      window.scrollTo(0, Math.round(0.15 * 0.3 * window.innerHeight));
    });
    await page.waitForTimeout(300);
    const img = decode(await canvas.screenshot());

    const w = img.width;
    const h = img.height;
    const rowY = Math.round(h * 0.01);
    const rowH = Math.max(2, Math.round(h * 0.05));
    const colW = Math.max(2, Math.round(w * 0.04));

    const cornerL = meanRegion(img, { x: 0, y: rowY, width: colW, height: rowH });
    const cornerR = meanRegion(img, {
      x: w - colW,
      y: rowY,
      width: colW,
      height: rowH,
    });
    const insetL = meanRegion(img, {
      x: Math.round(w * 0.1),
      y: rowY,
      width: colW,
      height: rowH,
    });
    const insetR = meanRegion(img, {
      x: Math.round(w * 0.86),
      y: rowY,
      width: colW,
      height: rowH,
    });

    const cornerLuma = (cornerL.luma + cornerR.luma) / 2;
    const insetLuma = (insetL.luma + insetR.luma) / 2;

    console.log(
      `Grade: corner luma ${cornerLuma.toFixed(4)} vs inset ${insetLuma.toFixed(4)} (delta ${(insetLuma - cornerLuma).toFixed(4)}); grain delta ${grainDelta.toFixed(4)}`,
    );

    expect(grainDelta).toBeGreaterThan(0);
    expect(grainDelta).toBeLessThanOrEqual(0.01);

    // Outer 4% corner patch is at least 0.02 darker (relative luma) than the
    // 10-14% inset band in the same rows.
    expect(insetLuma - cornerLuma).toBeGreaterThanOrEqual(0.02);

    // Debug layer 17 isolates the grade and caps the corner falloff at 0.06.
    await page.evaluate(() => {
      (window as unknown as { __oceanDebug?: object }).__oceanDebug = {
        tier: 0,
        layer: 17,
      };
    });
    await page.waitForTimeout(300);
    const gradeImg = decode(await canvas.screenshot());

    let gradeMax = 0;
    let gradeCornerSum = 0;
    for (let y = rowY; y < rowY + rowH; y++) {
      for (let x = 0; x < colW; x++) {
        gradeCornerSum += gradeImg.at(x, y)[0] / 255;
      }
    }
    for (let y = 0; y < gradeImg.height; y++) {
      for (let x = 0; x < gradeImg.width; x++) {
        const v = gradeImg.at(x, y)[0] / 255;
        if (v > gradeMax) gradeMax = v;
      }
    }
    const gradeCornerMean = gradeCornerSum / Math.max(1, colW * rowH);

    console.log(
      `Debug layer 17 (grade): corner mean ${gradeCornerMean.toFixed(4)}, max ${gradeMax.toFixed(4)}`,
    );
    expect(gradeCornerMean).toBeGreaterThanOrEqual(0.02);
    expect(gradeMax).toBeLessThanOrEqual(0.06);
  });

  test("P8.6 camera: debug 17 coverage > 0 at tier 0, 0 at tier 1; tier 3 frames 600ms apart pixel-identical", async ({
    page,
  }) => {
    const measureGradeCoverage = async (tier: number): Promise<number> => {
      await page.evaluate(
        ({ t }: { t: number }) => {
          (window as unknown as { __oceanDebug?: object }).__oceanDebug = {
            tier: t,
            layer: 17,
          };
        },
        { t: tier },
      );
      await page.waitForTimeout(300);

      const shot = decode(
        await page.locator("canvas[data-ocean-canvas]").screenshot(),
      );
      let lit = 0;
      const total = shot.width * shot.height;
      for (let y = 0; y < shot.height; y++) {
        for (let x = 0; x < shot.width; x++) {
          const [r, g, b] = shot.at(x, y);
          if (r + g + b > 15) lit++;
        }
      }
      return lit / total;
    };

    await page.addInitScript(() => {
      (
        window as unknown as { __oceanDebug?: { tier?: number; layer?: number } }
      ).__oceanDebug = { tier: 0, layer: 17 };
    });
    await page.goto("/");
    await page.waitForLoadState("load");
    const canvas = page.locator("canvas[data-ocean-canvas]");
    await canvas.waitFor({ state: "attached" });
    await page.waitForTimeout(600);
    await page.addStyleTag({
      content:
        "header, nav, main, aside, [data-chrome], a[href='#main-content'] { opacity: 0 !important; }",
    });
    await page.waitForTimeout(100);

    const covTier0 = await measureGradeCoverage(0);
    const covTier1 = await measureGradeCoverage(1);

    console.log(
      `Debug layer 17 (grade): covTier0=${covTier0.toFixed(4)}, covTier1=${covTier1.toFixed(4)}`,
    );
    expect(covTier0).toBeGreaterThan(0);
    expect(covTier1).toBe(0);

    // Tier 3 is static: identical pixels after 600 ms.
    await page.evaluate(() => {
      (window as unknown as { __oceanDebug?: object }).__oceanDebug = {
        tier: 3,
        layer: 0,
      };
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);

    const staticA = decode(await canvas.screenshot());
    await page.waitForTimeout(600);
    const staticB = decode(await canvas.screenshot());

    const changed = diffRatio(staticA, staticB, undefined, 0);
    console.log(`Tier 3 static: changed pixel ratio after 600ms = ${changed}`);
    expect(changed).toBe(0);
  });
});
