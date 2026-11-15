/**
 * All content queries live here, so pages never call getCollection directly. Runs at build time only.
 *
 * The collections and their frontmatter schemas are defined in src/content.config.ts. `getCollection` reads
 * every file of a collection and returns typed entries ({ id, data, body }); `render(entry)` in a page turns
 * one into HTML. Drafts are visible in `astro dev` and hidden in production builds.
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

/** Snacks, newest first. */
export async function getSnacks() {
  return (await getCollection("snacks", isPublished)).sort(byDateDesc);
}

/** Projects in their `order`, lowest first. */
export async function getProjects() {
  return (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
}

const WORDS_PER_MINUTE = 230;

/** Rough reading time of a post in whole minutes (at least 1), from its raw body. */
export function readingTime(body = ""): number {
  return Math.max(1, Math.round(body.split(/\s+/).length / WORDS_PER_MINUTE));
}

/** Rough reading time of a snack in seconds, rounded to tens (at least 10), from its raw body. */
export function readingSeconds(body = ""): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(10, Math.round((words / WORDS_PER_MINUTE) * 6) * 10);
}
