import { test, expect } from "@playwright/test";

// Match tests/c6.spec.ts: force an ANGLE GL backend so the WebGL2 probe
// succeeds and the effects-on path actually mounts the canvas.
test.use({
  launchOptions: {
    args: ["--use-gl=angle", "--use-angle=gl", "--ignore-gpu-blocklist"],
  },
});

type WheelProbe = { count: number; prevented: boolean };

test.describe("C5: native scroll over one fixed canvas", () => {
  for (const path of ["/", "/?fx=off"]) {
    test(`${path} — <main> has no transform and the DOM holds at most one canvas`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const transform = await page
        .locator("main")
        .evaluate((element) => getComputedStyle(element).transform);
      expect(transform).toBe("none");

      // Effects on mounts the canvas asynchronously; effects off mounts none.
      if (path === "/") {
        await page.waitForSelector("canvas", { timeout: 30_000 });
      }
      const canvases = await page.locator("canvas").count();
      expect(canvases).toBeLessThanOrEqual(1);
      if (path === "/") expect(canvases).toBe(1);
    });

    test(`${path} — a real wheel event is not defaultPrevented`, async ({
      page,
    }) => {
      await page.addInitScript(() => {
        const probe: WheelProbe = { count: 0, prevented: false };
        (window as unknown as { __c5wheel?: WheelProbe }).__c5wheel = probe;

        // A bubbling window listener runs after every element-level listener,
        // so it sees any preventDefault the page performed.
        window.addEventListener("wheel", (event) => {
          probe.count += 1;
          if (event.defaultPrevented) probe.prevented = true;
        });
      });

      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const viewport = page.viewportSize() ?? { width: 1280, height: 720 };
      await page.mouse.move(
        Math.floor(viewport.width / 2),
        Math.floor(viewport.height / 2),
      );
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(200);

      const probe = await page.evaluate(
        () => (window as unknown as { __c5wheel: WheelProbe }).__c5wheel,
      );
      expect(probe.count, "wheel event was dispatched").toBeGreaterThan(0);
      expect(
        probe.prevented,
        "wheel must not be defaultPrevented",
      ).toBe(false);
    });
  }
});
