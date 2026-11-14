import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection, reference } from "astro:content";

import { LOCALES } from "./i18n/config";

/**
 * Long-form posts. One folder per post: src/content/posts/<slug>/index.mdx (English).
 * An optional translation sits next to it as es.mdx or gl.mdx.
 */
const posts = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      /** Groups multi-part posts, e.g. "building-foliq". */
      series: z.string().optional(),
      cover: image().optional(),
      draft: z.boolean().default(false),
      lang: z.enum(LOCALES).default("en"),
    }),
});

/**
 * Cherry picks: short, informal first impressions of tools, apps and models. One file per entry,
 * or a folder with index.md when the entry has pictures. (The collection keeps its first name, "snacks".)
 */
const snacks = defineCollection({
  loader: glob({ base: "./src/content/snacks", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    kind: z.enum(["model", "app", "cli", "library", "service", "hardware"]),
    /** keep = picked into main, maybe = still ripening on the branch, drop = dropped. */
    verdict: z.enum(["keep", "maybe", "drop"]),
    /** The one-line take, shown in lists and under the title. */
    take: z.string().optional(),
    /** What speaks for and against it: the + and - lines of the pick result. */
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
    url: z.url().optional(),
    draft: z.boolean().default(false),
  }),
});

/** Portfolio case studies. */
const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    /** Lower numbers show first. */
    order: z.number().default(100),
    featured: z.boolean().default(false),
    year: z.number(),
    stack: z.array(z.string()).default([]),
    repo: z.url().optional(),
    url: z.url().optional(),
    relatedPosts: z.array(reference("posts")).default([]),
  }),
});

export const collections = { posts, snacks, projects };
