/**
 * Cover generator. Every post and project gets a cover composed from its slug and title:
 * a palette, a layout, a set of shapes, headline width/weight and a barcode. Pure and deterministic,
 * so a cover never changes between builds unless its slug or title does.
 */

export const PALETTES = ["vermilion", "cobalt", "saffron", "bubblegum", "emerald", "night", "lilac", "forest"] as const;
export const LAYOUTS = ["sun", "bands", "initial", "grid", "arcs", "split"] as const;

export type Palette = (typeof PALETTES)[number];
export type Layout = (typeof LAYOUTS)[number];
/** Colour roles, resolved by the palette's CSS custom properties. */
export type Tone = "pop" | "deep" | "ink" | "field";

export interface Shape {
  d: string;
  tone: Tone;
  /** Stroke width in viewBox units; filled when absent. */
  stroke?: number;
}

export interface Art {
  width: number;
  height: number;
  shapes: Shape[];
}

export interface Cover {
  palette: Palette;
  layout: Layout;
  /** Headline sits above or below the artwork. */
  titleAt: "top" | "bottom";
  /** Anybody width axis (50–150) and weight. */
  wdth: number;
  wght: number;
  upper: boolean;
  /** Headline size in container-inline units, for the portrait and the wide spread frame. */
  size: number;
  spreadSize: number;
  initial: string;
  portrait: Art;
  spread: Art;
  /** Masthead size in cqi, so "PROL" keeps the same width whatever the cover's width axis. */
  mastSize: number;
  /** Bar widths for the barcode, 1–3 units each, and the digits printed under it. */
  barcode: number[];
  digits: string;
}

/** Changing the salt reshuffles every cover on the site. */
const SALT = "prol-1640";

/** FNV-1a: a small, stable string hash. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (const char of text) {
    h ^= char.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193);
  }
  // Murmur3 finaliser: FNV's low bits mix poorly, and the palette is picked from them.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** mulberry32: a seeded PRNG returning floats in [0, 1). */
function prng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
const pick = <T>(rand: Rand, list: readonly T[]): T => list[Math.floor(rand() * list.length)] as T;
const between = (rand: Rand, min: number, max: number) => min + rand() * (max - min);
const r1 = (n: number) => Math.round(n * 10) / 10;

const circle = (cx: number, cy: number, r: number) =>
  `M${r1(cx - r)} ${r1(cy)}a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0Z`;
const rect = (x: number, y: number, w: number, h: number) => `M${r1(x)} ${r1(y)}h${r1(w)}v${r1(h)}h${r1(-w)}Z`;
const poly = (...points: [number, number][]) => `M${points.map(([x, y]) => `${r1(x)} ${r1(y)}`).join("L")}Z`;

