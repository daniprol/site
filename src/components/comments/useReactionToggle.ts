/**
 * The click handler shared by the reaction pills and the reaction picker: adds or takes back the visitor's
 * reaction. The counts change at once (see `react` in CommentsIsland.tsx); signed-out visitors are sent to
 * sign in first.
 */
import { signInUrl, type Reaction, type ReactionContent } from "./api";
import { useComments } from "./context";
import { hasReacted } from "./reactions";

export function useReactionToggle(subjectId: string, reactions: Reaction[]) {
  const { viewer, react } = useComments();
  return (content: ReactionContent) => {
    if (viewer) react(subjectId, content, hasReacted(reactions, content));
    else window.location.href = signInUrl();
  };
}
