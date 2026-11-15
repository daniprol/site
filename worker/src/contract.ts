/**
 * The comments API, as the browser sees it. Types only: the Worker produces these shapes and the
 * comments island (src/components/comments) consumes them.
 *
 *   GET  /api/comments?term=writing/foo  → Thread         (cached about a minute; fresh for signed-in visitors)
 *   POST /api/comments  PostCommentBody  → PostedComment  (signed-in visitors only, like every POST below)
 *   POST /api/reactions ReactionBody     → ReactionsResult
 *   POST /api/markdown  PreviewBody      → PreviewResult
 *   GET  /api/session                    → SessionInfo
 *   GET  /api/auth/login?return=/path    → redirect to GitHub, then back to /path signed in
 *   POST /api/auth/logout                → 204
 *
 * GET /api/comments sends X-Comments-Cache: HIT or MISS (edge cache), or BYPASS for signed-in visitors.
 *
 * A "term" is the page's path without base or locale ("writing/how-foliq-works"), so every language of a
 * page shares one thread. Each term has one GitHub discussion, titled with the term (as giscus did).
 */

export type ReactionContent =
  | "THUMBS_UP"
  | "THUMBS_DOWN"
  | "LAUGH"
  | "HOORAY"
  | "CONFUSED"
  | "HEART"
  | "ROCKET"
  | "EYES";

export interface Author {
  login: string;
  avatarUrl: string;
  url: string;
}

/** A reply, or the common part of a top-level comment. */
export interface Reply {
  id: string;
  /** The comment on github.com, where it can be edited, reacted to or reported. */
  url: string;
  /** null when the account was deleted ("ghost" on GitHub). */
  author: Author | null;
  /** True when the author owns the repository, i.e. wrote the page. */
  byOwner: boolean;
  /** Rendered and sanitised by GitHub. */
  bodyHTML: string;
  createdAt: string;
  edited: boolean;
  deleted: boolean;
  /** Hidden by a moderator; the reason is GitHub's ("spam", "off-topic", …). */
  minimized: { reason: string } | null;
  /** Only reactions with at least one person, in GitHub's order. */
  reactions: Reaction[];
}

export interface Reaction {
  content: ReactionContent;
  count: number;
  /** Whether the signed-in visitor is one of them (always false for signed-out reads). */
  viewerHasReacted: boolean;
}

export interface Comment extends Reply {
  replies: Reply[];
  /** All replies, which can be more than the ones included. */
  replyCount: number;
}

export interface Thread {
  /** The discussion on github.com, or null while the page has no comments yet. */
  url: string | null;
  /** All top-level comments, which can be more than the ones included. */
  commentCount: number;
  comments: Comment[];
}

export interface PostCommentBody {
  term: string;
  /** GitHub-flavoured Markdown. */
  body: string;
  /** Set to reply to a top-level comment (GitHub threads are one level deep). */
  replyTo?: string;
}

export interface PostedComment {
  comment: Comment;
}

export interface ReactionBody {
  term: string;
  /** The comment or reply to react to. */
  subjectId: string;
  content: ReactionContent;
  /** true takes the visitor's reaction away again. */
  remove: boolean;
}

export interface ReactionsResult {
  reactions: Reaction[];
}

export interface PreviewBody {
  /** GitHub-flavoured Markdown, rendered as it would be in this repository. */
  text: string;
}

export interface PreviewResult {
  html: string;
}

export interface Viewer {
  login: string;
  avatarUrl: string;
}

export interface SessionInfo {
  viewer: Viewer | null;
}

export interface ApiError {
  error: string;
}
