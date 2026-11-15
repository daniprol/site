/**
 * Visitor sign-in with the GitHub App's user authorization flow (OAuth web flow). The resulting user token
 * can only do what the app may do (Discussions on this repository) and what the visitor may do, and GitHub
 * shows comments posted with it under the visitor's own name.
 *
 * With "Expire user authorization tokens" on, access tokens last 8 hours and come with a refresh token
 * (6 months). With it off, they never expire and come without one; both cases are handled.
 */
import type { Env } from "../env";
import { GitHubError, rest } from "./client";

export interface UserTokens {
  accessToken: string;
  /** Milliseconds since the epoch, or null for a token that does not expire. */
  accessTokenExpiresAt: number | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: number | null;
}

export interface GitHubUser {
  login: string;
  avatarUrl: string;
}

/** Where to send the visitor to approve the app. GitHub Apps take no scopes: the app's permissions apply. */
export function authorizeUrl(env: Env, redirectUri: string, state: string): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.search = new URLSearchParams({
    client_id: env.GITHUB_APP_CLIENT_ID,
    redirect_uri: redirectUri,
    state,
  }).toString();
  return url.href;
}

export function exchangeCode(env: Env, code: string, redirectUri: string): Promise<UserTokens> {
  return requestTokens(env, { code, redirect_uri: redirectUri });
}

export function refreshTokens(env: Env, refreshToken: string): Promise<UserTokens> {
  return requestTokens(env, { grant_type: "refresh_token", refresh_token: refreshToken });
}

export async function fetchUser(accessToken: string): Promise<GitHubUser> {
  const user = await rest<{ login: string; avatar_url: string }>(accessToken, "/user");
  return { login: user.login, avatarUrl: user.avatar_url };
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  error?: string;
  error_description?: string;
}

async function requestTokens(env: Env, params: Record<string, string>): Promise<UserTokens> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GITHUB_APP_CLIENT_ID,
      client_secret: env.GITHUB_APP_CLIENT_SECRET,
      ...params,
    }),
  });
  // Errors such as a used or expired code still come back as 200, with an `error` field.
  const body = await response.json<TokenResponse>();
  if (!response.ok || !body.access_token) {
    throw new GitHubError(response.ok ? 401 : response.status, `GitHub token: ${body.error_description ?? body.error}`);
  }
  const at = (seconds: number | undefined) => (seconds ? Date.now() + seconds * 1000 : null);
  return {
    accessToken: body.access_token,
    accessTokenExpiresAt: at(body.expires_in),
    refreshToken: body.refresh_token ?? null,
    refreshTokenExpiresAt: at(body.refresh_token_expires_in),
  };
}
