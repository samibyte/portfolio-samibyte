import { test, expect, type Page } from "@playwright/test";

test.use({
  launchOptions: {
    args: ["--use-gl=angle", "--use-angle=gl", "--ignore-gpu-blocklist"],
  },
});

const SECTION_IDS = ["hero", "projects", "about", "skills", "contact"];

async function openMobileMenu(page: Page) {
  const menu = page.getByRole("button", { name: "Menu" });
  if (!(await menu.isVisible())) return;

  // A click can land before React has hydrated; retry until the menu opens.
  for (let attempt = 0; attempt < 5; attempt++) {
    if ((await menu.getAttribute("aria-expanded")) === "true") return;
    await menu.click();
    await page.waitForTimeout(150);
  }
  await expect(menu).toHaveAttribute("aria-expanded", "true");
}

async function expectStaticFallback(page: Page) {
  // No canvas at all: the CSS gradient is the only background.
  await expect(page.locator("canvas")).toHaveCount(0);

  const sections = await page.locator("[data-zone]").evaluateAll((nodes) =>
    nodes.map((node) => ({
      id: node.id,
      background: getComputedStyle(node).backgroundImage,
    })),
  );
  expect(sections.map((section) => section.id)).toEqual(SECTION_IDS);
  for (const section of sections) {
    expect(section.background).not.toBe("none");
  }

  // Every section still renders, and the contact form is still usable.
  await expect(page.locator("#contact form")).toHaveCount(1);
  await expect(page.locator("#contact input[name='name']")).toHaveCount(1);
  await expect(page.locator("#contact input[name='email']")).toHaveCount(1);
  await expect(page.locator("#contact textarea[name='message']")).toHaveCount(1);
  await expect(
    page.locator("#contact form button[type='submit']"),
  ).toBeVisible();

  // The C6 links exist, and the in-page ones still navigate.
  const resume = page.locator('nav a[target="_blank"]').first();
  await expect(resume).toHaveAttribute("href", /^https?:\/\//);

  for (const href of ["/#projects", "/#contact"]) {
    await openMobileMenu(page);

    const link = page.locator(`nav a[href="${href}"]:visible`).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect
      .poll(() => page.evaluate(() => window.location.hash))
      .toBe(href.slice(1));
  }
}

test.describe("C6: no-WebGL fallback", () => {
  test("?fx=off renders the static fallback, every section and the C6 links", async ({
    page,
  }) => {
    await page.goto("/?fx=off");
    await page.waitForLoadState("networkidle");
    await expectStaticFallback(page);
  });

  test("a missing WebGL2 context renders the static fallback, every section and the C6 links", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = (() =>
        null) as typeof HTMLCanvasElement.prototype.getContext;
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expectStaticFallback(page);
  });

  test("webglcontextlost removes the canvas and falls back to the static gradient", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("canvas", { timeout: 30_000 });
    await page.waitForTimeout(500);

    await page.locator("canvas").evaluate((element) => {
      const canvas = element as HTMLCanvasElement;
      const gl = canvas.getContext("webgl2");
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    });

    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator("#contact form")).toHaveCount(1);
    const backgrounds = await page.locator("[data-zone]").evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).backgroundImage),
    );
    for (const background of backgrounds) {
      expect(background).not.toBe("none");
    }
  });
});
