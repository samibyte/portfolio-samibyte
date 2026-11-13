import { test, expect } from "@playwright/test";
import { decode } from "./helpers/pixels";

function channelToLinear(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luma(rgb: [number, number, number]): number {
  return (
    0.2126 * channelToLinear(rgb[0]) +
    0.7152 * channelToLinear(rgb[1]) +
    0.0722 * channelToLinear(rgb[2])
  );
}

function findBoundaryRow(img: ReturnType<typeof decode>): {
  row: number;
  fraction: number;
  maxStep: number;
} {
  const x = Math.round(img.width * 0.01);
  let maxStep = 0;
  let boundaryRow = -1;

  for (let y = 0; y < img.height - 1; y++) {
    const l1 = luma(img.at(x, y));
    const l2 = luma(img.at(x, y + 1));
    const step = Math.abs(l2 - l1);
    if (step > maxStep) {
      maxStep = step;
      boundaryRow = y;
    }
  }

  const fraction = boundaryRow / img.height;
  return { row: boundaryRow, fraction, maxStep };
}

test.describe("C1: Waterline boundary at 30% viewport height", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("effects on: boundary row inside 27-33% of innerHeight", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const shot = await page.screenshot();
    const img = decode(shot);
    const { fraction, maxStep } = findBoundaryRow(img);

    expect(maxStep).toBeGreaterThan(0.02);
    expect(fraction).toBeGreaterThanOrEqual(0.27);
    expect(fraction).toBeLessThanOrEqual(0.33);
  });

  test("effects off (?fx=off): boundary row inside 27-33% against CSS fallback", async ({ page }) => {
    await page.goto("/?fx=off");
    await page.waitForLoadState("networkidle");

    const shot = await page.screenshot();
    const img = decode(shot);
    const { fraction, maxStep } = findBoundaryRow(img);

    expect(maxStep).toBeGreaterThan(0.02);
    expect(fraction).toBeGreaterThanOrEqual(0.27);
    expect(fraction).toBeLessThanOrEqual(0.33);
  });
});
