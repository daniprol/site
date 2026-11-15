/**
 * Pure helpers that work on a loaded thread (no React, no network). The island keeps the thread in state
 * and uses these to fold long threads and to apply changes without waiting for a reload.
 */
import type { Comment, Reaction, Thread } from "./api";

/** Long threads show their first and last comments, with "Load more…" for the ones in between. */
const SHOWN_AT_START = 2;
const SHOWN_AT_END = 3;

/**
 * Splits the comments into those shown before the "Load more" marker (`head`), how many it hides, and those
 * shown after it (`tail`). `revealedCount` is how many hidden ones the reader has already loaded.
 */
export function foldComments(comments: Comment[], revealedCount: number) {
  const hidden = Math.max(0, comments.length - SHOWN_AT_START - SHOWN_AT_END - revealedCount);
  // Hiding a single comment saves nothing: show it.
  if (hidden <= 1) return { head: comments, hidden: 0, tail: [] };
  return {
    head: comments.slice(0, SHOWN_AT_START + revealedCount),
    hidden,
    tail: comments.slice(comments.length - SHOWN_AT_END),
  };
}

/** The thread with a just-posted comment added: at the end, or under the comment it replies to. */
export function withComment(thread: Thread, comment: Comment, replyTo?: string): Thread {
  if (!replyTo) {
    return { ...thread, commentCount: thread.commentCount + 1, comments: [...thread.comments, comment] };
  }
  return {
    ...thread,
    comments: thread.comments.map((parent) =>
      parent.id === replyTo
        ? { ...parent, replies: [...parent.replies, comment], replyCount: parent.replyCount + 1 }
        : parent,
    ),
  };
}

/** The thread with one comment's or reply's reactions changed by `change`. */
export function mapReactions(thread: Thread, subjectId: string, change: (reactions: Reaction[]) => Reaction[]): Thread {
  const apply = <T extends { id: string; reactions: Reaction[] }>(item: T): T =>
    item.id === subjectId ? { ...item, reactions: change(item.reactions) } : item;
  return {
    ...thread,
    comments: thread.comments.map((comment) => ({ ...apply(comment), replies: comment.replies.map(apply) })),
  };
}
