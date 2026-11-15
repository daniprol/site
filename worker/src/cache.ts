/**
 * A short-lived cache of each page's thread in Cloudflare's edge cache, so readers do not each cost a GitHub
 * call. Posting a comment deletes the entry, so the poster sees it at once; other visitors see it within a
 * minute. Deletes only reach the data centre that handles the request, which the short TTL covers elsewhere.
 *
 * The Cache API only works on a custom domain: on *.workers.dev (including previews) it stores nothing,
 * and every read goes to GitHub.
 */
import type { Thread } from "./contract";

/** How long a cached thread is served before it is read from GitHub again. */
const TTL_SECONDS = 60;

/** A stable key per term on this host, whatever else the request URL carried. */
const cacheKeyFor = (origin: string, term: string) =>
  new Request(`${origin}/api/comments?term=${encodeURIComponent(term)}`);

/** HIT: served from the cache. MISS: read from GitHub and stored. BYPASS: a signed-in read, never cached. */
export type CacheStatus = "HIT" | "MISS" | "BYPASS";

/**
 * The page's thread from the edge cache, or from `load` (which reads GitHub) when it is not cached yet.
 * The fresh copy is stored in the background, after the response has gone out.
 */
export async function cachedThread(
  ctx: ExecutionContext,
  origin: string,
  term: string,
  load: () => Promise<Thread>,
): Promise<{ thread: Thread; status: CacheStatus }> {
  const key = cacheKeyFor(origin, term);
  const hit = await caches.default.match(key);
  if (hit) return { thread: await hit.json<Thread>(), status: "HIT" };

  const thread = await load();
  const entry = Response.json(thread, { headers: { "Cache-Control": `public, max-age=${TTL_SECONDS}` } });
  ctx.waitUntil(caches.default.put(key, entry));
  return { thread, status: "MISS" };
}

/** Drops the cached thread, so the next read goes to GitHub. Called after every comment or reaction. */
export async function forgetThread(origin: string, term: string): Promise<void> {
  await caches.default.delete(cacheKeyFor(origin, term));
}
