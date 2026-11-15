/** /snacks/rss.xml: the feed of snacks, with each entry's state today in its title. */
import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { withBase } from "@/i18n";
import { commitPath, getCommits } from "@/lib/commits";
import { site } from "@/site.config";

/** The state as a word in the item's title. The feed is in English. */
const STATE_WORD = { keep: "merged", maybe: "open", drop: "reverted" } as const;

export async function GET(context: APIContext) {
  const commits = await getCommits();
  return rss({
    title: `${site.name} · Snacks`,
    description: "Short first impressions of tools, apps and models.",
    site: new URL(withBase("/"), context.site ?? "https://example.com"),
    items: commits.map(({ snack, slug, verdict }) => ({
      title: `${snack.data.title} (${STATE_WORD[verdict]})`,
      pubDate: snack.data.date,
      link: withBase(commitPath(slug)),
      description: snack.data.take,
      content: snack.body ?? "",
    })),
  });
}
