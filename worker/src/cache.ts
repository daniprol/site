/**
 * A short-lived cache of each page's thread in Cloudflare's edge cache, so readers do not each cost a GitHub
 * call. Posting a comment deletes the entry, so the poster sees it at once; other visitors see it within a
 * minute. Deletes only reach the data centre that handles the request, which the short TTL covers elsewhere.
 *
 * The Cache API only works on a custom domain: on *.workers.dev (including previews) it stores nothing,
 * and every read goes to GitHub.
 */
import type { Thread } from "./contract";

const TTL_SECONDS = 60;

/** A stable key per term on this host, whatever else the request URL carried. */
const keyFor = (origin: string, term: string) => new Request(`${origin}/api/comments?term=${encodeURIComponent(term)}`);

export async function cachedThread(
  ctx: ExecutionContext,
  origin: string,
  term: string,
  load: () => Promise<Thread>,
): Promise<Thread> {
  const key = keyFor(origin, term);
  const hit = await caches.default.match(key);
  if (hit) return hit.json<Thread>();

  const thread = await load();
  const entry = Response.json(thread, { headers: { "Cache-Control": `public, max-age=${TTL_SECONDS}` } });
  ctx.waitUntil(caches.default.put(key, entry));
  return thread;
}

export async function forgetThread(origin: string, term: string): Promise<void> {
  await caches.default.delete(keyFor(origin, term));
}
