import type { SessionInfo } from "../contract";
/**
 * Sign-in with GitHub (the app's user authorization flow), the current visitor, and sign-out.
 *
 * Login stores a random `state` and the page to return to in a sealed, ten-minute cookie and sends the
 * visitor to GitHub. The callback only accepts a `state` matching that cookie, which stops another site from
 * completing a sign-in into this one (login CSRF), then swaps the code for a user token and keeps it in the
 * session cookie.
 */
import { clearCookie, getSealedCookie, setSealedCookie } from "../cookies";
import { randomToken } from "../encoding";
import type { Env } from "../env";
import { authorizeUrl, exchangeCode, fetchUser } from "../github/oauth";
import { assertSameOrigin, HttpError, json, redirect, safeReturnPath } from "../http";
import { clearSessionCookie, readSession, sessionCookie } from "../session";

const PENDING_COOKIE = "__Host-comments-oauth";
const PENDING_MAX_AGE_SECONDS = 10 * 60;
/** Where the comments section sits on a page, to land back on it after signing in. */
const COMMENTS_ANCHOR = "#comments";

interface PendingLogin {
  state: string;
  returnTo: string;
}

/** The URL GitHub sends visitors back to. It must be one of the app's registered callback URLs. */
const callbackUrl = (request: Request) => new URL("/api/auth/callback", request.url).href;

export async function login(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pending: PendingLogin = {
    state: randomToken(),
    returnTo: safeReturnPath(url.searchParams.get("return"), url.origin),
  };
  const cookie = await setSealedCookie(env, PENDING_COOKIE, pending, PENDING_MAX_AGE_SECONDS);
  return redirect(authorizeUrl(env, callbackUrl(request), pending.state), { "Set-Cookie": cookie });
}

export async function callback(request: Request, env: Env): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const pending = await getSealedCookie<PendingLogin>(request, env, PENDING_COOKIE);
  if (!pending || params.get("state") !== pending.state) {
    throw new HttpError(400, "This sign-in link has expired. Go back to the page and try again.");
  }

  const headers = new Headers({ "Set-Cookie": clearCookie(PENDING_COOKIE) });
  const code = params.get("code");
  // No code means the visitor cancelled on GitHub: just take them back.
  if (code) {
    const tokens = await exchangeCode(env, code, callbackUrl(request));
    const user = await fetchUser(tokens.accessToken);
    headers.append("Set-Cookie", await sessionCookie(env, { ...user, ...tokens }));
  }
  return redirect(`${pending.returnTo.split("#")[0]}${COMMENTS_ANCHOR}`, headers);
}

export async function getSession(request: Request, env: Env): Promise<Response> {
  const session = await readSession(request, env);
  const viewer = session ? { login: session.login, avatarUrl: session.avatarUrl } : null;
  return json({ viewer } satisfies SessionInfo);
}

/** Signs out: forgets the cookie and revokes the token at GitHub, so a copied cookie is worthless too. */
export async function logout(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  assertSameOrigin(request);
  const session = await readSession(request, env);
  if (session) ctx.waitUntil(revokeToken(env, session.accessToken));
  return new Response(null, { status: 204, headers: { "Set-Cookie": clearSessionCookie() } });
}

async function revokeToken(env: Env, accessToken: string): Promise<void> {
  await fetch(`https://api.github.com/applications/${env.GITHUB_APP_CLIENT_ID}/token`, {
    method: "DELETE",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Basic ${btoa(`${env.GITHUB_APP_CLIENT_ID}:${env.GITHUB_APP_CLIENT_SECRET}`)}`,
      "User-Agent": "site-comments",
    },
    body: JSON.stringify({ access_token: accessToken }),
  });
}
