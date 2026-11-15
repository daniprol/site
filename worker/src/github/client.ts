/**
 * Minimal GitHub REST and GraphQL clients. Every call names the token it runs as: the app's installation
 * token (app.ts) or a signed-in visitor's user token (oauth.ts).
 */

export const GITHUB_API = "https://api.github.com";
/** GitHub requires a User-Agent on every API call. */
export const USER_AGENT = "site-comments";

/** A failed GitHub call. `status` is GitHub's HTTP status (or 200 for GraphQL errors). */
export class GitHubError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const authHeaders = (token: string) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "User-Agent": USER_AGENT,
  "X-GitHub-Api-Version": "2022-11-28",
});

interface RestInit {
  method?: string;
  body?: unknown;
}

/** Calls a REST endpoint, e.g. rest(token, "/user"), and returns its JSON. Throws GitHubError on failure. */
export async function rest<T>(token: string, path: string, init: RestInit = {}): Promise<T> {
  return (await restResponse(token, path, init)).json<T>();
}

/** For the few endpoints that answer with text rather than JSON, such as /markdown. */
export async function restText(token: string, path: string, init: RestInit = {}): Promise<string> {
  return (await restResponse(token, path, init)).text();
}

async function restResponse(token: string, path: string, init: RestInit): Promise<Response> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    method: init.method ?? "GET",
    headers: { ...authHeaders(token), ...(init.body ? { "Content-Type": "application/json" } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!response.ok) throw new GitHubError(response.status, `GitHub ${path}: ${await response.text()}`);
  return response;
}

/**
 * Runs a GraphQL query or mutation and returns its `data`. GitHub answers GraphQL errors with HTTP 200 and an
 * `errors` list, so those are turned into a GitHubError too.
 */
export async function graphql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${GITHUB_API}/graphql`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new GitHubError(response.status, `GitHub GraphQL: ${await response.text()}`);
  const result = await response.json<{ data?: T; errors?: { message: string }[] }>();
  if (result.errors?.length || !result.data) {
    throw new GitHubError(200, `GitHub GraphQL: ${result.errors?.map((error) => error.message).join("; ")}`);
  }
  return result.data;
}
