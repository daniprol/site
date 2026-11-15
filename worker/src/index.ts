/**
 * The site's Worker. Cloudflare serves every page straight from ./dist; only /api/* reaches this code
 * (assets.run_worker_first in wrangler.jsonc). It runs the comments API described in contract.ts.
 */
import type { ApiError } from "./contract";
import type { Env } from "./env";
import { GitHubError } from "./github/client";
import { HttpError, json } from "./http";
import { callback, getSession, login, logout } from "./routes/auth";
import { getComments, postComment } from "./routes/comments";

type Handler = (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;

const routes: Record<string, Partial<Record<string, Handler>>> = {
  "/api/comments": { GET: getComments, POST: postComment },
  "/api/session": { GET: getSession },
  "/api/auth/login": { GET: login },
  "/api/auth/callback": { GET: callback },
  "/api/auth/logout": { POST: logout },
};

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const route = routes[pathname];
    if (!route) return env.ASSETS.fetch(request);

    const handler = route[request.method];
    if (!handler) return error(405, "Method not allowed.", { Allow: Object.keys(route).join(", ") });

    try {
      return await handler(request, env, ctx);
    } catch (caught) {
      if (caught instanceof HttpError) {
        return error(caught.status, caught.message, caught.setCookie ? { "Set-Cookie": caught.setCookie } : {});
      }
      console.error(caught);
      if (caught instanceof GitHubError) return error(502, "GitHub did not answer as expected. Try again shortly.");
      return error(500, "Something went wrong.");
    }
  },
} satisfies ExportedHandler<Env>;

const error = (status: number, message: string, headers: HeadersInit = {}) =>
  json({ error: message } satisfies ApiError, { status, headers });
