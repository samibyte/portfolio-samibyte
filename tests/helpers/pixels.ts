import { PNG } from "pngjs";

type Rect = { x: number; y: number; width: number; height: number };

export function decode(png: Buffer) {
  const img = PNG.sync.read(png);
  return {
    width: img.width,
    height: img.height,
    at(x: number, y: number): [number, number, number] {
      const i = (img.width * y + x) << 2;
      return [img.data[i], img.data[i + 1], img.data[i + 2]];
    },
  };
}

function channelToLinear(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function meanLuma(
  img: { width: number; height: number; at(x: number, y: number): [number, number, number] },
  rect?: Rect,
): number {
  const area: Rect = rect ?? { x: 0, y: 0, width: img.width, height: img.height };
  const x0 = Math.max(0, Math.floor(area.x));
  const y0 = Math.max(0, Math.floor(area.y));
  const x1 = Math.min(img.width, Math.ceil(area.x + area.width));
  const y1 = Math.min(img.height, Math.ceil(area.y + area.height));
  if (x1 <= x0 || y1 <= y0) throw new Error(`meanLuma: empty rect ${JSON.stringify(area)}`);

  let sum = 0;
  let n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const [r, g, b] = img.at(x, y);
      sum +=
        0.2126 * channelToLinear(r) +
        0.7152 * channelToLinear(g) +
        0.0722 * channelToLinear(b);
      n++;
    }
  }
  return sum / n;
}
