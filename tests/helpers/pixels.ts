import { PNG } from "pngjs";

export type Rect = { x: number; y: number; width: number; height: number };

export interface DecodedImage {
  width: number;
  height: number;
  at(x: number, y: number): [number, number, number];
}

export function decode(png: Buffer): DecodedImage {
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

export type ColorInput = [number, number, number] | string;

export function parseRgb(color: ColorInput): [number, number, number] {
  if (typeof color === "string") {
    const h = color.replace("#", "");
    if (h.length === 6) {
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    }
    if (h.length === 3) {
      return [
        parseInt(h[0] + h[0], 16),
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16),
      ];
    }
    throw new Error(`Invalid hex color: "${color}"`);
  }
  return color;
}

export function channelToLinear(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuma(color: ColorInput): number {
  const [r, g, b] = parseRgb(color);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

export function hue(color: ColorInput): number {
  const [r255, g255, b255] = parseRgb(color);
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;

  let h: number;
  if (max === r) {
    h = ((g - b) / delta) % 6;
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return h;
}

export function saturation(color: ColorInput): number {
  const [r255, g255, b255] = parseRgb(color);
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  const l = (max + min) / 2;
  return delta / (1 - Math.abs(2 * l - 1));
}

export interface RegionMean {
  luma: number;
  r: number;
  g: number;
  b: number;
  valueOf(): number;
}

export function meanRegion(img: DecodedImage, rect?: Rect): RegionMean {
  const area: Rect = rect ?? { x: 0, y: 0, width: img.width, height: img.height };
  const x0 = Math.max(0, Math.floor(area.x));
  const y0 = Math.max(0, Math.floor(area.y));
  const x1 = Math.min(img.width, Math.ceil(area.x + area.width));
  const y1 = Math.min(img.height, Math.ceil(area.y + area.height));
  if (x1 <= x0 || y1 <= y0) {
    return { luma: 0, r: 0, g: 0, b: 0, valueOf() { return 0; } };
  }

  let sumLuma = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let n = 0;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const rgb = img.at(x, y);
      sumR += rgb[0];
      sumG += rgb[1];
      sumB += rgb[2];
      sumLuma += relativeLuma(rgb);
      n++;
    }
  }

  const luma = sumLuma / n;
  return {
    luma,
    r: sumR / n,
    g: sumG / n,
    b: sumB / n,
    valueOf() {
      return luma;
    },
  };
}

export function meanLuma(img: DecodedImage, rect?: Rect): number {
  return meanRegion(img, rect).luma;
}

export function diffRatio(
  imgA: DecodedImage,
  imgB: DecodedImage,
  rect?: Rect,
  threshold = 0,
): number {
  const area: Rect = rect ?? {
    x: 0,
    y: 0,
    width: Math.min(imgA.width, imgB.width),
    height: Math.min(imgA.height, imgB.height),
  };
  const x0 = Math.max(0, Math.floor(area.x));
  const y0 = Math.max(0, Math.floor(area.y));
  const x1 = Math.min(imgA.width, imgB.width, Math.ceil(area.x + area.width));
  const y1 = Math.min(imgA.height, imgB.height, Math.ceil(area.y + area.height));
  if (x1 <= x0 || y1 <= y0) return 0;

  let diffCount = 0;
  let total = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const a = imgA.at(x, y);
      const b = imgB.at(x, y);
      const delta = Math.max(
        Math.abs(a[0] - b[0]),
        Math.abs(a[1] - b[1]),
        Math.abs(a[2] - b[2]),
      );
      if (delta > threshold) {
        diffCount++;
      }
      total++;
    }
  }
  return total > 0 ? diffCount / total : 0;
}
