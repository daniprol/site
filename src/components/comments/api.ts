/** Typed calls to the comments API in worker/ (see worker/src/contract.ts for the routes). */
import type {
  ApiError,
  PostCommentBody,
  PostedComment,
  PreviewResult,
  ReactionBody,
  ReactionsResult,
  SessionInfo,
  Thread,
} from "../../../worker/src/contract";

export type { Comment, Reaction, ReactionContent, Reply, Thread, Viewer } from "../../../worker/src/contract";

/** An API failure, with a message from the Worker that can be shown as is. */
export class CommentsError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "same-origin", ...init });
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new CommentsError(response.status, (data as ApiError | null)?.error ?? response.statusText);
  }
  return data as T;
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const fetchThread = (term: string) => request<Thread>(`/api/comments?term=${encodeURIComponent(term)}`);

export const fetchViewer = () => request<SessionInfo>("/api/session").then((session) => session.viewer);

export const postComment = (body: PostCommentBody) =>
  post<PostedComment>("/api/comments", body).then((posted) => posted.comment);

export const postReaction = (body: ReactionBody) =>
  post<ReactionsResult>("/api/reactions", body).then((result) => result.reactions);

export const previewMarkdown = (text: string) =>
  post<PreviewResult>("/api/markdown", { text }).then((result) => result.html);

export const signOut = () => request<undefined>("/api/auth/logout", { method: "POST" });

/** Sends the visitor to GitHub to sign in, then back to this page's comments. */
export const signInUrl = () => `/api/auth/login?return=${encodeURIComponent(window.location.pathname)}`;