/** Shapes for one layout in a W×H frame. The headline zone is kept to the top or bottom third. */
function compose(layout: Layout, W: number, H: number, rand: Rand): Shape[] {
  const wide = W > H;
  const S = Math.min(W, H);
  switch (layout) {
    case "sun": {
      const r = S * between(rand, 0.36, 0.46);
      const cx = W * (wide ? between(rand, 0.62, 0.78) : between(rand, 0.5, 0.7));
      const cy = H * (wide ? 0.5 : 0.4);
      return [
        { d: circle(cx, cy, r), tone: "pop" },
        { d: circle(cx - r * 0.95, cy + r * 0.55, r * between(rand, 0.18, 0.28)), tone: "deep" },
        { d: rect(0, cy + r * 0.2, W, S * 0.012), tone: "ink" },
      ];
    }
    case "bands": {
      const shapes: Shape[] = [];
      const top = H * (wide ? 0.0 : 0.5);
      let y = top;
      const tones: Tone[] = rand() > 0.5 ? ["pop", "deep"] : ["deep", "pop"];
      for (let i = 0; y < H; i++) {
        const h = H * between(rand, 0.035, 0.11) * (wide ? 1.3 : 1);
        const gap = H * between(rand, 0.015, 0.05);
        const x = wide ? W * 0.55 : 0;
        shapes.push({ d: rect(x, y, W - x, h), tone: tones[i % 2] as Tone });
        y += h + gap;
      }
      return shapes;
    }
    case "initial":
      // The giant initial is set in HTML type; the art only adds a ground and a rule.
      return [
        { d: rect(0, H * 0.84, W, H * 0.16), tone: "deep" },
        { d: circle(W * 0.12, H * 0.84, S * 0.05), tone: "pop" },
      ];
    case "grid": {
      const shapes: Shape[] = [];
      const cols = wide ? 8 : 6;
      const rows = wide ? 4 : 3;
      const x0 = wide ? W * 0.42 : W * 0.06;
      const y0 = wide ? H * 0.12 : H * 0.15;
      const cell = wide ? (W * 0.52) / cols : (W * 0.88) / cols;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = x0 + cell * (col + 0.5);
          const cy = y0 + cell * (row + 0.5);
          const roll = rand();
          if (roll < 0.34) shapes.push({ d: circle(cx, cy, cell * 0.42), tone: "pop" });
          else if (roll < 0.52)
            shapes.push({ d: rect(cx - cell * 0.42, cy - cell * 0.42, cell * 0.84, cell * 0.84), tone: "deep" });
          else if (roll < 0.8) shapes.push({ d: circle(cx, cy, cell * 0.36), tone: "ink", stroke: S * 0.008 });
        }
      }
      return shapes;
    }
    case "arcs": {
      const right = rand() > 0.5;
      const cx = right ? W : wide ? W * 0.45 : 0;
      const cy = H;
      const tones: Tone[] = ["pop", "deep", "field"];
      const count = 5;
      const R = S * (wide ? 0.95 : 0.78);
      return Array.from({ length: count }, (_, i) => ({
        d: circle(cx, cy, R * (1 - i / count)),
        tone: tones[i % 3] as Tone,
      }));
    }
    case "split": {
      const k = between(rand, 0.3, 0.6);
      return [
        { d: poly([W, H * (wide ? 0 : 0.12)], [W, H], [W * (wide ? 0.35 : 0), H]), tone: "deep" },
        {
          d: poly([W * (1 - k), 0], [W * (1 - k) + S * 0.1, 0], [W * 0.3 + S * 0.1, H], [W * 0.3, H]),
          tone: "pop",
        },
      ];
    }
  }
}

/**
 * Headline size (in cqi) that fits the frame: the longest word must fit the width,
 * and the whole headline must fit its share of the height.
 */
/** Average glyph advance of Anybody in em, at a given width axis. */
const advance = (wdth: number, upper: boolean) => (0.18 + wdth * 0.0042) * (upper ? 1.15 : 1);

function fit(title: string, wdth: number, upper: boolean, width: number, height: number, max: number): number {
  const em = advance(wdth, upper);
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  const byWord = width / (longest * em);
  const byArea = Math.sqrt((width * height) / (title.length * em * 0.98));
  return Math.round(Math.min(byWord, byArea * 0.9, max) * 10) / 10;
}

function barcode(rand: Rand): number[] {
  return Array.from({ length: 30 }, () => 1 + Math.floor(rand() * 3));
}

const digits = (seed: number) =>
  `${String(seed).padStart(10, "0").slice(0, 10)}`.replace(/(\d)(\d{5})(\d{4})/, "$1 $2 $3");

export function makeCover(slug: string, title: string): Cover {
  const seed = hash(`${SALT}:${slug}`);
  const rand = prng(seed);
  const palette = PALETTES[seed % PALETTES.length] as Palette;
  const layout = LAYOUTS[Math.floor(seed / PALETTES.length) % LAYOUTS.length] as Layout;
  const wdth = pick(rand, [62, 75, 88, 110, 125, 140]);
  // Condensed widths get lighter caps at most, so counters stay open.
  const wght = Math.min(pick(rand, [600, 700, 800, 900]), wdth < 80 ? 800 : 900);
  const upper = title.length < 36 && rand() > 0.35;
  const titleAt = ["sun", "grid", "split"].includes(layout) ? "bottom" : "top";
  const artRand = prng(seed ^ 0x9e3779b9);
  return {
    palette,
    layout,
    titleAt,
    wdth,
    wght,
    upper,
    size: fit(title, wdth, upper, 88, 58, 30),
    spreadSize: fit(title, wdth, upper, 58, 30, 13),
    initial: (title.match(/\p{L}|\p{N}/u)?.[0] ?? "P").toUpperCase(),
    portrait: { width: 400, height: 500, shapes: compose(layout, 400, 500, artRand) },
    spread: { width: 1000, height: 500, shapes: compose(layout, 1000, 500, prng(seed ^ 0x85ebca6b)) },
    mastSize: Math.round((26 / (4 * advance(wdth, true))) * 10) / 10,
    barcode: barcode(prng(seed ^ 0xc2b2ae35)),
    digits: digits(seed),
  };
}
