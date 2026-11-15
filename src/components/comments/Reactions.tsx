/**
 * GitHub's reactions: a smiley in each comment's header that opens the eight reactions GitHub offers, and a
 * row of pills under the body, one per reaction in use, highlighted when it includes you. Clicking a pill adds
 * or takes back your reaction. Signed-out visitors are sent to sign in first.
 */
import { useEffect, useRef, useState } from "react";

import { signInUrl, type Reaction, type ReactionContent } from "./api";
import { useComments } from "./context";
import { hasReacted, REACTION_EMOJI, REACTION_ORDER } from "./reactions";

/**
 * Adds or takes back the visitor's reaction. The counts change at once (see `react` in Comments.tsx);
 * signed-out visitors are sent to sign in first.
 */
function useReactionToggle(subjectId: string, reactions: Reaction[]) {
  const { viewer, react } = useComments();
  return (content: ReactionContent) => {
    if (viewer) react(subjectId, content, hasReacted(reactions, content));
    else window.location.href = signInUrl();
  };
}

/** The pills under a comment, one per reaction in use. Nothing when there are none. */
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

/** The smiley in a comment's header, which opens the eight reactions GitHub offers. */
export function ReactionPicker({ subjectId, reactions }: { subjectId: string; reactions: Reaction[] }) {
  const { labels } = useComments();
  const toggle = useReactionToggle(subjectId, reactions);
  return <PickerMenu label={labels.addReaction} onPick={toggle} />;
}

function PickerMenu({ label, onPick }: { label: string; onPick: (content: ReactionContent) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Close on a click elsewhere or on Escape, like GitHub's menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="cx-picker" ref={root}>
      <button
        type="button"
        className="cx-picker-toggle"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => setOpen(!open)}
      >
        <SmileyIcon />
      </button>
      {open && (
        <div className="cx-picker-menu" role="menu" aria-label={label}>
          {REACTION_ORDER.map((content) => (
            <button
              key={content}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onPick(content);
              }}
            >
              {REACTION_EMOJI[content]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** GitHub's Octicon "smiley" (MIT). */
function SmileyIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm3.82 1.636a.75.75 0 0 1 1.038.175l.007.009c.103.118.22.222.35.31.264.178.683.37 1.285.37.602 0 1.02-.192 1.285-.371.13-.088.247-.192.35-.31l.007-.008a.75.75 0 0 1 1.222.87l-.022-.015c.02.013.021.015.021.015v.001l-.001.002-.002.003-.005.007-.014.019a2.066 2.066 0 0 1-.184.213c-.16.166-.338.316-.53.445-.63.418-1.37.638-2.127.629-.946 0-1.652-.308-2.126-.63a3.331 3.331 0 0 1-.715-.657l-.014-.02-.005-.006-.002-.003v-.002h-.001l.613-.432-.614.43a.75.75 0 0 1 .183-1.044ZM12 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM5 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
    </svg>
  );
}
