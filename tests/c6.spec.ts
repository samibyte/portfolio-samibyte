import { test, expect, type Page } from "@playwright/test";

test.use({
  launchOptions: {
    args: ["--use-gl=angle", "--use-angle=gl", "--ignore-gpu-blocklist"],
  },
});

const SECTION_IDS = ["hero", "projects", "about", "skills", "contact", "closing"];

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

type Target = {
  tag: string;
  text: string;
  width: number;
  height: number;
};

/**
 * Visible interactive elements that a pointer can actually hit. Elements in an
 * aria-hidden subtree (the honeypot) and `tabindex="-1"` never receive pointer
 * focus, and the skip link is visually hidden until focused — WCAG 2.5.8
 * exempts targets that are not visible.
 */
async function measureTargets(page: Page): Promise<Target[]> {
  return page.evaluate(() => {
    const targets: Target[] = [];
    const candidates = document.querySelectorAll<HTMLElement>(
      "a[href], button, input, select, textarea, summary",
    );

    for (const el of candidates) {
      if (el.closest('[aria-hidden="true"]')) continue;
      if (el.tabIndex === -1) continue;

      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      if (el.classList.contains("sr-only") && document.activeElement !== el) {
        continue;
      }

      targets.push({
        tag: el.tagName,
        text: (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40),
        width: rect.width,
        height: rect.height,
      });
    }

    return targets;
  });
}

type Stop = {
  index: number;
  tag: string;
  text: string;
  outlineStyle: string;
  outlineWidth: number;
  ringMatchesZoneText: boolean;
  width: number;
  height: number;
  top: number;
  bottom: number;
  unobscured: boolean;
};

/** Press Tab until focus leaves the document, recording every stop. */
async function collectTabStops(
  page: Page,
): Promise<{ stops: Stop[]; trapped: boolean }> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });

  const stops: Stop[] = [];
  const visited = new Set<number>();
  const viewport = page.viewportSize() ?? { width: 1280, height: 720 };

  for (let press = 0; press < 150; press++) {
    await page.keyboard.press("Tab");

    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;

      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])',
        ),
      );
      const index = focusables.indexOf(el);
      if (index === -1) return null;

      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const x = Math.min(
        Math.max(rect.left + rect.width / 2, 0),
        window.innerWidth - 1,
      );
      const y = Math.min(
        Math.max(rect.top + rect.height / 2, 0),
        window.innerHeight - 1,
      );
      const hit = document.elementFromPoint(x, y);

      // Inside a zone the ring must use that zone's --text token.
      const zone = el.closest<HTMLElement>("[data-zone]");
      let ringMatchesZoneText = true;
      if (zone) {
        const probe = document.createElement("span");
        probe.style.color = getComputedStyle(zone)
          .getPropertyValue("--text")
          .trim();
        document.body.appendChild(probe);
        const expected = getComputedStyle(probe).color;
        probe.remove();
        ringMatchesZoneText = style.outlineColor === expected;
      }

      return {
        index,
        tag: el.tagName,
        text: (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40),
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth) || 0,
        ringMatchesZoneText,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        bottom: rect.bottom,
        unobscured: hit !== null && (hit === el || el.contains(hit)),
      };
    });

    if (!stop) break;

    if (visited.has(stop.index)) {
      // Returning to the very first stop is the browser wrapping the cycle.
      if (stop.index === stops[0]?.index) break;
      return { stops, trapped: true };
    }

    visited.add(stop.index);
    stops.push(stop);

    if (stop.bottom < 0 || stop.top > viewport.height) break;
  }

  return { stops, trapped: false };
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
    await page.waitForSelector("canvas[data-ocean-canvas]", { timeout: 30_000 });
    await page.waitForTimeout(500);

    await page.locator("canvas[data-ocean-canvas]").evaluate((element) => {
      const canvas = element as HTMLCanvasElement;
      const gl = canvas.getContext("webgl2");
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    });

    await expect(page.locator("canvas[data-ocean-canvas]")).toHaveCount(0);
    await expect(page.locator("#contact form")).toHaveCount(1);
    const backgrounds = await page.locator("[data-zone]").evaluateAll((nodes) =>
      nodes.map((node) => getComputedStyle(node).backgroundImage),
    );
    for (const background of backgrounds) {
      expect(background).not.toBe("none");
    }
  });

  test("case-study links navigate to real external sources", async ({ page }) => {
    await page.goto("/projects/stitchlogic");
    await page.waitForLoadState("networkidle");

    const sourceLink = page.locator('a:has-text("Source"):visible').first();
    await expect(sourceLink).toHaveAttribute("href", /^https?:\/\//);

    const liveLink = page.locator('a:has-text("Live"):visible').first();
    await expect(liveLink).toHaveAttribute("href", /^https?:\/\//);
  });
});

