/**
 * The share image of a snack (1200 × 630), drawn at build time: logo, title, one-liner, state, and
 * the entry's stretch of the history. satori turns the layout into SVG with the text as outlines,
 * so the build machine needs no fonts installed; sharp turns that into a PNG.
 *
 * Called by src/pages/snacks/og/[slug].png.ts, which Astro turns into one PNG file per entry.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import satori from "satori";
import sharp from "sharp";

import logoSource from "@/components/site/Logo.astro?raw";

import { BASE_BRANCH, type Commit, type Verdict } from "./commits";

/** The size social networks expect for a large link preview. */
const CARD = { width: 1200, height: 630 } as const;

/** The light Proof palette as hex, because satori does not read oklch(). Keep close to tokens.css. */
const INK = {
  bg: "#fbfdfe",
  surface: "#f1f4fa",
  border: "#dde1ea",
  line: "#d3d7e0",
  fg: "#1d2440",
  muted: "#5d6480",
  dot: "#efdc2e",
  keep: "#16794b",
  maybe: "#96600f",
  drop: "#c23a35",
} as const;
/** The line next to the state pill: which branch went where. */
const BRANCH_LINE: Record<Verdict, (branch: string) => string> = {
  keep: (branch) => `${branch} into ${BASE_BRANCH}`,
  maybe: (branch) => branch,
  drop: (branch) => `${branch} out of ${BASE_BRANCH}`,
};
/** The state pill's text. The card is always in English. */
const STATE_LABEL: Record<Verdict, string> = { keep: "Merged", maybe: "Open", drop: "Reverted" };

/*
 * satori takes the same element tree React would build: { type, props: { style, children } }. `h` builds one
 * with less noise; every box is a flex container, as satori requires for boxes with several children.
 */
type Child = Node | string | false | undefined;
interface Node {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: Child | Child[];
    src?: string;
    width?: number;
    height?: number;
  };
}
const h = (type: string, style: Record<string, string | number>, ...children: Child[]): Node => ({
  type,
  props: { style: { display: "flex", ...style }, children },
});
/** An <img> showing an inline SVG, for the parts drawn by hand (logo, graph). */
const svgImage = (svg: string, width: number, height: number): Node => ({
  type: "img",
  props: { src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, width, height },
});

