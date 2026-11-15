/**
 * The comments island: a page's GitHub discussion shown as a pull-request conversation, with a box to add to
 * it. Comments load when the section scrolls into view (client:visible); everything goes through /api/* on
 * the site's Worker, which talks to GitHub.
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CommentsError,
  fetchThread,
  fetchViewer,
  postComment,
  signOut,
  type Comment,
  type Thread,
  type Viewer,
} from "./api";
import { CommentCard } from "./CommentCard";
import { Composer } from "./Composer";
import { CommentsContext, type CommentsContextValue } from "./context";
import { fill, type Labels } from "./labels";

interface Props {
  /** The page's path without base or locale, e.g. "writing/how-foliq-works". */
  term: string;
  localeTag: string;
  labels: Labels;
}

type State = { status: "loading" } | { status: "error" } | { status: "ready"; thread: Thread };

export default function Comments({ term, localeTag, labels }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [viewer, setViewer] = useState<Viewer | null>(null);

  const load = useCallback(
    () =>
      Promise.all([fetchThread(term), fetchViewer()]).then(
        ([thread, signedIn]) => {
          setState({ status: "ready", thread });
          setViewer(signedIn);
        },
        () => setState({ status: "error" }),
      ),
    [term],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const retry = () => {
    setState({ status: "loading" });
    void load();
  };

  const submit = useCallback(
    async (body: string, replyTo?: string) => {
      try {
        const comment = await postComment({ term, body, replyTo });
        setState((current) =>
          current.status === "ready"
            ? { status: "ready", thread: withComment(current.thread, comment, replyTo) }
            : current,
        );
      } catch (error) {
        // The session ended (expired, or revoked on GitHub): show the sign-in prompt again.
        if (error instanceof CommentsError && error.status === 401) setViewer(null);
        throw error;
      }
    },
    [term],
  );

  const context = useMemo<CommentsContextValue>(
    () => ({ labels, localeTag, viewer, submit }),
    [labels, localeTag, viewer, submit],
  );

  if (state.status === "loading") return <p className="cx-status">{labels.loading}</p>;
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
  const hidden = thread.commentCount - thread.comments.length;

  return (
    <CommentsContext value={context}>
      <div className="cx-bar">
        <span>{thread.commentCount === 1 ? labels.countOne : fill(labels.countMany, { n: thread.commentCount })}</span>
        {thread.url && <a href={thread.url}>{labels.viewOnGitHub} ↗</a>}
      </div>

      <div className="cx-timeline">
        {thread.comments.length === 0 && <p className="cx-empty">{labels.empty}</p>}
        {thread.comments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
        {hidden > 0 && thread.url && (
          <a className="cx-more cx-more-thread" href={thread.url}>
            {fill(labels.moreOnGitHub, { n: hidden })}
          </a>
        )}
        <Composer />
      </div>

      {viewer && (
        <p className="cx-account">
          {fill(labels.signedInAs, { login: viewer.login })} ·{" "}
          <button type="button" className="cx-link" onClick={() => void signOut().then(() => setViewer(null))}>
            {labels.signOut}
          </button>
        </p>
      )}
    </CommentsContext>
  );
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
