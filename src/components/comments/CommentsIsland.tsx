/**
 * The comments island: a page's GitHub discussion drawn as a pull-request conversation.
 *
 * An "island" is an interactive React component inside an otherwise static Astro page. CommentsSection.astro
 * renders it with `client:visible`, so the HTML is built ahead of time and React only downloads and takes
 * over ("hydrates") when the section scrolls into view. Until the thread arrives it shows a skeleton, which
 * is also what the static HTML contains. Every request goes to /api/* on the site's Worker (see api.ts),
 * which talks to GitHub.
 *
 * Two layouts:
 * - "standalone" (posts): its own timeline, with a header bar and the comment box at the end.
 * - "timeline" (snacks): items that slot into the page's PR timeline; the comment box is rendered into the
 *   element with id `composerSlot`, under the merge box, where GitHub puts it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { AccountLine } from "./AccountLine";
import {
  CommentsError,
  fetchThread,
  fetchViewer,
  postComment,
  postReaction,
  signOut,
  type ReactionContent,
  type Thread,
  type Viewer,
} from "./api";
import { CommentCard } from "./CommentCard";
import { Composer } from "./Composer";
import { CommentsContext, type CommentsContextValue } from "./context";
import { fill, type Labels } from "./labels";
import { applyReaction } from "./reactions";
import { Skeleton } from "./Skeleton";
import { foldComments, mapReactions, withComment } from "./thread";
import { useNotice } from "./useNotice";

interface Props {
  /** The page's path without base or locale, e.g. "writing/how-foliq-works". */
  term: string;
  /** BCP 47 tag for dates, e.g. "en-GB". */
  localeTag: string;
  /** The interface text, already translated on the server (see labels.ts). */
  labels: Labels;
  layout: "standalone" | "timeline";
  /** id of the element that takes the comment box in the "timeline" layout. */
  composerSlot?: string;
}

type LoadState = { status: "loading" } | { status: "error" } | { status: "ready"; thread: Thread };

/** How many more hidden comments each click on "Load more…" shows. */
const LOAD_MORE_STEP = 10;

export default function CommentsIsland({ term, localeTag, labels, layout, composerSlot }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [viewer, setViewer] = useState<Viewer | null>(null);
  /** How many comments hidden behind "Load more…" the reader has revealed. */
  const [revealedCount, setRevealedCount] = useState(0);
  const [notice, setNotice] = useNotice();

  /* ---------- Loading ---------- */

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

  /* ---------- Changes made by the visitor ---------- */

  /** Applies a change to the loaded thread. */
  const updateThread = useCallback((change: (thread: Thread) => Thread) => {
    setState((current) => (current.status === "ready" ? { status: "ready", thread: change(current.thread) } : current));
  }, []);

  /** Runs a signed-in action; if the session has ended, shows the sign-in prompt again. */
  const runSignedIn = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    try {
      return await action();
    } catch (error) {
      if (error instanceof CommentsError && error.status === 401) setViewer(null);
      throw error;
    }
  }, []);

  const submit = useCallback(
    async (body: string, replyTo?: string) => {
      const comment = await runSignedIn(() => postComment({ term, body, replyTo }));
      updateThread((thread) => withComment(thread, comment, replyTo));
    },
    [runSignedIn, term, updateThread],
  );

  /**
   * Reactions are optimistic: the counts change at once, then GitHub's answer replaces them, or the change is
   * rolled back if GitHub refuses. Requests for one comment run one after another (each waits for the
   * previous promise in `reactionQueues`), so quick clicks cannot overtake each other, and only the last
   * one's answer is applied.
   */
  const reactionQueues = useRef(new Map<string, Promise<void>>());
  const react = useCallback(
    (subjectId: string, content: ReactionContent, remove: boolean) => {
      updateThread((thread) =>
        mapReactions(thread, subjectId, (reactions) => applyReaction(reactions, content, remove)),
      );

      const queues = reactionQueues.current;
      const request: Promise<void> = (queues.get(subjectId) ?? Promise.resolve()).then(async () => {
        try {
          const reactions = await runSignedIn(() => postReaction({ term, subjectId, content, remove }));
          if (queues.get(subjectId) === request)
            updateThread((thread) => mapReactions(thread, subjectId, () => reactions));
        } catch {
          updateThread((thread) =>
            mapReactions(thread, subjectId, (current) => applyReaction(current, content, !remove)),
          );
          setNotice(labels.reactionFailed);
        }
      });
      queues.set(subjectId, request);
    },
    [runSignedIn, labels.reactionFailed, term, updateThread, setNotice],
  );

  // Shared with every component below through React context, so it is not passed down by hand.
  const context = useMemo<CommentsContextValue>(
    () => ({ labels, localeTag, viewer, submit, react }),
    [labels, localeTag, viewer, submit, react],
  );

  /* ---------- Rendering ---------- */

  const standalone = layout === "standalone";
  // `document` only exists in the browser; during the build this runs without one.
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
  const { head, hidden, tail } = foldComments(thread.comments, revealedCount);
  // Comments past the first hundred are only on GitHub.
  const offsiteCount = thread.commentCount - thread.comments.length;

  // The comment box and the account line: at the end of the list, or in the page's slot (timeline layout).
  const footer = (
    <>
      <Composer />
      <AccountLine
        viewer={viewer}
        threadUrl={thread.url}
        onSignOut={() => void signOut().then(() => setViewer(null))}
      />
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
            <button type="button" onClick={() => setRevealedCount(revealedCount + LOAD_MORE_STEP)}>
              <span>{fill(labels.hiddenItems, { n: hidden })}</span>
              <strong>{labels.loadMore}</strong>
            </button>
          </div>
        )}
        {tail.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
        {offsiteCount > 0 && thread.url && (
          <a className="cx-more cx-more-thread" href={thread.url}>
            {fill(labels.moreOnGitHub, { n: offsiteCount })}
          </a>
        )}
        {standalone && footer}
      </div>

      <p className="cx-notice" role="status" hidden={!notice}>
        {notice}
      </p>

      {/* A portal renders React content into a DOM element outside this component: here, the page's slot. */}
      {slot && createPortal(<div className="cx-thread cx-composer-area">{footer}</div>, slot)}
    </CommentsContext>
  );
}
