/**
 * All content queries live here, so pages never call getCollection directly.
 * Drafts are visible in `astro dev` and hidden in production builds.
 */
import { createHash } from "node:crypto";

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

const shortHash = (seed: string) => createHash("sha1").update(seed).digest("hex").slice(0, 7);

/** "2026-10-28-ghostty" -> "ghostty". The date prefix only keeps the content folder sorted. */
export const pickSlug = (snack: Snack) => snack.id.replace(/^\d{4}-\d{2}-\d{2}-/, "");

/** Reading time in seconds at 230 words per minute, rounded to 5. Picks are short: seconds read better. */
export function readingSeconds(body = ""): number {
  const words = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(10, Math.round(((words / 230) * 60) / 5) * 5);
}

/**
 * A cherry pick: one entry of the `snacks` collection plus everything the section derives from it.
 * `hash` is the commit on the upstream branch, `mainHash` the one it gets when picked into main.
 * Both are stable (derived from the slug), so they can be quoted and linked.
 */
export interface Pick {
  entry: Snack;
  slug: string;
  /** 1 for the oldest pick. */
  number: number;
  hash: string;
  mainHash: string;
  seconds: number;
}

/** Cherry picks, newest first. */
export async function getPicks(): Promise<Pick[]> {
  const entries = (await getCollection("snacks", isPublished)).sort(byDateDesc);
  return entries.map((entry, index) => {
    const slug = pickSlug(entry);
    return {
      entry,
      slug,
      number: entries.length - index,
      hash: shortHash(`upstream:${slug}`),
      mainHash: shortHash(`main:${slug}`),
      seconds: readingSeconds(entry.body),
    };
  });
}

export async function getProjects() {
  return (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
}

/** Rough reading time from the raw body, at 230 words per minute. */
export function readingTime(body = ""): number {
  return Math.max(1, Math.round(body.split(/\s+/).length / 230));
}
