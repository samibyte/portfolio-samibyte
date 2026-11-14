import { test, expect } from "@playwright/test";
import { decode } from "./helpers/pixels";

function channelToLinear(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function calcLuma(r: number, g: number, b: number): number {
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
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

test.describe("C4: Rendered text contrast across zones", () => {
  test("every text-bearing element meets WCAG 2.2 AA contrast against rendered background", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const { scrollHeight, innerHeight } = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
    }));

    const stepSize = Math.max(100, Math.round(innerHeight * 0.5));
    const maxScroll = Math.max(0, scrollHeight - innerHeight);

    const scrollSteps: number[] = [];
    for (let s = 0; s <= maxScroll; s += stepSize) {
      scrollSteps.push(s);
    }
    if (scrollSteps[scrollSteps.length - 1] !== maxScroll) {
      scrollSteps.push(maxScroll);
    }

    let checkedCount = 0;

    for (const scrollY of scrollSteps) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(80);

      // Collect visible text elements
      const elements = await page.evaluate(() => {
        const colorCanvas = document.createElement("canvas");
        colorCanvas.width = 1;
        colorCanvas.height = 1;
        const colorCtx = colorCanvas.getContext("2d", { willReadFrequently: true });

        function parseColor(cssColor: string): [number, number, number, number] {
          if (!colorCtx) return [0, 0, 0, 1];
          colorCtx.clearRect(0, 0, 1, 1);
          colorCtx.fillStyle = cssColor;
          colorCtx.fillRect(0, 0, 1, 1);
          const d = colorCtx.getImageData(0, 0, 1, 1).data;
          return [d[0], d[1], d[2], d[3] / 255];
        }

        const sections = Array.from(
          document.querySelectorAll<HTMLElement>("[data-zone]"),
        );
        const results: Array<{
          zone: string;
          text: string;
          colorRgba: [number, number, number, number];
          fontSize: number;
          fontWeight: string;
          rect: { x: number; y: number; width: number; height: number };
        }> = [];

        for (const section of sections) {
          const zone = section.getAttribute("data-zone") || "";
          const all = section.querySelectorAll<HTMLElement>("*");
          for (const el of all) {
            const textNodes = Array.from(el.childNodes).filter(
              (n) =>
                n.nodeType === Node.TEXT_NODE &&
                (n.nodeValue || "").trim().length > 0,
            );
            if (textNodes.length === 0) continue;

            const style = window.getComputedStyle(el);
            if (
              el.closest(".sr-only") ||
              el.closest("[aria-hidden='true']") ||
              style.display === "none" ||
              style.visibility === "hidden" ||
              parseFloat(style.opacity) === 0
            ) {
              continue;
            }

            // Use the tight range box of the text content
            const range = document.createRange();
            range.selectNodeContents(el);
            const rect = range.getBoundingClientRect();
            if (rect.width <= 2 || rect.height <= 2) continue;

            // Intersect with viewport
            if (
              rect.bottom <= 10 ||
              rect.top >= window.innerHeight - 10 ||
              rect.right <= 0 ||
              rect.left >= window.innerWidth
            ) {
              continue;
            }

            results.push({
              zone,
              text: (el.textContent || "").trim().slice(0, 30),
              colorRgba: parseColor(style.color),
              fontSize: parseFloat(style.fontSize) || 16,
              fontWeight: style.fontWeight,
              rect: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
              },
            });
          }
        }
        return results;
      });

      if (elements.length === 0) continue;

      // Make text transparent and hide fixed nav to screenshot the zone background
      const styleHandle = await page.addStyleTag({
        content:
          "[data-zone] * { color: transparent !important; } nav { display: none !important; }",
      });
      await page.waitForTimeout(50);

      const shot = await page.screenshot();
      const img = decode(shot);

      // Restore
      await styleHandle.evaluate((el) => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });

      for (const el of elements) {
        const [cr, cg, cb] = el.colorRgba;
        const textLuma = calcLuma(cr, cg, cb);

        const x0 = Math.max(0, Math.floor(el.rect.x));
        const y0 = Math.max(0, Math.floor(el.rect.y));
        const x1 = Math.min(img.width, Math.ceil(el.rect.x + el.rect.width));
        const y1 = Math.min(img.height, Math.ceil(el.rect.y + el.rect.height));

        if (x1 - x0 < 4 || y1 - y0 < 4) continue;

        const lumas: number[] = [];
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const [r, g, b] = img.at(x, y);
            lumas.push(calcLuma(r, g, b));
          }
        }

        if (lumas.length === 0) continue;
        lumas.sort((a, b) => a - b);

        const medianBg = lumas[Math.floor(lumas.length * 0.5)];
        const isLight = textLuma > medianBg;
        const p95 =
          lumas[Math.min(lumas.length - 1, Math.floor(lumas.length * 0.95))];
        const p5 = lumas[Math.max(0, Math.floor(lumas.length * 0.05))];
        const worstBgLuma = isLight ? p95 : p5;

        const [hi, lo] =
          textLuma > worstBgLuma
            ? [textLuma, worstBgLuma]
            : [worstBgLuma, textLuma];
        const contrast = (hi + 0.05) / (lo + 0.05);

        const isBold =
          el.fontWeight === "bold" || parseInt(el.fontWeight, 10) >= 600;
        const isLarge =
          el.fontSize >= 24 || (isBold && el.fontSize >= 18.66);
        const minContrast = isLarge ? 3.0 : 4.5;

        expect(
          contrast,
          `Zone "${el.zone}", text "${el.text}" (${el.fontSize}px, weight ${el.fontWeight}): contrast ${contrast.toFixed(2)} < ${minContrast}`,
        ).toBeGreaterThanOrEqual(minContrast);

        checkedCount++;
      }
    }

    expect(checkedCount).toBeGreaterThan(20);
  });
});
