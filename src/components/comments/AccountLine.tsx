/** The small line under the comment box: who is signed in, a sign-out button, and a link to the thread on GitHub. */
import type { Viewer } from "./api";
import { useComments } from "./context";
import { fill } from "./labels";

interface Props {
  viewer: Viewer | null;
  /** The discussion on github.com, or null before the first comment. */
  threadUrl: string | null;
  onSignOut: () => void;
}

export function AccountLine({ viewer, threadUrl, onSignOut }: Props) {
  const { labels } = useComments();
  return (
    <p className="cx-account">
      {viewer && (
        <>
          {fill(labels.signedInAs, { login: viewer.login })} ·{" "}
          <button type="button" className="cx-link" onClick={onSignOut}>
            {labels.signOut}
          </button>
        </>
      )}
      {viewer && threadUrl && " · "}
      {threadUrl && <a href={threadUrl}>{labels.viewOnGitHub} ↗</a>}
    </p>
  );
}
