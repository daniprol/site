/**
 * What the Worker gets from Cloudflare. Plain values live in wrangler.jsonc ("vars");
 * secrets are set with `wrangler secret put` (or .dev.vars locally) and never committed.
 */
export interface Env {
  /** The static site in ./dist. Everything outside /api/* is served from here without running the Worker. */
  ASSETS: Fetcher;

  /** "owner/name" of the repository whose Discussions hold the comments. */
  GITHUB_REPOSITORY: string;
  /** GraphQL node ID of that repository, needed to create discussions. */
  GITHUB_REPOSITORY_ID: string;
  /** GraphQL node ID of the Discussions category that holds one discussion per page. */
  GITHUB_DISCUSSION_CATEGORY_ID: string;

  /** The GitHub App's numeric App ID: the issuer of the app's JWTs. */
  GITHUB_APP_ID: string;
  /** The GitHub App's Client ID ("Iv23…"): identifies the app when visitors sign in. */
  GITHUB_APP_CLIENT_ID: string;
  /** The app's installation on the repository, which reads and creates discussions. */
  GITHUB_APP_INSTALLATION_ID: string;

  /** Secret: the app's private key, PKCS#8 PEM ("-----BEGIN PRIVATE KEY-----"). */
  GITHUB_APP_PRIVATE_KEY: string;
  /** Secret: the app's client secret, for exchanging sign-in codes for visitor tokens. */
  GITHUB_APP_CLIENT_SECRET: string;
  /** Secret: 32 random bytes in base64, the AES-GCM key that seals the session cookies. */
  SESSION_KEY: string;
}
