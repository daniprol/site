import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { getSnacks } from "@/lib/content";
import { site } from "@/site.config";

export async function GET(context: APIContext) {
  const snacks = await getSnacks();
  return rss({
    title: `${site.name} · Snacks`,
    description: "Short first impressions of tools, apps and models.",
    site: context.site ?? "",
    items: snacks.map((snack) => ({
      title: `${snack.data.title} (${snack.data.verdict})`,
      pubDate: snack.data.date,
      link: `/snacks/#${snack.id}`,
      content: snack.body ?? "",
    })),
  });
}
