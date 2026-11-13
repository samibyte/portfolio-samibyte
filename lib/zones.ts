import type { Zone, ZoneId } from "./types";

export interface SectionOffset {
  id: string;
  zone: ZoneId;
  pageTop: number;
  pageBottom: number;
}

export const ZONES: Zone[] = [
  {
    id: "surface",
    label: "Surface",
    metersFrom: 0,
    metersTo: 30,
    bgTop: "#87CEEB",
    bgBot: "#00CED1",
    text: "#0a1628",
    accent: "#87CEEB",
    rays: 0.5,
    caustics: 0.3,
    snow: 0,
    glow: 0,
  },
  {
    id: "sunlight",
    label: "Sunlight",
    metersFrom: 30,
    metersTo: 200,
    bgTop: "#00CED1",
    bgBot: "#339FA8",
    text: "#0a1628",
    accent: "#00CED1",
    rays: 0.4,
    caustics: 0.25,
    snow: 0.1,
    glow: 0,
  },
  {
    id: "twilight",
    label: "Twilight",
    metersFrom: 200,
    metersTo: 1000,
    bgTop: "#1a3a5c",
    bgBot: "#0d1f3c",
    text: "#e0e8f0",
    accent: "#2a6496",
    rays: 0.15,
    caustics: 0.08,
    snow: 0.4,
    glow: 0,
  },
  {
    id: "midnight",
    label: "Midnight",
    metersFrom: 1000,
    metersTo: 4000,
    bgTop: "#0a1628",
    bgBot: "#050d1a",
    text: "#c0d0e0",
    accent: "#1a3a6e",
    rays: 0.02,
    caustics: 0,
    snow: 0.7,
    glow: 0,
  },
  {
    id: "abyss",
    label: "Abyss",
    metersFrom: 4000,
    metersTo: 6000,
    bgTop: "#050d1a",
    bgBot: "#020408",
    text: "#b4c2d0",
    accent: "#ff9f43",
    rays: 0,
    caustics: 0,
    snow: 1,
    glow: 1,
  },
];

export const SECTION_ZONE: Record<string, ZoneId> = {
  hero: "surface",
  projects: "sunlight",
  about: "twilight",
  skills: "midnight",
  contact: "abyss",
  problem: "sunlight",
  solution: "twilight",
  challenge: "abyss",
  outcome: "midnight",
  takeaway: "twilight",
};

const ZONES_BY_ID = new Map<ZoneId, Zone>(ZONES.map((zone) => [zone.id, zone]));

let sections: SectionOffset[] = [];

export function setSectionOffsets(offsets: readonly SectionOffset[]): void {
  sections = offsets.map((offset) => ({ ...offset }));
}

function zoneOf(section: SectionOffset): Zone {
  return ZONES_BY_ID.get(section.zone) ?? ZONES[0];
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function bgAt(pageY: number): [number, number, number] {
  if (sections.length === 0) return hexToRgb(ZONES[0].bgTop);

  const first = sections[0];
  if (pageY <= first.pageTop) return hexToRgb(zoneOf(first).bgTop);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const zone = zoneOf(section);

    if (pageY < section.pageBottom) {
      const span = Math.max(1, section.pageBottom - section.pageTop);
      const t = clamp01((pageY - section.pageTop) / span);
      return mix(hexToRgb(zone.bgTop), hexToRgb(zone.bgBot), t);
    }

    const next = sections[i + 1];
    if (!next) return hexToRgb(zone.bgBot);

    if (pageY < next.pageTop) {
      const gap = Math.max(1, next.pageTop - section.pageBottom);
      const t = smoothstep(clamp01((pageY - section.pageBottom) / gap));
      return mix(hexToRgb(zone.bgBot), hexToRgb(zoneOf(next).bgTop), t);
    }
  }

  return hexToRgb(zoneOf(sections[sections.length - 1]).bgBot);
}

export function metersAt(pageY: number): number {
  if (sections.length === 0) return ZONES[0].metersFrom;

  const first = sections[0];
  if (pageY <= first.pageTop) return zoneOf(first).metersFrom;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const zone = zoneOf(section);

    if (pageY < section.pageBottom) {
      const span = Math.max(1, section.pageBottom - section.pageTop);
      const t = clamp01((pageY - section.pageTop) / span);
      return zone.metersFrom + (zone.metersTo - zone.metersFrom) * t;
    }

    const next = sections[i + 1];
    if (!next) return zone.metersTo;

    if (pageY < next.pageTop) {
      const gap = Math.max(1, next.pageTop - section.pageBottom);
      const t = smoothstep(clamp01((pageY - section.pageBottom) / gap));
      return zone.metersTo + (zoneOf(next).metersFrom - zone.metersTo) * t;
    }
  }

  return zoneOf(sections[sections.length - 1]).metersTo;
}

export function fxAt(pageY: number): [number, number, number, number] {
  const f = (zone: Zone): [number, number, number, number] => [
    zone.rays,
    zone.caustics,
    zone.snow,
    zone.glow,
  ];

  if (sections.length === 0) return f(ZONES[0]);

  const first = sections[0];
  if (pageY <= first.pageTop) return f(zoneOf(first));

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const zone = zoneOf(section);

    if (pageY < section.pageBottom) return f(zone);

    const next = sections[i + 1];
    if (!next) return f(zone);

    if (pageY < next.pageTop) {
      const gap = Math.max(1, next.pageTop - section.pageBottom);
      const t = smoothstep(clamp01((pageY - section.pageBottom) / gap));
      const a = f(zone);
      const b = f(zoneOf(next));
      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        a[3] + (b[3] - a[3]) * t,
      ];
    }
  }

  return f(zoneOf(sections[sections.length - 1]));
}
