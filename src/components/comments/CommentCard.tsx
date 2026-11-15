/**
 * One top-level comment as a GitHub conversation item: avatar on the thread line, a box with a header
 * ("dani commented 3 days ago", Author badge), the body and reactions, then its replies and a reply field.
 */
import { useState } from "react";

import type { Comment, Reply } from "./api";
import { Avatar } from "./Avatar";
import { useComments } from "./context";
import { fill } from "./labels";
import { ReactionPicker } from "./ReactionPicker";
import { ReactionPills } from "./ReactionPills";
import { ReplyComposer } from "./ReplyComposer";
import { fullDate, timeAgo } from "./time";

/** Replies shown before "Show N more replies". */
const VISIBLE_REPLIES = 3;

/** GitHub's placeholder for deleted accounts. */
const GHOST = {
  login: "ghost",
  avatarUrl: "https://avatars.githubusercontent.com/u/10137?v=4",
  url: "https://github.com/ghost",
};

/** A top-level comment with its replies (folded after VISIBLE_REPLIES) and the field to reply. */
export function CommentCard({ comment }: { comment: Comment }) {
  const { labels } = useComments();
  const [showAllReplies, setShowAllReplies] = useState(false);
  const author = comment.author ?? GHOST;

  const replies = showAllReplies ? comment.replies : comment.replies.slice(0, VISIBLE_REPLIES);
  const foldedCount = comment.replies.length - replies.length;
  // Replies past the first hundred are only on GitHub.
  const offsiteCount = comment.replyCount - comment.replies.length;

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
          {foldedCount > 0 && (
            <button type="button" className="cx-more" onClick={() => setShowAllReplies(true)}>
              {fill(labels.moreReplies, { n: foldedCount })}
            </button>
          )}
          {showAllReplies && offsiteCount > 0 && (
            <a className="cx-more" href={comment.url}>
              {fill(labels.moreOnGitHub, { n: offsiteCount })}
            </a>
          )}
          <ReplyComposer replyTo={comment.id} />
        </div>
      </div>
    </article>
  );
}

/** One reply, smaller, inside its parent's box. */
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

/**
 * "dani commented 3 days ago", with the Author badge and the reaction picker. `notch` is the top-level
 * comment's version: a grey header bar with a small avatar, for narrow screens where the big one is hidden.
 */
function CommentHead({ reply, notch = false }: { reply: Reply; notch?: boolean }) {
  const { labels, localeTag } = useComments();
  const author = reply.author ?? GHOST;
  // The translated sentence has the time in the middle ("{when}"), so split it around the <time> link.
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

/** The comment's text and reactions, or a short note if it was deleted or hidden by a moderator. */
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
