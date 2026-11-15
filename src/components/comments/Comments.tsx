/**
 * The comments island: a page's GitHub discussion drawn as a pull-request conversation. It hydrates when it
 * scrolls into view (client:visible); until the thread arrives it shows a skeleton, which is also what the
 * static HTML contains. Everything goes through /api/* on the site's Worker, which talks to GitHub.
 *
 * Two layouts:
 * - "standalone" (posts): its own timeline, with a header bar and the comment box at the end.
 * - "timeline" (snacks): items that slot into the page's PR timeline; the comment box is rendered into the
 *   element with id `composerSlot`, under the merge box, where GitHub puts it.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  CommentsError,
  fetchThread,
  fetchViewer,
  postComment,
  postReaction,
  signOut,
  type Comment,
  type Reaction,
  type ReactionContent,
  type Thread,
  type Viewer,
} from "./api";
import { CommentCard } from "./CommentCard";
import { Composer } from "./Composer";
import { CommentsContext, type CommentsContextValue } from "./context";
import { fill, type Labels } from "./labels";
import { Skeleton } from "./Skeleton";

interface Props {
  /** The page's path without base or locale, e.g. "writing/how-foliq-works". */
  term: string;
  localeTag: string;
  labels: Labels;
  layout: "standalone" | "timeline";
  /** id of the element that takes the comment box in the "timeline" layout. */
  composerSlot?: string;
}

type State = { status: "loading" } | { status: "error" } | { status: "ready"; thread: Thread };

/** Long threads show their first and last comments, with "Load more…" for the ones in between. */
const HEAD = 2;
const TAIL = 3;
const LOAD_STEP = 10;

export default function Comments({ term, localeTag, labels, layout, composerSlot }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [revealed, setRevealed] = useState(0);

  const load = useCallback(
    () =>
      // The session first: a signed-in visitor's thread read includes which reactions are theirs.
      fetchViewer()
        .then(async (signedIn) => {
          const thread = await fetchThread(term);
          setViewer(signedIn);
          setState({ status: "ready", thread });
        })
        .catch(() => setState({ status: "error" })),
    [term],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const retry = () => {
    setState({ status: "loading" });
    void load();
  };

  /** Applies a change to the loaded thread. */
  const update = useCallback((change: (thread: Thread) => Thread) => {
    setState((current) => (current.status === "ready" ? { status: "ready", thread: change(current.thread) } : current));
  }, []);

  /** Runs a signed-in action; if the session has ended, shows the sign-in prompt again. */
  const asViewer = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    try {
      return await action();
    } catch (error) {
      if (error instanceof CommentsError && error.status === 401) setViewer(null);
      throw error;
    }
  }, []);

  const submit = useCallback(
    async (body: string, replyTo?: string) => {
      const comment = await asViewer(() => postComment({ term, body, replyTo }));
      update((thread) => withComment(thread, comment, replyTo));
    },
    [asViewer, term, update],
  );

  const react = useCallback(
    async (subjectId: string, content: ReactionContent, remove: boolean) => {
      const reactions = await asViewer(() => postReaction({ term, subjectId, content, remove }));
      update((thread) => withReactions(thread, subjectId, reactions));
    },
    [asViewer, term, update],
  );

  const context = useMemo<CommentsContextValue>(
    () => ({ labels, localeTag, viewer, submit, react }),
    [labels, localeTag, viewer, submit, react],
  );

  const standalone = layout === "standalone";
  const slot =
    !standalone && composerSlot && typeof document !== "undefined" ? document.getElementById(composerSlot) : null;

  if (state.status === "loading") return <Skeleton label={labels.loading} />;
  if (state.status === "error") {
    return (
      <p className="cx-status">
        {labels.error}{" "}
        <button type="button" className="cx-link" onClick={retry}>
          {labels.retry}
        </button>
      </p>
    );
  }

  const { thread } = state;
  const { head, hidden, tail } = fold(thread.comments, revealed);
  const offsite = thread.commentCount - thread.comments.length;

  const footer = (
    <>
      <Composer />
      <p className="cx-account">
        {viewer && (
          <>
            {fill(labels.signedInAs, { login: viewer.login })} ·{" "}
            <button type="button" className="cx-link" onClick={() => void signOut().then(() => setViewer(null))}>
              {labels.signOut}
            </button>
          </>
        )}
        {viewer && thread.url && " · "}
        {thread.url && <a href={thread.url}>{labels.viewOnGitHub} ↗</a>}
      </p>
    </>
  );

  return (
    <CommentsContext value={context}>
      {standalone && (
        <div className="cx-bar">
          {thread.commentCount === 1 ? labels.countOne : fill(labels.countMany, { n: thread.commentCount })}
        </div>
      )}

      <div className={standalone ? "cx-timeline" : "cx-thread"}>
        {standalone && thread.comments.length === 0 && <p className="cx-empty">{labels.empty}</p>}
        {head.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
        {hidden > 0 && (
          <div className="cx-hidden-items">
            <button type="button" onClick={() => setRevealed(revealed + LOAD_STEP)}>
              <span>{fill(labels.hiddenItems, { n: hidden })}</span>
              <strong>{labels.loadMore}</strong>
            </button>
          </div>
        )}
        {tail.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
        {offsite > 0 && thread.url && (
          <a className="cx-more cx-more-thread" href={thread.url}>
            {fill(labels.moreOnGitHub, { n: offsite })}
          </a>
        )}
        {standalone && footer}
      </div>

      {slot && createPortal(<div className="cx-thread cx-composer-area">{footer}</div>, slot)}
    </CommentsContext>
  );
}

/** Splits the comments into those shown before the "Load more" marker, how many it hides, and those after. */
function fold(comments: Comment[], revealed: number) {
  const hidden = Math.max(0, comments.length - HEAD - TAIL - revealed);
  // Hiding a single comment saves nothing: show it.
  if (hidden <= 1) return { head: comments, hidden: 0, tail: [] };
  return {
    head: comments.slice(0, HEAD + revealed),
    hidden,
    tail: comments.slice(comments.length - TAIL),
  };
}

/** The thread with a just-posted comment added: at the end, or under the comment it replies to. */
function withComment(thread: Thread, comment: Comment, replyTo?: string): Thread {
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

/** The thread with new reaction counts on one comment or reply. */
function withReactions(thread: Thread, subjectId: string, reactions: Reaction[]): Thread {
  const apply = <T extends { id: string; reactions: Reaction[] }>(item: T): T =>
    item.id === subjectId ? { ...item, reactions } : item;
  return {
    ...thread,
    comments: thread.comments.map((comment) => ({ ...apply(comment), replies: comment.replies.map(apply) })),
  };
}
