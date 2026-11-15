/**
 * One top-level comment as a GitHub conversation item: avatar on the thread line, a box with a header
 * ("dani commented 3 days ago", Author badge), the body and reactions, then its replies and a reply field.
 */
import { useState } from "react";

import type { Comment, Reply } from "./api";
import { Avatar } from "./Avatar";
import { ReplyComposer } from "./Composer";
import { useComments } from "./context";
import { fill } from "./labels";
import { ReactionPicker, ReactionPills } from "./Reactions";
import { fullDate, timeAgo } from "./time";

/** Replies shown before "Show N more replies". */
const VISIBLE_REPLIES = 3;

/** GitHub's placeholder for deleted accounts. */
const GHOST = {
  login: "ghost",
  avatarUrl: "https://avatars.githubusercontent.com/u/10137?v=4",
  url: "https://github.com/ghost",
};

export function CommentCard({ comment }: { comment: Comment }) {
  const { labels } = useComments();
  const [allReplies, setAllReplies] = useState(false);
  const author = comment.author ?? GHOST;

  const replies = allReplies ? comment.replies : comment.replies.slice(0, VISIBLE_REPLIES);
  const folded = comment.replies.length - replies.length;
  // Replies past the first hundred are only on GitHub.
  const offsite = comment.replyCount - comment.replies.length;

  return (
    <article className="cx-item" id={`comment-${comment.id}`}>
      <Avatar src={author.avatarUrl} size={40} className="cx-avatar" />
      <div className="cx-box">
        <CommentHead reply={comment} notch />
        <CommentBody reply={comment} />

        <div className="cx-replies">
          {replies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}
          {folded > 0 && (
            <button type="button" className="cx-more" onClick={() => setAllReplies(true)}>
              {fill(labels.moreReplies, { n: folded })}
            </button>
          )}
          {allReplies && offsite > 0 && (
            <a className="cx-more" href={comment.url}>
              {fill(labels.moreOnGitHub, { n: offsite })}
            </a>
          )}
          <ReplyComposer replyTo={comment.id} />
        </div>
      </div>
    </article>
  );
}

function ReplyItem({ reply }: { reply: Reply }) {
  const author = reply.author ?? GHOST;
  return (
    <div className="cx-reply" id={`comment-${reply.id}`}>
      <Avatar src={author.avatarUrl} size={24} className="cx-reply-avatar" />
      <div className="cx-reply-main">
        <CommentHead reply={reply} />
        <CommentBody reply={reply} />
      </div>
    </div>
  );
}

function CommentHead({ reply, notch = false }: { reply: Reply; notch?: boolean }) {
  const { labels, localeTag } = useComments();
  const author = reply.author ?? GHOST;
  const [before, after] = labels.commented.split("{when}");

  return (
    <header className={notch ? "cx-head cx-head-box" : "cx-head"}>
      {notch && <Avatar src={author.avatarUrl} size={20} className="cx-mini" />}
      <span className="cx-who">
        <a className="cx-login" href={author.url}>
          {author.login}
        </a>{" "}
        {before}
        <a href={reply.url} className="cx-when">
          <time dateTime={reply.createdAt} title={fullDate(reply.createdAt, localeTag)}>
            {timeAgo(reply.createdAt, localeTag)}
          </time>
        </a>
        {after}
        {reply.edited && <span className="cx-edited"> · {labels.edited}</span>}
      </span>
      {reply.byOwner && <span className="cx-label">{labels.owner}</span>}
      {!reply.deleted && !reply.minimized && <ReactionPicker subjectId={reply.id} reactions={reply.reactions} />}
    </header>
  );
}

function CommentBody({ reply }: { reply: Reply }) {
  const { labels } = useComments();

  if (reply.deleted) return <p className="cx-note">{labels.deleted}</p>;
  if (reply.minimized) return <p className="cx-note">{fill(labels.hidden, { reason: reply.minimized.reason })}</p>;

  return (
    <div className="cx-content">
      {/* GitHub renders and sanitises the Markdown (bodyHTML), the same HTML github.com shows. */}
      <div className="cx-body" dangerouslySetInnerHTML={{ __html: reply.bodyHTML }} />
      <ReactionPills subjectId={reply.id} reactions={reply.reactions} />
    </div>
  );
}
