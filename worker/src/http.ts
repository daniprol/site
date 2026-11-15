/** Small helpers shared by the Worker's routes: JSON responses, typed errors and request checks. */

/** An error with an HTTP status and a message that is safe to show to the visitor. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** A Set-Cookie header value to send with the error, e.g. to end a session that stopped working. */
    readonly setCookie?: string,
  ) {
    super(message);
  }
}

/** A JSON response. Not cacheable by browsers unless `init` sets its own Cache-Control. */
export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

/** A 302 redirect to `location`, never cached. */
export function redirect(location: string, headers: HeadersInit = {}): Response {
  const response = new Response(null, { status: 302, headers });
  response.headers.set("Location", location);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

/**
 * Rejects state-changing requests sent from other sites. The session cookie is SameSite=Lax, which already
 * keeps it off cross-site POSTs; checking Origin as well means a POST only counts when this site sent it.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("Origin");
  if (origin !== new URL(request.url).origin) throw new HttpError(403, "Cross-site request refused.");
}

/** Reads a JSON body, refusing anything else. Requiring JSON also means browsers preflight cross-site calls. */
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
    throw new HttpError(415, "Expected a JSON body.");
  }
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "The body is not valid JSON.");
  }
}

/**
 * Turns a path from a query string into a same-origin path, so redirects can never leave the site.
 * Anything odd ("//evil.com", "https://…", "\\evil") falls back to "/".
 */
export function safeReturnPath(value: string | null, origin: string): string {
  if (!value?.startsWith("/")) return "/";
  const url = new URL(value, origin);
  return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : "/";
}
