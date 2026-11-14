import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { getPicks } from "@/lib/content";
import { site } from "@/site.config";

const VERDICT = { keep: "picked", maybe: "ripening", drop: "dropped" } as const;

export async function GET(context: APIContext) {
  const picks = await getPicks();
  return rss({
    title: `${site.name} · Cherry picks`,
    description: "Out of everything that ships, the few tools, apps and models I would pick.",
    site: context.site ?? "",
    items: picks.map(({ entry, slug }) => ({
      title: `${entry.data.title} (${VERDICT[entry.data.verdict]})`,
      pubDate: entry.data.date,
      link: `/cherry-picks/${slug}/`,
      description: entry.data.take ?? "",
    })),
  });
}
