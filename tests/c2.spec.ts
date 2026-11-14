import { test, expect } from "@playwright/test";
import { decode } from "./helpers/pixels";

function channelToLinear(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

test.use({
  launchOptions: {
    args: [
      "--use-gl=angle",
      "--use-angle=gl",
      "--ignore-gpu-blocklist",
    ],
  },
});

test.describe("C2: Ocean abyss at scroll bottom", () => {
  test("scroll to document end: near-black (mean luma < 0.05) and mean blue > mean red", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll to the document end
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForTimeout(600);

    // Hide all text
    await page.addStyleTag({
      content: "[data-zone] * { color: transparent !important; }",
    });
    await page.waitForTimeout(200);

    const shot = await page.screenshot();
    const img = decode(shot);

    let sumLuma = 0;
    let sumR = 0;
    let sumB = 0;
    const total = img.width * img.height;

    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const [r, g, b] = img.at(x, y);
        sumR += r;
        sumB += b;
        sumLuma +=
          0.2126 * channelToLinear(r) +
          0.7152 * channelToLinear(g) +
          0.0722 * channelToLinear(b);
      }
    }

    const meanLuma = sumLuma / total;
    const meanR = sumR / total;
    const meanB = sumB / total;

    expect(meanLuma).toBeLessThan(0.05);
    expect(meanB).toBeGreaterThan(meanR);
  });
});
