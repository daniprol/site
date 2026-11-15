/** Reading a page's comments (public, cached) and posting one (signed-in visitors, as themselves). */
import { cachedThread, forgetThread } from "../cache";
import type { PostCommentBody, PostedComment } from "../contract";
import type { Env } from "../env";
import { installationToken } from "../github/app";
import { GitHubError } from "../github/client";
import { addComment, createDiscussion, findDiscussion, readThread } from "../github/discussions";
import { assertSameOrigin, HttpError, json, readJson } from "../http";
import { clearSessionCookie, readSession, withFreshToken } from "../session";

/** GitHub's own limit on a comment's length. */
const MAX_BODY_LENGTH = 65_536;
/** Paths without base or locale: "writing/how-foliq-works", "snacks/herdr". */
const TERM = /^[\w-]+(?:\/[\w.-]+)*$/;
const NODE_ID = /^[\w=-]{1,100}$/;

export async function getComments(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const term = parseTerm(url.searchParams.get("term"));
  const thread = await cachedThread(ctx, url.origin, term, async () => {
    const token = await installationToken(env);
    const discussion = await findDiscussion(env, token, term);
    return discussion ? readThread(env, token, discussion) : { url: null, commentCount: 0, comments: [] };
  });
  // Browsers revalidate every time; the edge cache is what keeps GitHub calls down.
  return json(thread, { headers: { "Cache-Control": "no-cache" } });
}

export async function postComment(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const stored = await readSession(request, env);
  if (!stored) throw new HttpError(401, "Sign in with GitHub to comment.");
  const input = parsePostBody(await readJson(request));
  const origin = new URL(request.url).origin;

  const { session, cookie } = await withFreshToken(env, stored);
  const appToken = await installationToken(env);
  const discussion =
    (await findDiscussion(env, appToken, input.term)) ??
    (input.replyTo ? null : await createDiscussion(env, appToken, input.term, await pageUrl(env, origin, input.term)));
  if (!discussion) throw new HttpError(404, "That comment no longer exists.");

  let comment;
  try {
    comment = await addComment(session.accessToken, discussion, input.body, input.replyTo);
  } catch (error) {
    // The visitor revoked the app on GitHub, or the token stopped working: sign them out.
    if (error instanceof GitHubError && error.status === 401) {
      throw new HttpError(401, "Your GitHub sign-in has expired. Sign in again.", clearSessionCookie());
    }
    throw error;
  }
  await forgetThread(origin, input.term);

  const headers = new Headers();
  if (cookie) headers.append("Set-Cookie", cookie);
  return json({ comment } satisfies PostedComment, { status: 201, headers });
}

function parseTerm(value: unknown): string {
  if (typeof value !== "string" || value.length > 200 || !TERM.test(value)) {
    throw new HttpError(400, "Unknown page.");
  }
  return value;
}

function parsePostBody(value: unknown): PostCommentBody {
  const { term, body, replyTo } = (value ?? {}) as Record<string, unknown>;
  if (typeof body !== "string" || !body.trim()) throw new HttpError(400, "Write something first.");
  if (body.length > MAX_BODY_LENGTH) throw new HttpError(400, "That comment is too long for GitHub.");
  if (replyTo !== undefined && (typeof replyTo !== "string" || !NODE_ID.test(replyTo))) {
    throw new HttpError(400, "Unknown comment to reply to.");
  }
  return { term: parseTerm(term), body, replyTo };
}

/**
 * The page a new discussion belongs to. Only pages that exist on the site get one, so the API cannot be used
 * to open discussions about arbitrary terms.
 */
async function pageUrl(env: Env, origin: string, term: string): Promise<string> {
  const url = `${origin}/${term}/`;
  const page = await env.ASSETS.fetch(new Request(url));
  if (!page.ok) throw new HttpError(404, "Unknown page.");
  return url;
}
