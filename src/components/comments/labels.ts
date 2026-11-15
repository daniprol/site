/**
 * The interface text the comments island needs, picked from src/i18n/ui.ts on the server and passed in as a
 * prop, so the island does not ship every translation. `{name}` placeholders are filled with `fill`.
 */
export const LABEL_KEYS = [
  "countOne",
  "countMany",
  "loading",
  "error",
  "retry",
  "empty",
  "viewOnGitHub",
  "moreOnGitHub",
  "commented",
  "edited",
  "owner",
  "deleted",
  "hidden",
  "react",
  "reply",
  "cancel",
  "placeholder",
  "replyPlaceholder",
  "submit",
  "submitting",
  "markdown",
  "signIn",
  "signInPrompt",
  "signedInAs",
  "signOut",
] as const;

export type Labels = Record<(typeof LABEL_KEYS)[number], string>;

export const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
