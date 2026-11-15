/**
 * The box for writing a comment or a reply, styled like GitHub's. Signed-out visitors get a sign-in prompt
 * in its place. Ctrl/⌘ + Enter posts.
 */
import { useId, useState, type KeyboardEvent, type SubmitEvent } from "react";

import { signInUrl } from "./api";
import { Avatar } from "./CommentCard";
import { useComments } from "./context";

interface Props {
  /** Set for a reply box under a top-level comment. */
  replyTo?: string;
  /** Called after a successful post, and on Cancel (reply boxes only). */
  onDone?: () => void;
}

export function Composer({ replyTo, onDone }: Props) {
  const { labels, viewer, submit } = useComments();
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldId = useId();
  const isReply = replyTo !== undefined;

  if (!viewer) {
    return (
      <div className={isReply ? "cx-signin cx-signin-reply" : "cx-signin"}>
        {!isReply && <p>{labels.signInPrompt}</p>}
        <a className="cx-button" href={signInUrl()}>
          <GitHubMark />
          {labels.signIn}
        </a>
      </div>
    );
  }

  const send = async () => {
    if (!body.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      await submit(body, replyTo);
      setBody("");
      onDone?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setPosting(false);
    }
  };

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    void send();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void send();
  };

  const placeholder = isReply ? labels.replyPlaceholder : labels.placeholder;

  return (
    <form className={isReply ? "cx-composer cx-composer-reply" : "cx-item cx-composer"} onSubmit={onSubmit}>
      {!isReply && <Avatar src={viewer.avatarUrl} size={40} className="cx-avatar" />}
      <div className="cx-box">
        <label htmlFor={fieldId} className="sr-only">
          {placeholder}
        </label>
        <textarea
          id={fieldId}
          value={body}
          placeholder={placeholder}
          rows={isReply ? 3 : 4}
          maxLength={65_536}
          disabled={posting}
          // A reply box opens because the reader asked for it, so it can take focus.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={isReply}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="cx-composer-foot">
          <span className="cx-hint">{labels.markdown}</span>
          {error && (
            <span className="cx-error" role="alert">
              {error}
            </span>
          )}
          {isReply && (
            <button type="button" className="cx-button cx-button-quiet" onClick={onDone}>
              {labels.cancel}
            </button>
          )}
          <button type="submit" className="cx-button cx-button-primary" disabled={posting || !body.trim()}>
            {posting ? labels.submitting : isReply ? labels.reply : labels.submit}
          </button>
        </div>
      </div>
    </form>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}
