import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { commitPath, getCommits } from "@/lib/commits";
import { site } from "@/site.config";

const STATE = { keep: "merged", maybe: "open", drop: "reverted" } as const;

export async function GET(context: APIContext) {
  const commits = await getCommits();
  return rss({
    title: `${site.name} · Snacks`,
    description: "Short first impressions of tools, apps and models.",
    site: context.site ?? "",
    items: commits.map(({ snack, slug }) => ({
      title: `${snack.data.title} (${STATE[snack.data.verdict]})`,
      pubDate: snack.data.date,
      link: commitPath(slug),
      description: snack.data.take,
      content: snack.body ?? "",
    })),
  });
}
