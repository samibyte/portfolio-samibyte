import { test, expect } from "@playwright/test";
import { decode, relativeLuma, hue, saturation } from "./helpers/pixels";
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

    const canvas = page.locator("canvas");
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

    const canvas = page.locator("canvas");
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

    const canvas = page.locator("canvas");
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
});
