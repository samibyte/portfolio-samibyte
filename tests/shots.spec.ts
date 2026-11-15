import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

test.use({
  launchOptions: {
    args: [
      "--use-gl=angle",
      "--use-angle=gl",
      "--ignore-gpu-blocklist",
    ],
  },
});

const OUT = path.join(process.cwd(), "qa", "screens");
const STOPS = [
  { label: "0", target: "0" },
  { label: "15", target: "15" },
  { label: "50", target: "50" },
  { label: "100", target: "100" },
] as const;

test.beforeAll(() => {
  mkdirSync(OUT, { recursive: true });
});

test("scroll screenshots at 0/15/50/100%", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("load");

  const canvas = page.locator("canvas[data-ocean-canvas]");
  await canvas.waitFor({ state: "attached" });
  await page.waitForTimeout(600);

  for (const { label, target } of STOPS) {
    await page.evaluate((t) => {
      const vh = window.innerHeight;
      const max = Math.max(0, document.documentElement.scrollHeight - vh);
      if (t === "0") {
        window.scrollTo(0, 0);
      } else if (t === "15") {
        window.scrollTo(0, Math.round(0.045 * vh));
      } else if (t === "50") {
        window.scrollTo(0, Math.round(max * 0.5));
      } else if (t === "100") {
        window.scrollTo(0, max);
      }
    }, target);

    // Wait 2 rAF + 100 ms before the shot
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => setTimeout(resolve, 100)),
          ),
        ),
    );

    // Assert canvas mounted before each shot
    await expect(canvas).toBeAttached();

    await page.screenshot({
      path: path.join(OUT, `${testInfo.project.name}-${label}.png`),
    });
  }
});