/** The wordmark is stored as outlines in Logo.astro; reuse them so the card can never drift from it. */
function logoSvg(): string {
  const name = /fill="currentColor"\s+d="([^"]+)"/.exec(logoSource)?.[1];
  if (!name) throw new Error("share-card: could not find the wordmark outlines in Logo.astro");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 3 240.44 42">
    <circle cx="24" cy="24" r="7.2" fill="${INK.dot}"/>
    <circle cx="24" cy="24" r="9" fill="none" stroke="${INK.fg}" stroke-width="4.6"/>
    <path d="M33 24V6.5M15 24v17.5" fill="none" stroke="${INK.fg}" stroke-width="4.6" stroke-linecap="round"/>
    <path fill="${INK.fg}" d="${name}"/>
  </svg>`;
}

/** This entry and its neighbours on the trunk, oldest on the left. The entry itself is drawn larger. */
function graphSvg(commits: Commit[], current: Commit): string {
  /** Width given to each entry. */
  const SLOT = 150;
  /** Height of the trunk line. */
  const Y = 104;
  /** Neighbours shown on each side. */
  const reach = 3;
  const at = commits.indexOf(current);
  const shown = commits.slice(Math.max(0, at - reach), at + reach + 1).reverse();
  const centre = shown.indexOf(current);
  const shift = CARD.width / 2 - (centre * SLOT + SLOT / 2);
  /** HEAD sits one slot after the newest entry, when that is the one on the card. */
  const headX = CARD.width / 2 + SLOT;
  const parts = shown.map((commit, i) => {
    const x = shift + i * SLOT;
    const tone = INK[commit.verdict];
    const isCurrent = commit === current;
    const top = isCurrent ? 34 : 62;
    const r = isCurrent ? 15 : 8;
    const opacity = isCurrent ? 1 : 0.45;
    const out = `M${x + 20} ${Y}C${x + 48} ${Y} ${x + 44} ${top} ${x + 68} ${top}H${x + 75}`;
    const back = `M${x + 75} ${top}H${x + 82}C${x + 108} ${top} ${x + 104} ${Y} ${x + 130} ${Y}`;
    const merged = commit.verdict !== "maybe";
    return `<g fill="none" stroke="${tone}" stroke-width="${isCurrent ? 5 : 3.5}" stroke-linecap="round" opacity="${opacity}">
      <path d="${out}"/>
      ${merged ? `<path d="${back}"/><circle cx="${x + 130}" cy="${Y}" r="6" fill="${INK.bg}"/>` : ""}
      ${commit.verdict === "drop" ? `<path d="M${x + 139} ${Y - 6}l12 12m0-12l-12 12"/>` : ""}
      <circle cx="${x + 75}" cy="${top}" r="${r}" fill="${merged ? tone : INK.bg}" stroke="${merged ? INK.bg : tone}"/>
    </g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD.width} 130">
    <path d="M0 ${Y}H${at === 0 ? headX : CARD.width}" stroke="${INK.line}" stroke-width="4"/>
    ${parts.join("")}
    ${at === 0 ? `<circle cx="${headX}" cy="${Y}" r="11" fill="${INK.dot}" stroke="${INK.fg}" stroke-width="4"/>` : ""}
  </svg>`;
}

interface CardFont {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 700;
  style: "normal";
}

/** The fonts, read once per build and shared by every card. satori needs .woff files, not .woff2. */
let fonts: Promise<CardFont[]> | undefined;
function loadFonts() {
  const font = async (name: string, family: string, weight: CardFont["weight"]): Promise<CardFont> => ({
    name,
    data: await readFile(
      path.join(process.cwd(), `node_modules/@fontsource/${family}/files/${family}-latin-${weight}-normal.woff`),
    ),
    weight,
    style: "normal",
  });
  fonts ??= Promise.all([
    font("Sans", "atkinson-hyperlegible-next", 400),
    font("Sans", "atkinson-hyperlegible-next", 700),
    font("Mono", "atkinson-hyperlegible-mono", 500),
  ]);
  return fonts;
}

/** The PNG for one entry. `commits` is the whole history, newest first, for the graph along the bottom. */
export async function shareCard(commits: Commit[], commit: Commit, sectionName: string): Promise<Buffer> {
  const { title, take } = commit.snack.data;
  const tone = INK[commit.verdict];
  const mono = { fontFamily: "Mono", fontWeight: 500, fontSize: 26, color: INK.muted };

  const card = h(
    "div",
    { width: "100%", height: "100%", flexDirection: "column", background: INK.bg, color: INK.fg, fontFamily: "Sans" },
    h(
      "div",
      { alignItems: "center", justifyContent: "space-between", padding: "56px 72px 0" },
      svgImage(logoSvg(), 275, 48),
      h("div", mono, `${sectionName.toLowerCase()} · #${commit.number}`),
    ),
    h(
      "div",
      { flexDirection: "column", flexGrow: 1, justifyContent: "center", padding: "0 72px" },
      h(
        "div",
        { fontSize: title.length > 22 ? 68 : 84, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1 },
        title,
      ),
      take && h("div", { marginTop: 18, fontSize: 36, lineHeight: 1.35, color: INK.muted, maxWidth: 980 }, take),
      h(
        "div",
        { alignItems: "center", marginTop: 34, gap: 18 },
        h(
          "div",
          { ...mono, padding: "8px 22px", borderRadius: 999, background: tone, color: INK.bg, fontSize: 26 },
          STATE_LABEL[commit.verdict],
        ),
        h("div", mono, BRANCH_LINE[commit.verdict](commit.branch)),
      ),
    ),
    svgImage(graphSvg(commits, commit), CARD.width, 130),
    h("div", { height: 26 }),
  );

  const svg = await satori(card as never, { ...CARD, fonts: await loadFonts() });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toBuffer();
}
