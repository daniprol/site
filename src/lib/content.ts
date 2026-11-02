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

export async function getProjects() {
  return (await getCollection("projects")).sort((a, b) => a.data.order - b.data.order);
}

/** Rough reading time from the raw body, at 230 words per minute. */
export function readingTime(body = ""): number {
  return Math.max(1, Math.round(body.split(/\s+/).length / 230));
}
