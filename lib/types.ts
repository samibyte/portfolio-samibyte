export type ZoneId = "surface" | "sunlight" | "twilight" | "midnight" | "abyss";

export interface Zone {
  id: ZoneId;
  label: string;
  metersFrom: number;
  metersTo: number;
  bgTop: string; // sRGB hex
  bgBot: string; // sRGB hex
  text: string; // body text, AA-checked
  accent: string; // decorative only, never text or focus
  rays: number;
  caustics: number;
  snow: number;
  glow: number; // 0-1
}

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  stack: string[];
  source?: string;
  live?: string;
  problem: string;
  solution: string;
  challenge: string;
  outcome: string;
  takeaway: string;
  role?: string;
  architecture?: string[]; // ordered node labels; hidden when absent
  decision?: { title: string; tradeoff: string; changed: string }; // hidden when absent
}
