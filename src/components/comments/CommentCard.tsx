/**
 * One top-level comment as a GitHub conversation item: avatar on the thread line, a box with a header
 * ("dani commented 3 days ago", Author badge), the body, reactions, then its replies and a reply box.
 */
import { useState } from "react";

import type { Comment, ReactionContent, Reply } from "./api";
import { Composer } from "./Composer";
import { useComments } from "./context";
import { fill } from "./labels";
import { fullDate, timeAgo } from "./time";

const REACTION_EMOJI: Record<ReactionContent, string> = {
  THUMBS_UP: "👍",
  THUMBS_DOWN: "👎",
  LAUGH: "😄",
  HOORAY: "🎉",
  CONFUSED: "😕",
  HEART: "❤️",
  ROCKET: "🚀",
  EYES: "👀",
};

/** GitHub's placeholder for deleted accounts. */
const GHOST = {
  login: "ghost",
  avatarUrl: "https://avatars.githubusercontent.com/u/10137?v=4",
  url: "https://github.com/ghost",
};

export function CommentCard({ comment }: { comment: Comment }) {
  const { labels, viewer } = useComments();
  const [replying, setReplying] = useState(false);
  const author = comment.author ?? GHOST;
  const hiddenReplies = comment.replyCount - comment.replies.length;

  return (
    <article className="cx-item" id={`comment-${comment.id}`}>
      <Avatar src={author.avatarUrl} size={40} className="cx-avatar" />
      <div className="cx-box">
        <CommentHead reply={comment} withNotch />
        <CommentBody reply={comment} />

        {(comment.replies.length > 0 || replying || viewer) && (
          <div className="cx-replies">
            {comment.replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} />
            ))}
            {hiddenReplies > 0 && (
              <a className="cx-more" href={comment.url}>
                {fill(labels.moreOnGitHub, { n: hiddenReplies })}
              </a>
            )}
            {replying ? (
              <Composer replyTo={comment.id} onDone={() => setReplying(false)} />
            ) : (
              <button type="button" className="cx-reply-toggle" onClick={() => setReplying(true)}>
                {labels.reply}
              </button>
            )}
          </div>
        )}
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

function CommentHead({ reply, withNotch = false }: { reply: Reply; withNotch?: boolean }) {
  const { labels, localeTag } = useComments();
  const author = reply.author ?? GHOST;
  const [before, after] = labels.commented.split("{when}");

  return (
    <header className={withNotch ? "cx-head cx-head-notch" : "cx-head cx-head-plain"}>
      {withNotch && <Avatar src={author.avatarUrl} size={20} className="cx-mini" />}
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
    </header>
  );
}

function CommentBody({ reply }: { reply: Reply }) {
  const { labels } = useComments();

  if (reply.deleted) return <p className="cx-note">{labels.deleted}</p>;
  if (reply.minimized) return <p className="cx-note">{fill(labels.hidden, { reason: reply.minimized.reason })}</p>;

  return (
    <>
      {/* GitHub renders and sanitises the Markdown (bodyHTML), the same HTML github.com shows. */}
      <div className="cx-body" dangerouslySetInnerHTML={{ __html: reply.bodyHTML }} />
      {reply.reactions.length > 0 && (
        <ul className="cx-reactions">
          {reply.reactions.map(({ content, count }) => (
            <li key={content}>
              <a href={reply.url} title={labels.react}>
                <span aria-hidden="true">{REACTION_EMOJI[content]}</span>
                <span className="sr-only">{content.toLowerCase().replace("_", " ")}</span> {count}
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function Avatar({ src, size, className }: { src: string; size: number; className: string }) {
  // GitHub avatars take a size parameter; ask for 2× for sharp screens.
  const url = new URL(src);
  url.searchParams.set("s", String(size * 2));
  return <img className={className} src={url.href} width={size} height={size} alt="" loading="lazy" decoding="async" />;
}
