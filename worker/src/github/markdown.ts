/** Markdown previews, rendered by GitHub exactly as a posted comment will be. */
import type { Env } from "../env";
import { restText } from "./client";

export function renderMarkdown(env: Env, token: string, text: string): Promise<string> {
  return restText(token, "/markdown", {
    method: "POST",
    // "gfm" with the repository as context links #123 and @mentions the way the posted comment will.
    body: { text, mode: "gfm", context: env.GITHUB_REPOSITORY },
  });
}
