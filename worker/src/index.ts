/**
 * Entry point of the site's Cloudflare Worker.
 *
 * The site itself is static HTML in ./dist, which Cloudflare serves directly without running any code. Only
 * requests under /api/* reach this file (see `assets.run_worker_first` in wrangler.jsonc). Those are the
 * comments API described in contract.ts: reading and posting comments, reactions, Markdown previews and
 * GitHub sign-in. Everything else the Worker is asked for is handed back to the static assets.
 */
import type { ApiError } from "./contract";
import type { Env } from "./env";
import { GitHubError } from "./github/client";
import { HttpError, json } from "./http";
import { finishLogin, getSession, logout, startLogin } from "./routes/auth";
import { getComments, postComment, postReaction, previewMarkdown } from "./routes/comments";

/**
 * A route handler. `ctx` is Cloudflare's ExecutionContext: `ctx.waitUntil(promise)` lets work (such as
 * writing to the cache) finish after the response has been sent.
 */
type Handler = (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;

/** Every API route: path, then HTTP method, then the function that answers it. */
const routes: Record<string, Partial<Record<string, Handler>>> = {
  "/api/comments": { GET: getComments, POST: postComment },
  "/api/reactions": { POST: postReaction },
  "/api/markdown": { POST: previewMarkdown },
  "/api/session": { GET: getSession },
  "/api/auth/login": { GET: startLogin },
  "/api/auth/callback": { GET: finishLogin },
  "/api/auth/logout": { POST: logout },
};

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const route = routes[pathname];
    // An unknown /api/* path: let the static site answer (with its 404 page).
    if (!route) return env.ASSETS.fetch(request);

    const handler = route[request.method];
    if (!handler) return errorResponse(405, "Method not allowed.", { Allow: Object.keys(route).join(", ") });

    try {
      return await handler(request, env, ctx);
    } catch (caught) {
      // HttpError carries a status and a message written for visitors; anything else is a bug or an outage,
      // so it is logged and the visitor gets a generic message.
      if (caught instanceof HttpError) {
        return errorResponse(caught.status, caught.message, caught.setCookie ? { "Set-Cookie": caught.setCookie } : {});
      }
      console.error(caught);
      if (caught instanceof GitHubError) {
        return errorResponse(502, "GitHub did not answer as expected. Try again shortly.");
      }
      return errorResponse(500, "Something went wrong.");
    }
  },
} satisfies ExportedHandler<Env>;

/** A JSON error body (`{ error }`, see ApiError in contract.ts) with the given status. */
const errorResponse = (status: number, message: string, headers: HeadersInit = {}) =>
  json({ error: message } satisfies ApiError, { status, headers });