test.describe("P6.5: accessibility pass", () => {
  test("every visible interactive target is at least 24×24 CSS px", async ({
    page,
  }) => {
    for (const path of ["/", "/projects/stitchlogic"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const targets = await measureTargets(page);
      expect(targets.length, `${path} should expose interactive targets`).toBeGreaterThan(0);

      for (const target of targets) {
        expect(
          target.width,
          `${path}: ${target.tag} "${target.text}" is narrower than 24 px`,
        ).toBeGreaterThanOrEqual(24);
        expect(
          target.height,
          `${path}: ${target.tag} "${target.text}" is shorter than 24 px`,
        ).toBeGreaterThanOrEqual(24);
      }
    }
  });

  test("the Tab pass has no trap, no invisible focus, and no obscured focus", async ({
    page,
  }) => {
    for (const path of ["/", "/projects/stitchlogic"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const stops = await collectTabStops(page);
      expect(
        stops.trapped,
        `${path}: focus is trapped on one element`,
      ).toBe(false);
      expect(
        stops.stops.length,
        `${path} should be keyboard reachable`,
      ).toBeGreaterThan(path === "/" ? 12 : 4);

      for (let i = 0; i < stops.stops.length; i++) {
        const stop = stops.stops[i];
        const label = `${path}: stop ${i} ${stop.tag} "${stop.text}"`;

        // No trap: focus advances to a new element on every press.
        if (i > 0) {
          expect(stop.index, `${label} repeats the previous stop`).not.toBe(
            stops.stops[i - 1].index,
          );
        }

        expect(stop.width, `${label} has zero width`).toBeGreaterThan(0);
        expect(stop.height, `${label} has zero height`).toBeGreaterThan(0);
        expect(stop.bottom, `${label} is above the viewport`).toBeGreaterThan(0);
        expect(stop.top, `${label} is below the viewport`).toBeLessThan(
          (page.viewportSize() ?? { height: 720 }).height,
        );

        // Focus is never fully obscured by the fixed nav, sticky bar or toggle.
        expect(stop.unobscured, `${label} is covered by chrome`).toBe(true);

        // Focus is always visible: 2 px ring at 2 px offset (globals.css).
        expect(stop.outlineStyle, `${label} has no outline`).not.toBe("none");
        expect(
          stop.outlineWidth,
          `${label} ring is thinner than 2 px`,
        ).toBeGreaterThanOrEqual(2);
        expect(
          stop.ringMatchesZoneText,
          `${label} ring does not use the zone --text token`,
        ).toBe(true);
      }
    }
  });

  test("the skip link moves focus to main-content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("form labels and validation errors are linked", async ({ page }) => {
    await page.goto("/#contact");
    await page.waitForLoadState("networkidle");

    await page.locator("#contact form button[type='submit']").click();

    for (const field of ["name", "email", "message"]) {
      await expect(
        page.locator(`label[for='contact-${field}']`),
      ).toHaveCount(1);

      const input = page.locator(`#contact [name='${field}']`);
      await expect(input).toHaveAttribute("aria-invalid", "true");

      const describedBy = await input.getAttribute("aria-describedby");
      expect(describedBy, `${field} error is not linked`).toBeTruthy();

      const error = page.locator(`#${describedBy}`);
      await expect(error).toBeVisible();
      await expect(error).toHaveText(/\S/);
    }
  });

  test("in-page navigation never hides the destination under the fixed nav", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await openMobileMenu(page);
    await page.locator('nav a[href="/#skills"]:visible').first().click();
    await expect
      .poll(() => page.evaluate(() => window.location.hash))
      .toBe("#skills");

    const navBottom = await page
      .locator("nav")
      .evaluate((nav) => nav.getBoundingClientRect().bottom);
    const sectionTop = await page
      .locator("#skills")
      .evaluate((section) => section.getBoundingClientRect().top);

    expect(sectionTop).toBeGreaterThanOrEqual(navBottom);
  });

  test("the canvas is decorative, images have alt text, and the nav marks the current page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("canvas[data-ocean-canvas]", { timeout: 30_000 });
    await expect(page.locator("canvas[data-ocean-canvas]").first()).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(page.locator("img:not([alt])")).toHaveCount(0);

    await expect(page.locator('nav a[href="/"]').first()).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.goto("/projects/stitchlogic");
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator('nav a[href="/#projects"]').first(),
    ).toHaveAttribute("aria-current", "page");
  });

  test("the skills list is announced once per item", async ({ page }) => {
    await page.goto("/#skills");
    await page.waitForLoadState("networkidle");

    const snapshot = await page.locator("#skills").ariaSnapshot();
    const lines = snapshot.split("\n").map((line) => line.trim());
    const items = await page.locator("[data-skill]").allTextContents();

    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items).size, "no duplicated skill chips").toBe(items.length);

    for (const item of items) {
      const announced = lines.filter((line) => line === `- listitem: ${item}`);
      expect(announced.length, `"${item}" is announced once`).toBe(1);
    }
  });
});

