/**
 * Where each object sits on the desk.
 *
 * Desktop: absolute position on the board (px) and a tilt (deg).
 * Phone: a column span on a 6-column collage grid, its own tilt, and a vertical
 * nudge (px) so neighbours overlap. Tidy: a column span on a 12-column grid.
 * The phone collage is composed on purpose, so tune it here, not with CSS.
 */
export interface Placement {
  x: number;
  y: number;
  w: number;
  r: number;
  /** Phone grid-column, e.g. "1 / 4". */
  mc: string;
  mr: number;
  mt?: number;
  /** Tidy-mode span out of 12; 0 hides the object (decor). */
  tc: number;
}

/** The board is a fixed-size surface; the view opens centred on (cx, cy). */
export const BOARD = { width: 2400, height: 1560, cx: 1180, cy: 650 };

const place = (p: Placement) => p;

export const PLACEMENTS = {
  hint: place({ x: 470, y: 266, w: 260, r: -4, mc: "1 / -1", mr: 0, tc: 0 }),
  intro: place({ x: 500, y: 320, w: 640, r: -1.2, mc: "1 / -1", mr: -1.2, tc: 8 }),
  now: place({ x: 1000, y: 680, w: 250, r: 3.5, mc: "3 / -1", mr: 3, mt: -28, tc: 4 }),

  projectsLabel: place({ x: 1230, y: 262, w: 440, r: -2, mc: "1 / -1", mr: -2, mt: 20, tc: 12 }),
  project0: place({ x: 1240, y: 380, w: 330, r: 1.6, mc: "1 / 6", mr: -1.4, tc: 4 }),
  project1: place({ x: 1610, y: 420, w: 320, r: -2.2, mc: "2 / -1", mr: 1.6, mt: -4, tc: 4 }),
  project2: place({ x: 1980, y: 350, w: 310, r: 2.4, mc: "1 / 6", mr: -0.8, mt: -4, tc: 4 }),

  snacksLabel: place({ x: 1340, y: 850, w: 440, r: 1.5, mc: "1 / -1", mr: 1.5, mt: 24, tc: 12 }),
  snack0: place({ x: 1330, y: 930, w: 230, r: -3, mc: "1 / 4", mr: -3, tc: 3 }),
  snack1: place({ x: 1585, y: 900, w: 230, r: 2.4, mc: "4 / -1", mr: 2.5, mt: 30, tc: 3 }),
  snack2: place({ x: 1840, y: 950, w: 230, r: -1.4, mc: "1 / 4", mr: 2, mt: -14, tc: 3 }),
  snack3: place({ x: 1440, y: 1180, w: 230, r: 1.8, mc: "4 / -1", mr: -2, mt: 16, tc: 3 }),
  snack4: place({ x: 1700, y: 1200, w: 230, r: -2.6, mc: "2 / 6", mr: 1.5, mt: -10, tc: 3 }),

  writingLabel: place({ x: 560, y: 850, w: 440, r: -1.5, mc: "1 / -1", mr: -1.5, mt: 24, tc: 12 }),
  post0: place({ x: 520, y: 930, w: 380, r: 1.2, mc: "1 / -1", mr: 0.8, tc: 4 }),
  post1: place({ x: 930, y: 970, w: 360, r: -1.6, mc: "1 / -1", mr: -1.2, mt: -2, tc: 4 }),
  post2: place({ x: 600, y: 1220, w: 360, r: -0.5, mc: "1 / -1", mr: 0.6, mt: -2, tc: 4 }),

  receipt: place({ x: 190, y: 630, w: 260, r: 2.6, mc: "1 / 5", mr: -2.5, mt: 28, tc: 4 }),
  card: place({ x: 1010, y: 1260, w: 340, r: 2, mc: "3 / -1", mr: 3, mt: -70, tc: 4 }),
  swatches: place({ x: 140, y: 320, w: 280, r: -5, mc: "2 / 6", mr: -4, mt: 24, tc: 0 }),
} satisfies Record<string, Placement>;

export type PlacementId = keyof typeof PLACEMENTS;
