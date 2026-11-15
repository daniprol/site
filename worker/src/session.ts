/**
 * A signed-in visitor, kept entirely in one sealed cookie (see cookies.ts): who they are and their GitHub
 * user token. There is no database; signing out or losing the cookie simply ends the session.
 *
 * How a request becomes "signed in": the browser sends the cookie with every /api/* call, readSession opens
 * it with SESSION_KEY, and asViewer hands the visitor's token to the GitHub call. If GitHub's token is about
 * to expire it is refreshed first, and the response stores the updated cookie.
 */
import { clearCookie, getSealedCookie, setSealedCookie } from "./cookies";
import type { Env } from "./env";
import { GitHubError } from "./github/client";
import { refreshTokens, type GitHubUser, type UserTokens } from "./github/oauth";
import { HttpError } from "./http";

const COOKIE = "__Host-comments-session";
/** A visitor stays signed in for up to 30 days, or until the refresh token runs out if that is sooner. */
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
/** Refresh an access token this long before it expires. */
const REFRESH_MARGIN_MS = 60 * 1000;

/** Shown when the visitor's GitHub token can no longer be used. */
const SIGN_IN_EXPIRED = "Your GitHub sign-in has expired. Sign in again.";

/** Everything the session cookie holds: who the visitor is, and their GitHub tokens. */
export type Session = GitHubUser & UserTokens;

/** The visitor's session from their cookie, or null when they are not signed in. */
export const readSession = (request: Request, env: Env) => getSealedCookie<Session>(request, env, COOKIE);

/** The Set-Cookie header value that stores `session`. */
export function sessionCookie(env: Env, session: Session): Promise<string> {
  const refreshLeft = session.refreshTokenExpiresAt
    ? Math.floor((session.refreshTokenExpiresAt - Date.now()) / 1000)
    : Infinity;
  return setSealedCookie(env, COOKIE, session, Math.min(MAX_AGE_SECONDS, refreshLeft));
}

/** The Set-Cookie header value that signs the visitor out. */
export const clearSessionCookie = () => clearCookie(COOKIE);

/**
 * The session with an access token that is good to use now, refreshing it if it is about to expire.
 * `cookie` is set when the session changed and the response must store it again.
 */
async function withFreshToken(env: Env, session: Session): Promise<{ session: Session; cookie?: string }> {
  const expiresAt = session.accessTokenExpiresAt;
  if (expiresAt === null || expiresAt - REFRESH_MARGIN_MS > Date.now()) return { session };
  if (!session.refreshToken) throw new HttpError(401, SIGN_IN_EXPIRED);

  const refreshed: Session = { ...session, ...(await refreshTokens(env, session.refreshToken)) };
  return { session: refreshed, cookie: await sessionCookie(env, refreshed) };
}

/** What a signed-in action returned, plus the session cookie to send back if the token was refreshed. */
export interface ViewerResult<T> {
  result: T;
  cookie?: string;
}

/**
 * Runs `action` with the signed-in visitor's GitHub token. Throws 401 when nobody is signed in, and signs the
 * visitor out when GitHub no longer accepts their token (revoked on GitHub, or the refresh token ran out).
 */
export async function asViewer<T>(
  request: Request,
  env: Env,
  action: (token: string) => Promise<T>,
): Promise<ViewerResult<T>> {
  const stored = await readSession(request, env);
  if (!stored) throw new HttpError(401, "Sign in with GitHub first.");
  try {
    const { session, cookie } = await withFreshToken(env, stored);
    return { result: await action(session.accessToken), cookie };
  } catch (error) {
    if (error instanceof GitHubError && error.status === 401) {
      throw new HttpError(401, SIGN_IN_EXPIRED, clearSessionCookie());
    }
    throw error;
  }
}
