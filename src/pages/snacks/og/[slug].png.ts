/** /snacks/og/<slug>.png: the image a link to a snack shows when it is shared. Built once, at build time. */
import type { APIContext } from "astro";

import { getCommits, type Commit } from "@/lib/commits";
import { shareCard } from "@/lib/share-card";

export async function getStaticPaths() {
  const commits = await getCommits();
  return commits.map((commit) => ({ params: { slug: commit.slug }, props: { commit, commits } }));
}

export async function GET({ props }: APIContext<{ commit: Commit; commits: Commit[] }>) {
  const png = await shareCard(props.commits, props.commit, "Snacks");
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
