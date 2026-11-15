/** What every part of the comments island needs, without passing it down by hand. */
import { createContext, useContext } from "react";

import type { Viewer } from "./api";
import type { Labels } from "./labels";

export interface CommentsContextValue {
  labels: Labels;
  /** BCP 47 tag for dates, e.g. "en-GB". */
  localeTag: string;
  /** The signed-in visitor, or null. */
  viewer: Viewer | null;
  /** Posts a comment, or a reply to the top-level comment `replyTo`, and adds it to the thread. */
  submit: (body: string, replyTo?: string) => Promise<void>;
}

export const CommentsContext = createContext<CommentsContextValue | null>(null);

export function useComments(): CommentsContextValue {
  const value = useContext(CommentsContext);
  if (!value) throw new Error("useComments must be used inside <CommentsContext>");
  return value;
}
