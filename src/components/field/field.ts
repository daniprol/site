/**
 * The generative system behind the theme: a seeded vector field with one attractor.
 * Shared by the live hero (canvas, client) and the static glyphs (SVG, build time),
 * so a post's header art and the home page are drawn by the same maths.
 */

/** FNV-1a string hash, used to turn a slug into a seed. */
export function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
export function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Field {
  /** Flow angle in radians at normalised point (u, v), at time t (seconds). */
  angle: (u: number, v: number, t?: number) => number;
  /** Attractor position in normalised units. */
  sink: { u: number; v: number };
}

/** A smooth trig "noise" field: cheap, periodic, and identical on server and client. */
export function makeField(seed: number): Field {
  const r = random(seed);
  const f1 = 2 + r() * 3;
  const f2 = 2 + r() * 3;
  const f3 = 1 + r() * 2.5;
  const p1 = r() * 6.283;
  const p2 = r() * 6.283;
  const p3 = r() * 6.283;
  const sink = { u: 0.25 + r() * 0.5, v: 0.3 + r() * 0.4 };
  return {
    sink,
    angle: (u, v, t = 0) =>
      Math.PI *
      (Math.sin(u * f1 + p1 + t * 0.21) * Math.cos(v * f2 + p2 - t * 0.17) + 0.6 * Math.sin((u + v) * f3 + p3)),
  };
}

export interface StreamlineOptions {
  /** Aspect ratio (width / height) of the drawing; u runs 0..aspect, v runs 0..1. */
  aspect: number;
  /** Number of seed points. */
  lines: number;
  /** Integration steps per line. */
  steps: number;
  /** Step length in normalised units. */
  step: number;
  /** How strongly lines spiral into the attractor (0 = plain flow). */
  pull: number;
}

/**
 * Integrates streamlines through the field. Returns polylines in normalised units:
 * the "search" every post header shows, many paths drifting towards one result.
 */
export function streamlines(
  seed: number,
  o: StreamlineOptions,
): { lines: [number, number][][]; sink: [number, number] } {
  const field = makeField(seed);
  const r = random(seed ^ 0x9e3779b9);
  const su = field.sink.u * o.aspect;
  const sv = field.sink.v;
  const lines: [number, number][][] = [];
  for (let i = 0; i < o.lines; i++) {
    let u = r() * o.aspect;
    let v = r();
    const line: [number, number][] = [[u, v]];
    for (let s = 0; s < o.steps; s++) {
      const a = field.angle(u / o.aspect, v);
      const du = su - u;
      const dv = sv - v;
      const d = Math.hypot(du, dv) + 1e-6;
      if (d < o.step * 1.5) break;
      // Flow plus a spiral pull towards the sink, stronger close to it.
      const w = o.pull / (d * 4 + 0.35);
      let x = Math.cos(a) + w * (du / d - (dv / d) * 0.6);
      let y = Math.sin(a) + w * (dv / d + (du / d) * 0.6);
      const len = Math.hypot(x, y) || 1;
      x /= len;
      y /= len;
      u += x * o.step;
      v += y * o.step;
      if (u < -0.05 || u > o.aspect + 0.05 || v < -0.05 || v > 1.05) break;
      line.push([u, v]);
    }
    if (line.length > 2) lines.push(line);
  }
  return { lines, sink: [su, sv] };
}

/** Short hex label for a seed, shown next to generated art. */
export const seedLabel = (seed: number) => seed.toString(16).padStart(8, "0").slice(0, 4);
