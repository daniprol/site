/**
 * The "Add a comment" box at the end of the conversation. Signed-out visitors get a "Sign in with GitHub"
 * button in its place. Replies have their own, smaller field (ReplyComposer.tsx).
 */
import { signInUrl } from "./api";
import { Avatar } from "./Avatar";
import { useComments } from "./context";
import { Editor } from "./Editor";
import { GitHubMark } from "./GitHubMark";

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
