/** /rss.xml: the feed of posts (English originals). A .ts file in src/pages that exports GET builds a file, not a page. */
import rss from "@astrojs/rss";
import type { APIContext } from "astro";

import { withBase } from "@/i18n";
import { getPosts } from "@/lib/content";
import { site } from "@/site.config";

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${site.name} · Writing`,
    description: "Long-form posts on software and AI engineering.",
    site: new URL(withBase("/"), context.site ?? "https://example.com"),
    items: posts.map(({ post, slug }) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: withBase(`/writing/${slug}/`),
    })),
  });
}
