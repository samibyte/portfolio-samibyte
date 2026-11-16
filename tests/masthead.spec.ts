import { test, expect, type Page } from "@playwright/test";

const ABOVE_LETTERS = '[data-masthead="above"] [data-letter]';

async function letterTransforms(page: Page): Promise<string[]> {
  return page.$$eval(ABOVE_LETTERS, (nodes) =>
    nodes.map((node) => getComputedStyle(node).transform),
  );
}

test.describe("P10.5 hero masthead (variant A)", () => {
  // The software GL shader is slow in CI; the assertions are unchanged.
  test.describe.configure({ timeout: 120_000 });

  test("accessible name, letter count and decorative copies", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", {
      level: 1,
      name: "Sami Adnan",
      exact: true,
    });
    await expect(heading).toHaveCount(1);
    await expect(heading).toBeVisible();
    await expect(heading).toHaveAttribute("id", "hero-title");

    await expect(page.locator(ABOVE_LETTERS)).toHaveCount(9);

    const visibleText = (
      (await page.locator('[data-masthead="above"]').textContent()) ?? ""
    ).replace(/\s+/g, "");
    expect(visibleText).toBe("SamiAdnan");

    // The submerged sliver and the reflection must not be read twice.
    await expect(page.locator('[data-masthead="below"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(page.locator('[data-masthead="reflection"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  test("word bottom sits on 30% + --submerge and the clip splits at 30%", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const geometry = await page.evaluate(() => {
      const word = document.querySelector<HTMLElement>(
        '[data-masthead="above"] [data-masthead-word]',
      );
      const above = document.querySelector<HTMLElement>(
        '[data-masthead="above"]',
      );
      if (!word || !above) return null;

      const probe = document.createElement("div");
      probe.style.cssText =
        "position:absolute;visibility:hidden;height:var(--submerge);";
      document.body.appendChild(probe);
      const submerge = probe.getBoundingClientRect().height;
      probe.remove();

      return {
        bottom: word.getBoundingClientRect().bottom,
        vh: window.innerHeight,
        submerge,
        clip: getComputedStyle(above).clipPath,
      };
    });

    expect(geometry).not.toBeNull();
    if (!geometry) return;

    const { bottom, vh, submerge, clip } = geometry;
    const match = clip.match(/inset\(([^)]+)\)/);
    expect(match, `clip-path was "${clip}"`).not.toBeNull();
    if (!match) return;

    // inset() shorthand: 1/2 values use the first, 3/4 use the third as bottom.
    const parts = match[1].trim().split(/\s+/);
    const bottomInset =
      parts.length === 1 || parts.length === 2 ? parts[0] : parts[2];
    const insetFraction = bottomInset.endsWith("%")
      ? parseFloat(bottomInset) / 100
      : parseFloat(bottomInset) / vh;
    const waterline = 1 - insetFraction;

    expect(
      Math.abs(waterline - 0.3),
      `clip split at ${(waterline * 100).toFixed(2)}% of the viewport`,
    ).toBeLessThanOrEqual(0.015);

    const expected = vh * 0.3 + submerge;
    expect(
      Math.abs(bottom - expected),
      `word bottom ${bottom.toFixed(1)} vs ${expected.toFixed(1)} px`,
    ).toBeLessThanOrEqual(vh * 0.015);
  });

  test("hero content has clear spacing and keeps its actions in view", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const layout = await page.evaluate(() => {
      const role = document.querySelector<HTMLElement>(".hero-role");
      const word = document.querySelector<HTMLElement>(
        '[data-masthead="above"] [data-masthead-word]',
      );
      const copy = document.querySelector<HTMLElement>(".hero-copy");
      const lastAction = copy?.querySelector<HTMLElement>("a:last-child");
      if (!role || !word || !copy || !lastAction) return null;

      return {
        roleBottom: role.getBoundingClientRect().bottom,
        wordTop: word.getBoundingClientRect().top,
        wordBottom: word.getBoundingClientRect().bottom,
        copyTop: copy.getBoundingClientRect().top,
        actionsBottom: lastAction.getBoundingClientRect().bottom,
        vh: window.innerHeight,
      };
    });

    expect(layout).not.toBeNull();
    if (!layout) return;

    expect(layout.roleBottom).toBeLessThan(layout.wordTop);
    expect(layout.copyTop - layout.wordBottom).toBeGreaterThanOrEqual(40);
    expect(layout.copyTop - layout.wordBottom).toBeLessThanOrEqual(64);
    expect(layout.actionsBottom).toBeLessThan(layout.vh * 0.75);
  });

  test("per-letter bob runs on the shared loop", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __oceanDebug?: { tier?: number } }).__oceanDebug = {
        tier: 0,
      };
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Let the one-time entrance stagger finish before sampling the loop.
    await page.waitForTimeout(1200);
    await expect(page.locator(ABOVE_LETTERS)).toHaveCount(9);

    // Software GL can starve the loop for a frame or two; retry the sample.
    await expect
      .poll(
        async () => {
          const first = await letterTransforms(page);
          await page.waitForTimeout(400);
          const second = await letterTransforms(page);
          return first.some((value, index) => value !== second[index]);
        },
        { timeout: 8000, intervals: [250] },
      )
      .toBe(true);
  });

  test("reduced motion freezes every letter", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const first = await letterTransforms(page);
    await page.waitForTimeout(600);
    const second = await letterTransforms(page);

    expect(second).toEqual(first);
    expect(first.every((value) => value === "none")).toBe(true);
  });

  test("the reflection is mirrored, faded and decorative", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const reflection = await page.evaluate(() => {
      const wrapper = document.querySelector<HTMLElement>(
        '[data-masthead="reflection"]',
      );
      const word = wrapper?.querySelector<HTMLElement>("[data-masthead-word]");
      if (!wrapper || !word) return null;

      return {
        ariaHidden: wrapper.getAttribute("aria-hidden"),
        opacity: parseFloat(getComputedStyle(wrapper).opacity),
        transform: getComputedStyle(word).transform,
        bottom: word.getBoundingClientRect().bottom,
        vh: window.innerHeight,
      };
    });

    expect(reflection).not.toBeNull();
    if (!reflection) return;

    expect(reflection.ariaHidden).toBe("true");
    expect(reflection.opacity).toBeGreaterThan(0);
    expect(reflection.opacity).toBeLessThanOrEqual(0.2);

    const matrix = reflection.transform.match(/matrix\(([^)]+)\)/);
    expect(matrix, `reflection transform was "${reflection.transform}"`).not.toBeNull();
    if (!matrix) return;

    const values = matrix[1].split(",").map(Number);
    expect(values[3], "reflection is scaled on Y").toBeLessThan(0);
    expect(reflection.bottom).toBeGreaterThan(reflection.vh * 0.3);
  });
});
