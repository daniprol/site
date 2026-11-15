/**
 * The comments themselves: reading a page's thread, posting a comment or reply, reacting, and previewing
 * Markdown. Everything except a signed-out read runs as the signed-in visitor.
 */
import { cachedThread, forgetThread, type CacheStatus } from "../cache";
import type {
  PostCommentBody,
  PostedComment,
  PreviewBody,
  PreviewResult,
  ReactionBody,
  ReactionContent,
  ReactionsResult,
  Thread,
} from "../contract";
import type { Env } from "../env";
import { installationToken } from "../github/app";
import { addComment, createDiscussion, findDiscussion, readThread, setReaction } from "../github/discussions";
import { renderMarkdown } from "../github/markdown";
import { assertSameOrigin, HttpError, json, readJson } from "../http";
import { asViewer, readSession, type ViewerResult } from "../session";

/** GitHub's own limit on a comment's length. */
const MAX_BODY_LENGTH = 65_536;
/** Paths without base or locale: "writing/how-foliq-works", "snacks/herdr". */
const TERM = /^[\w-]+(?:\/[\w.-]+)*$/;
const NODE_ID = /^[\w=-]{1,100}$/;
const REACTIONS = new Set<string>([
  "THUMBS_UP",
  "THUMBS_DOWN",
  "LAUGH",
  "HOORAY",
  "CONFUSED",
  "HEART",
  "ROCKET",
  "EYES",
] satisfies ReactionContent[]);

/**
 * Signed-out visitors share the edge-cached thread. Signed-in visitors read it fresh with their own token,
 * so they see which reactions are theirs and their own new comments at once.
 */
export async function getComments(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const term = parseTerm(url.searchParams.get("term"));

  let read: ViewerResult<Thread> | undefined;
  let status: CacheStatus = "BYPASS";
  if (await readSession(request, env)) {
    read = await asViewer(request, env, (token) => loadThread(env, token, term)).catch((error: unknown) => {
      // A signed-in read that fails on the visitor's token falls back to the shared, signed-out one.
      if (error instanceof HttpError && error.status === 401) return undefined;
      throw error;
    });
  }
  if (!read) {
    const cached = await cachedThread(ctx, url.origin, term, async () =>
      loadThread(env, await installationToken(env), term),
    );
    read = { result: cached.thread };
    status = cached.status;
  }

  console.log(JSON.stringify({ route: "comments", term, cache: status }));
  // Browsers revalidate every time; the edge cache is what keeps GitHub calls down.
  return reply(read, { "Cache-Control": "no-cache", "X-Comments-Cache": status });
}

export async function postComment(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const input = parsePostBody(await readJson(request));
  const origin = new URL(request.url).origin;

  const posted = await asViewer(request, env, async (token) => {
    const appToken = await installationToken(env);
    const discussion =
      (await findDiscussion(env, appToken, input.term)) ??
      (input.replyTo
        ? null
        : await createDiscussion(env, appToken, input.term, await pageUrl(env, origin, input.term)));
    if (!discussion) throw new HttpError(404, "That comment no longer exists.");
    return { comment: await addComment(token, discussion, input.body, input.replyTo) } satisfies PostedComment;
  });
  await forgetThread(origin, input.term);
  return reply(posted, {}, 201);
}

export async function postReaction(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const input = parseReactionBody(await readJson(request));
  const reacted = await asViewer(
    request,
    env,
    async (token) =>
      ({
        reactions: await setReaction(token, input.subjectId, input.content, input.remove),
      }) satisfies ReactionsResult,
  );
  await forgetThread(new URL(request.url).origin, input.term);
  return reply(reacted);
}

export async function previewMarkdown(request: Request, env: Env): Promise<Response> {
  assertSameOrigin(request);
  const { text } = (await readJson(request)) as Partial<PreviewBody>;
  if (typeof text !== "string" || text.length > MAX_BODY_LENGTH) throw new HttpError(400, "Nothing to preview.");
  const preview = await asViewer(
    request,
    env,
    async (token) =>
      ({
        html: await renderMarkdown(env, token, text),
      }) satisfies PreviewResult,
  );
  return reply(preview);
}

async function loadThread(env: Env, token: string, term: string): Promise<Thread> {
  const discussion = await findDiscussion(env, token, term);
  return discussion ? readThread(env, token, discussion) : { url: null, commentCount: 0, comments: [] };
}

/** A JSON response for `result`, storing the refreshed session cookie if there is one. */
function reply<T>({ result, cookie }: ViewerResult<T>, headers: Record<string, string> = {}, status = 200): Response {
  const response = json(result, { status, headers });
  if (cookie) response.headers.append("Set-Cookie", cookie);
  return response;
}

function parseTerm(value: unknown): string {
  if (typeof value !== "string" || value.length > 200 || !TERM.test(value)) {
    throw new HttpError(400, "Unknown page.");
  }
  return value;
}

function parseNodeId(value: unknown): string {
  if (typeof value !== "string" || !NODE_ID.test(value)) throw new HttpError(400, "Unknown comment.");
  return value;
}

function parsePostBody(value: unknown): PostCommentBody {
  const { term, body, replyTo } = (value ?? {}) as Record<string, unknown>;
  if (typeof body !== "string" || !body.trim()) throw new HttpError(400, "Write something first.");
  if (body.length > MAX_BODY_LENGTH) throw new HttpError(400, "That comment is too long for GitHub.");
  return { term: parseTerm(term), body, replyTo: replyTo === undefined ? undefined : parseNodeId(replyTo) };
}

function parseReactionBody(value: unknown): ReactionBody {
  const { term, subjectId, content, remove } = (value ?? {}) as Record<string, unknown>;
  if (typeof content !== "string" || !REACTIONS.has(content)) throw new HttpError(400, "Unknown reaction.");
  return {
    term: parseTerm(term),
    subjectId: parseNodeId(subjectId),
    content: content as ReactionContent,
    remove: remove === true,
  };
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
