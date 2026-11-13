import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "qa", "screens");
const STOPS = [
  { label: "0", fraction: 0 },
  { label: "50", fraction: 0.5 },
  { label: "100", fraction: 1 },
] as const;

test.beforeAll(() => {
  mkdirSync(OUT, { recursive: true });
});

test("scroll screenshots at 0/50/100%", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("load");

  for (const { label, fraction } of STOPS) {
    await page.evaluate((f) => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo(0, max * f);
    }, fraction);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await page.screenshot({
      path: path.join(OUT, `${testInfo.project.name}-${label}.png`),
    });
  }
});
