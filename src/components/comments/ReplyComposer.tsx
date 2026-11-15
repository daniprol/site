/**
 * The "Write a reply" field under each comment. It starts as a one-line button and opens into a full editor
 * when clicked. Signed-out visitors get a link to sign in instead.
 */
import { useState } from "react";

import { signInUrl } from "./api";
import { Avatar } from "./Avatar";
import { useComments } from "./context";
import { Editor } from "./Editor";

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
