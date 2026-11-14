/**
 * Package art for the snack machine, generated from a snack's data:
 * kind picks the silhouette, the title picks the colourway and pattern, and the verdict is the seal.
 * Everything is drawn on an 80 x 104 canvas by SnackPack.astro.
 */
import type { Snack } from "./content";

export type PackShape = "bag" | "box" | "can" | "jar" | "pouch" | "blister";
export type PackColourway = "navy" | "cobalt" | "yellow" | "paper" | "sky";
export type PackPattern = "plot" | "grid" | "stripes" | "dots" | "waves" | "rings";

export const PACK_WIDTH = 80;
export const PACK_HEIGHT = 104;

const SHAPES: Record<Snack["data"]["kind"], PackShape> = {
  model: "bag",
  app: "box",
  cli: "can",
  library: "jar",
  service: "pouch",
  hardware: "blister",
};
const COLOURWAYS: PackColourway[] = ["cobalt", "navy", "yellow", "paper", "sky"];
const PATTERNS: PackPattern[] = ["plot", "grid", "stripes", "dots", "waves", "rings"];

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Layout {
  /** Where the kind label and title go. */
  label: Box;
  /** Largest number of title lines that fit. */
  maxLines: number;
  /** Band the pattern is drawn in. */
  pattern: Box;
  /** Centre and radius of the verdict seal. */
  seal: { x: number; y: number; r: number };
}

const LAYOUTS: Record<PackShape, Layout> = {
  bag: {
    label: { x: 13, y: 26, w: 54, h: 38 },
    maxLines: 3,
    pattern: { x: 6, y: 64, w: 68, h: 27 },
    seal: { x: 58, y: 77, r: 9 },
  },
  box: {
    label: { x: 11, y: 26, w: 49, h: 40 },
    maxLines: 3,
    pattern: { x: 5, y: 68, w: 60, h: 33 },
    seal: { x: 51, y: 85, r: 9 },
  },
  can: {
    label: { x: 16, y: 40, w: 48, h: 34 },
    maxLines: 3,
    pattern: { x: 10, y: 66, w: 60, h: 20 },
    seal: { x: 57, y: 76, r: 8.5 },
  },
  jar: {
    label: { x: 17, y: 49, w: 46, h: 30 },
    maxLines: 2,
    pattern: { x: 12, y: 23, w: 56, h: 78 },
    seal: { x: 60, y: 86, r: 8.5 },
  },
  pouch: {
    label: { x: 16, y: 30, w: 48, h: 36 },
    maxLines: 3,
    pattern: { x: 7, y: 64, w: 66, h: 24 },
    seal: { x: 59, y: 78, r: 9 },
  },
  blister: {
    label: { x: 11, y: 64, w: 58, h: 28 },
    maxLines: 2,
    pattern: { x: 5, y: 90, w: 70, h: 11 },
    seal: { x: 64, y: 22, r: 8.5 },
  },
};

/** FNV-1a: small, stable and well spread for short strings. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const TITLE_SIZES = [15, 13.5, 12, 10.5, 9.4, 8.4, 7.5];
/** Average glyph width of Atkinson Hyperlegible Next Bold, in em. A touch generous so text never overflows. */
const GLYPH_EM = 0.55;

