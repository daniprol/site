import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { getShelvedSnacks } from "@/lib/content";
import { site } from "@/site.config";

export async function GET(context: APIContext) {
  const snacks = await getShelvedSnacks();
  return rss({
    title: `${site.name} · Snacks`,
    description: "Short first impressions of tools, apps and models.",
    site: context.site ?? "",
    items: snacks.map(({ snack, slug }) => ({
      title: `${snack.data.title} (${snack.data.verdict})`,
      pubDate: snack.data.date,
      link: `/snacks/${slug}/`,
      ...(snack.data.take ? { description: snack.data.take } : {}),
      content: snack.body ?? "",
    })),
  });
}
