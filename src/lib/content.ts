/**
 * All content queries live here, so pages never call getCollection directly.
 * Drafts are visible in `astro dev` and hidden in production builds.
 */
import { getCollection, type CollectionEntry } from "astro:content";

import { DEFAULT_LOCALE, type Locale } from "@/i18n";

export type Post = CollectionEntry<"posts">;
export type Snack = CollectionEntry<"snacks">;
export type Project = CollectionEntry<"projects">;

const isPublished = ({ data }: { data: { draft?: boolean } }) => import.meta.env.DEV || !data.draft;
const byDateDesc = (a: { data: { date: Date } }, b: { data: { date: Date } }) =>
  b.data.date.getTime() - a.data.date.getTime();

/** "how-foliq-works/es" -> "how-foliq-works". English entries already have the bare slug as id. */
export const postSlug = (post: Post) => post.id.replace(/\/(en|es|gl)$/, "");

/**
 * Posts for a locale: the translation when one exists, otherwise the English original.
 * `isFallback` tells the page to show an "only in English" notice.
 */
export async function getPosts(locale: Locale = DEFAULT_LOCALE) {
  const all = (await getCollection("posts", isPublished)).sort(byDateDesc);
  const originals = all.filter((post) => post.data.lang === DEFAULT_LOCALE);
  return originals.map((original) => {
    const translation = all.find((p) => p.data.lang === locale && postSlug(p) === postSlug(original));
    const post = translation ?? original;
    return { post, slug: postSlug(original), isFallback: locale !== DEFAULT_LOCALE && !translation };
  });
}

/** Other posts in the same series, oldest first. */
export async function getSeries(series: string) {
  const all = await getCollection(
    "posts",
    (p) => isPublished(p) && p.data.series === series && p.data.lang === DEFAULT_LOCALE,
  );
  return all.sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
}

export async function getSnacks() {
  return (await getCollection("snacks", isPublished)).sort(byDateDesc);
}

/** "2026-10-28-ghostty" -> "ghostty": the snack's URL is /snacks/ghostty. */
export const snackSlug = (snack: Snack) => snack.id.replace(/^\d{4}-\d{2}-\d{2}-/, "");

/** The machine is three wide and three tall: rows A to C, columns 1 to 3. */
export const MACHINE_COLUMNS = 3;
export const MACHINE_SLOTS = 9;
export const slotCode = (index: number) =>
  `${String.fromCharCode(65 + Math.floor(index / MACHINE_COLUMNS))}${(index % MACHINE_COLUMNS) + 1}`;

export interface ShelvedSnack {
  snack: Snack;
  slug: string;
  /** 1 for the first snack ever published, counting up. */
  number: number;
  /** Slot in the machine ("A1" is the newest); undefined once a snack has moved to the archive. */
  slot: string | undefined;
}

/** Every snack, newest first, with its URL slug, running number and machine slot. */
export async function getShelvedSnacks(): Promise<ShelvedSnack[]> {
  const snacks = await getSnacks();
  const shelved = snacks.map((snack, index) => ({
    snack,
    slug: snackSlug(snack),
    number: snacks.length - index,
    slot: index < MACHINE_SLOTS ? slotCode(index) : undefined,
  }));
  const seen = new Set<string>();
  for (const { slug, snack } of shelved) {
    if (seen.has(slug)) throw new Error(`Two snacks share the slug "${slug}" (${snack.id}). Rename one file.`);
    seen.add(slug);
  }
  return shelved;
}

/** Snacks are read in seconds, not minutes: rounded to the nearest 5 at 230 words per minute. */
export function readingSeconds(body = ""): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(10, Math.round(((words / 230) * 60) / 5) * 5);
}

export async function getProjects() {
  return (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
}

/** Rough reading time from the raw body, at 230 words per minute. */
export function readingTime(body = ""): number {
  return Math.max(1, Math.round(body.split(/\s+/).length / 230));
}
