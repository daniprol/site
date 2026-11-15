/**
 * Where visitors write: the "Add a comment" box at the end of the conversation, and the "Write a reply" field
 * under each comment. Signed-out visitors get a sign-in button in their place.
 */
import { useState } from "react";

import { signInUrl } from "./api";
import { Avatar } from "./Avatar";
import { useComments } from "./context";
import { Editor } from "./Editor";

export function Composer() {
  const { labels, viewer, submit } = useComments();

  if (!viewer) {
    return (
      <div className="cx-item">
        <span className="cx-avatar cx-avatar-empty" aria-hidden="true">
          <GitHubMark />
        </span>
        <div className="cx-box cx-signin">
          <p>{labels.signInPrompt}</p>
          <a className="cx-button cx-button-primary" href={signInUrl()}>
            <GitHubMark />
            {labels.signIn}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="cx-item">
      <Avatar src={viewer.avatarUrl} size={40} className="cx-avatar" />
      <div className="cx-box">
        <Editor placeholder={labels.placeholder} submitLabel={labels.submit} onSubmit={(body) => submit(body)} />
      </div>
    </div>
  );
}

export function ReplyComposer({ replyTo }: { replyTo: string }) {
  const { labels, viewer, submit } = useComments();
  const [open, setOpen] = useState(false);

  if (!viewer) {
    return (
      <a className="cx-reply-field" href={signInUrl()}>
        {labels.signInToReply}
      </a>
    );
  }

  if (!open) {
    return (
      <button type="button" className="cx-reply-field" onClick={() => setOpen(true)}>
        <Avatar src={viewer.avatarUrl} size={24} className="cx-reply-avatar" />
        <span>{labels.replyPlaceholder}</span>
      </button>
    );
  }

  return (
    <div className="cx-reply-editor">
      <Editor
        placeholder={labels.replyPlaceholder}
        submitLabel={labels.reply}
        focusOnOpen
        onCancel={() => setOpen(false)}
        onSubmit={async (body) => {
          await submit(body, replyTo);
          setOpen(false);
        }}
      />
    </div>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}