function wrap(words: string[], maxChars: number): string[] {
  const lines: string[] = [];
  for (const word of words) {
    const last = lines.at(-1);
    if (last !== undefined && `${last} ${word}`.length <= maxChars) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

/** Breaks a title into lines at the largest size that fits the label. */
function fitTitle(title: string, box: Box, maxLines: number) {
  const words = title.trim().split(/\s+/);
  for (const size of TITLE_SIZES) {
    const maxChars = Math.floor(box.w / (size * GLYPH_EM));
    if (words.some((word) => word.length > maxChars)) continue;
    const lines = wrap(words, maxChars);
    if (lines.length <= maxLines && lines.length * size * 1.06 <= box.h - 8) return { size, lines };
  }
  const size = TITLE_SIZES.at(-1) ?? 7.5;
  const maxChars = Math.floor(box.w / (size * GLYPH_EM));
  const lines = wrap(
    words.map((word) => (word.length > maxChars ? `${word.slice(0, maxChars - 1)}…` : word)),
    maxChars,
  ).slice(0, maxLines);
  return { size, lines };
}

export interface PackDesign extends Layout {
  shape: PackShape;
  colourway: PackColourway;
  patternKind: PackPattern;
  title: { size: number; lines: string[] };
  verdict: Snack["data"]["verdict"];
  glyph: string;
}

export const VERDICT_GLYPHS: Record<Snack["data"]["verdict"], string> = { keep: "∈", maybe: "≈", drop: "∉" };

export function packDesign({ title, kind, verdict }: Pick<Snack["data"], "title" | "kind" | "verdict">): PackDesign {
  const shape = SHAPES[kind];
  const layout = LAYOUTS[shape];
  const seed = hash(`${kind}:${title.toLowerCase()}`);
  return {
    ...layout,
    shape,
    colourway: COLOURWAYS[seed % COLOURWAYS.length] ?? "cobalt",
    patternKind: PATTERNS[(seed >>> 8) % PATTERNS.length] ?? "plot",
    title: fitTitle(title, layout.label, layout.maxLines),
    verdict,
    glyph: VERDICT_GLYPHS[verdict],
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Path data for the pattern, drawn inside `box`. Stroked, not filled (dots are zero-length round strokes). */
export function patternPath(kind: PackPattern, { x, y, w, h }: Box): string {
  const d: string[] = [];
  switch (kind) {
    case "grid":
      for (let gx = x + 3; gx < x + w; gx += 6) d.push(`M${round(gx)} ${y}v${h}`);
      for (let gy = y + 3; gy < y + h; gy += 6) d.push(`M${x} ${round(gy)}h${w}`);
      break;
    case "stripes":
      for (let sx = x - h; sx < x + w; sx += 7) d.push(`M${round(sx)} ${y + h}l${h} ${-h}`);
      break;
    case "dots":
      for (let row = 0, dy = y + 3; dy < y + h; dy += 5.5, row++)
        for (let dx = x + 3 + (row % 2) * 2.75; dx < x + w; dx += 5.5) d.push(`M${round(dx)} ${round(dy)}h0`);
      break;
    case "waves":
      for (let wy = y + 5; wy < y + h; wy += 7) {
        d.push(`M${x - 2} ${round(wy)}`);
        for (let wx = x - 2; wx < x + w; wx += 12) d.push(`q3 -4.5 6 0t6 0`);
      }
      break;
    case "rings":
      for (let r = 6; r < w; r += 7) d.push(`M${round(x + 6 + r)} ${y + h + 2}a${r} ${r} 0 0 0 ${-2 * r} 0`);
      break;
    case "plot": {
      // The site's plotted mark in miniature: two axes and a curve.
      const bx = x + 7;
      const by = y + h - 5;
      d.push(`M${bx} ${y + 3}V${by}H${x + w - 5}`);
      d.push(
        `M${bx} ${by - 2}C${round(bx + w * 0.3)} ${by - 2} ${round(bx + w * 0.34)} ${y + 5} ${round(bx + w * 0.62)} ${y + 5}`,
      );
      break;
    }
  }
  return d.join("");
}

/** A sawtooth edge from x0 to x1, for the crimped ends of a bag. */
function crimp(x0: number, x1: number, y: number, depth: number, teeth: number): string {
  const step = (x1 - x0) / teeth;
  let d = "";
  for (let i = 1; i <= teeth; i++)
    d += `L${round(x0 + step * (i - 0.5))} ${round(y - depth)}L${round(x0 + step * i)} ${y}`;
  return d;
}

/** Outlines, also used as clip paths so pattern and sheen stay inside the pack. */
export const PACK_SHAPES: Record<PackShape, string> = {
  bag: `M9 6${crimp(9, 71, 6, 2.6, 16)}C75.5 30 75.5 74 71 98${crimp(71, 9, 98, -2.6, 16)}C4.5 74 4.5 30 9 6Z`,
  box: "M5 12H65V101H5Z",
  can: "M10 14V92A30 7 0 0 0 70 92V14A30 7 0 0 0 10 14Z",
  jar: "M12 31Q12 23 20 23H60Q68 23 68 31V93Q68 101 60 101H20Q12 101 12 93Z",
  pouch: "M15 5H65L73 89Q73.6 101 62 101H18Q6.4 101 7 89Z",
  blister: "M9 4H71Q75 4 75 8V97Q75 101 71 101H9Q5 101 5 97V8Q5 4 9 4Z",
};
