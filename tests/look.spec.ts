import { test, expect } from "@playwright/test";
import { decode, relativeLuma } from "./helpers/pixels";

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
});