test.describe("C6: Projects, Resume and Contact reachable without scrolling", () => {
  for (const suffix of ["", "?fx=off"]) {
    const mode = suffix === "" ? "effects on" : "?fx=off";

    test(`${mode}: clickable from a cold load at scroll 0`, async ({ page }) => {
      await page.goto(`/${suffix}`);
      await page.waitForLoadState("networkidle");

      // Cold load: the page has not been scrolled at all.
      expect(await page.evaluate(() => window.scrollY)).toBe(0);

      const viewport = page.viewportSize() ?? { width: 1280, height: 720 };

      // In-page anchors. Desktop clicks the fixed nav directly; mobile needs
      // one tap on Menu plus one tap on the link (≤ 2 taps).
      for (const { label, hash } of [
        { label: "Projects", hash: "#projects" },
        { label: "Contact", hash: "#contact" },
      ]) {
        await page.evaluate(() => window.scrollTo(0, 0));
        await openMobileMenu(page);

        const link = page
          .locator("nav")
          .getByRole("link", { name: label, exact: true })
          .first();
        await expect(link).toBeVisible();

        const rect = await link.boundingBox();
        if (!rect) throw new Error(`${label} has no bounding box`);
        expect(rect.y, `${label} is above the viewport`).toBeGreaterThanOrEqual(
          0,
        );
        expect(
          rect.y + rect.height,
          `${label} is below the viewport`,
        ).toBeLessThanOrEqual(viewport.height);
        expect(
          await page.evaluate(() => window.scrollY),
          `${label} must be clickable without scrolling`,
        ).toBe(0);

        await link.click();
        await expect
          .poll(() => page.evaluate(() => window.location.hash))
          .toBe(hash);
      }

      // Resume is external and opens in a new tab.
      await page.evaluate(() => window.scrollTo(0, 0));
      await openMobileMenu(page);
      const resume = page
        .locator("nav")
        .getByRole("link", { name: "Resume", exact: true })
        .first();
      await expect(resume).toBeVisible();

      const rect = await resume.boundingBox();
      if (!rect) throw new Error("Resume has no bounding box");
      expect(rect.y, "Resume is above the viewport").toBeGreaterThanOrEqual(0);
      expect(
        rect.y + rect.height,
        "Resume is below the viewport",
      ).toBeLessThanOrEqual(viewport.height);
      expect(
        await page.evaluate(() => window.scrollY),
        "Resume must be clickable without scrolling",
      ).toBe(0);
      await expect(resume).toHaveAttribute("href", /^https?:\/\//);

      const [popup] = await Promise.all([
        page.waitForEvent("popup"),
        resume.click(),
      ]);
      await expect.poll(() => popup.url()).toMatch(/^https?:\/\//);
    });
  }
});
