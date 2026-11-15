/**
 * The row of reaction pills under a comment, one per reaction in use, highlighted when it includes the
 * visitor. Clicking a pill adds or takes back their reaction. Renders nothing when there are none.
 */
import type { Reaction } from "./api";
import { REACTION_EMOJI } from "./reactions";
import { useReactionToggle } from "./useReactionToggle";

export function ReactionPills({ subjectId, reactions }: { subjectId: string; reactions: Reaction[] }) {
  const toggle = useReactionToggle(subjectId, reactions);
  if (reactions.length === 0) return null;

  return (
    <div className="cx-reactions">
      {reactions.map(({ content, count, viewerHasReacted }) => (
        <button
          key={content}
          type="button"
          className="cx-reaction"
          aria-pressed={viewerHasReacted}
          onClick={() => toggle(content)}
        >
          <span>{REACTION_EMOJI[content]}</span>
          <span className="cx-reaction-count">{count}</span>
        </button>
      ))}
    </div>
  );
}
