/** GitHub's eight reactions, in GitHub's order, and how one visitor's click changes a comment's counts. */
import type { Reaction, ReactionContent } from "./api";

export const REACTION_EMOJI: Record<ReactionContent, string> = {
  THUMBS_UP: "👍",
  THUMBS_DOWN: "👎",
  LAUGH: "😄",
  HOORAY: "🎉",
  CONFUSED: "😕",
  HEART: "❤️",
  ROCKET: "🚀",
  EYES: "👀",
};

export const REACTION_ORDER = Object.keys(REACTION_EMOJI) as ReactionContent[];

/** Whether the visitor has already given `content` on this comment (each reaction counts once per person). */
export const hasReacted = (reactions: Reaction[], content: ReactionContent) =>
  reactions.some((reaction) => reaction.content === content && reaction.viewerHasReacted);

/** The counts after the visitor adds (or, with `remove`, takes back) one reaction, as GitHub will apply it. */
export function applyReaction(reactions: Reaction[], content: ReactionContent, remove: boolean): Reaction[] {
  const current = reactions.find((reaction) => reaction.content === content);
  const count = (current?.count ?? 0) + (remove ? -1 : 1);
  const others = reactions.filter((reaction) => reaction !== current);
  const next = count > 0 ? [...others, { content, count, viewerHasReacted: !remove }] : others;
  return next.sort((a, b) => REACTION_ORDER.indexOf(a.content) - REACTION_ORDER.indexOf(b.content));
}
