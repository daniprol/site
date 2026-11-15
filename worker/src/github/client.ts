/** Minimal GitHub REST and GraphQL clients. Every call names the token it runs as. */

const API = "https://api.github.com";

/** A failed GitHub call. `status` is GitHub's HTTP status (or 200 for GraphQL errors). */
export class GitHubError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const headers = (token: string) => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "User-Agent": "site-comments",
  "X-GitHub-Api-Version": "2022-11-28",
});

export async function rest<T>(token: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: { ...headers(token), ...(init.body ? { "Content-Type": "application/json" } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!response.ok) throw new GitHubError(response.status, `GitHub ${path}: ${await response.text()}`);
  return response.json<T>();
}

export async function graphql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API}/graphql`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new GitHubError(response.status, `GitHub GraphQL: ${await response.text()}`);
  const result = await response.json<{ data?: T; errors?: { message: string }[] }>();
  if (result.errors?.length || !result.data) {
    throw new GitHubError(200, `GitHub GraphQL: ${result.errors?.map((error) => error.message).join("; ")}`);
  }
  return result.data;
}
