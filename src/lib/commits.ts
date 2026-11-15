/**
 * The "commits" view of the snacks collection, used by every Snacks page at build time. A snack is a
 * content file (src/content/snacks); a Commit is that snack plus everything the git-history look needs:
 * a number, a short sha, a branch name, and the verdict today after any later updates.
 *
 * Verdicts map to git: keep = merged into the `toolbox` branch, maybe = still open on its branch,
 * drop = reverted.
 */
import { getSnacks, type Snack } from "./content";

export type Verdict = Snack["data"]["verdict"];
/** Every verdict, in the order the filters and counts show them. */
export const VERDICTS = ["keep", "maybe", "drop"] as const satisfies readonly Verdict[];

/**
 * Where the section lives. The look is a commit history, but the name must not suggest these are
 * real GitHub commits. To rename the section, change this, the folder in src/pages, and the
 * "commits.title" strings in src/i18n/ui.ts.
 */
export const SECTION_PATH = "/snacks";

/** Two entries side by side. "compare" can therefore not be the slug of an entry. */
export const COMPARE_PATH = `${SECTION_PATH}/compare`;

/** The page that lists everything currently merged. */
export const TOOLBOX_PATH = "/toolbox";

/** The branch every kept tool is merged into. */
export const BASE_BRANCH = "toolbox";

/** One snack, as a commit in the history. */
export interface Commit {
  snack: Snack;
  /** URL slug: the file name without its date, "2026-10-28-ghostty" -> "ghostty". */
  slug: string;
  /** 1 for the oldest entry, like a pull request number. */
  number: number;
  /** Seven hex digits derived from the file name. Decorative, but stable. */
  sha: string;
  /** The branch the tool was tried on: "try/ghostty". */
  branch: string;
  /** Host of the tool's own site, without "www.". */
  host: string | undefined;
  /** The verdict today: the one from the latest update, or the first call when there is none. */
  verdict: Verdict;
  /** The verdict on the day of writing. */
  firstVerdict: Verdict;
  /** Changes of mind after the first call, oldest first. */
  updates: Update[];
  /** The day of the latest verdict. */
  decided: Date;
}

/** A later change of verdict on an entry (an `updates` item in its frontmatter), with derived fields. */
export interface Update {
  date: Date;
  /** The verdict before this update. */
  from: Verdict;
  verdict: Verdict;
  note: string;
  /** Whole days since the entry was written. */
  days: number;
  /** Anchor on the entry page: "update-1". */
  anchor: string;
}

/** One row of the history: an entry, or a later change of verdict on one. */
export interface HistoryEvent {
  commit: Commit;
  date: Date;
  update?: Update;
}

const MS_PER_DAY = 86_400_000;

/** "2026-10-28-ghostty" -> "ghostty". */
const slugOf = (id: string) => id.replace(/^\d{4}-\d{2}-\d{2}-/, "");

/** FNV-1a, run twice with different seeds so there are seven nicely mixed hex digits to show. */
function shortSha(text: string): string {
  const hash = (seed: number) => {
    let h = seed;
    for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
    return (h >>> 0).toString(16).padStart(8, "0");
  };
  return (hash(2166136261) + hash(40503)).slice(3, 10);
}

/** The snack's `updates`, oldest first, each with the verdict it replaced and its distance from the entry. */
function toUpdates(snack: Snack): Update[] {
  const sorted = [...snack.data.updates].sort((a, b) => a.date.getTime() - b.date.getTime());
  return sorted.map((update, i): Update => {
    if (update.date < snack.data.date) throw new Error(`${snack.id}: an update is dated before the entry itself.`);
    return {
      ...update,
      from: sorted[i - 1]?.verdict ?? snack.data.verdict,
      days: Math.round((update.date.getTime() - snack.data.date.getTime()) / MS_PER_DAY),
      anchor: `update-${i + 1}`,
    };
  });
}

/** One snack as a commit. `number` counts from 1 for the oldest entry. */
function toCommit(snack: Snack, number: number): Commit {
  const slug = slugOf(snack.id);
  const updates = toUpdates(snack);
  const last = updates.at(-1);
  return {
    verdict: last?.verdict ?? snack.data.verdict,
    firstVerdict: snack.data.verdict,
    updates,
    decided: last?.date ?? snack.data.date,
    snack,
    slug,
    number,
    sha: shortSha(snack.id),
    branch: `try/${slug}`,
    host: snack.data.url ? new URL(snack.data.url).hostname.replace(/^www\./, "") : undefined,
  };
}

/** Fails the build when two entries would share a URL, or one would take the compare page's. */
function assertUniqueSlugs(commits: Commit[]): void {
  const seen = new Set<string>();
  for (const { slug, snack } of commits) {
    if (slug === "compare") throw new Error(`${snack.id}: "compare" is taken by the compare page. Rename the file.`);
    if (seen.has(slug)) throw new Error(`Two snacks share the URL ${SECTION_PATH}/${slug}. Rename ${snack.id}.`);
    seen.add(slug);
  }
}

/** All commits, newest first. Drafts are left out of production builds (see getSnacks). */
export async function getCommits(): Promise<Commit[]> {
  const snacks = await getSnacks();
  const commits = snacks.map((snack, index) => toCommit(snack, snacks.length - index));
  assertUniqueSlugs(commits);
  return commits;
}

/** Every row of the history, newest first: the entries plus one row per later change of verdict. */
export function historyEvents(commits: Commit[]): HistoryEvent[] {
  const events = commits.flatMap((commit): HistoryEvent[] => [
    { commit, date: commit.snack.data.date },
    ...commit.updates.map((update) => ({ commit, date: update.date, update })),
  ]);
  return events.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Path of one entry, before the locale prefix: "/snacks/ghostty". */
export const commitPath = (slug: string) => `${SECTION_PATH}/${slug}`;

/** How many commits have each verdict today, for the filter. */
export function countByVerdict(commits: Commit[]): Record<Verdict, number> {
  const counts: Record<Verdict, number> = { keep: 0, maybe: 0, drop: 0 };
  for (const { verdict } of commits) counts[verdict] += 1;
  return counts;
}

/**
 * Fills `{name}` placeholders in a translated sentence with small pieces of HTML (a name, a branch),
 * so word order can differ per language. Values must be trusted, build-time strings.
 */
export function fillHtml(template: string, parts: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => parts[name] ?? match);
}

/** A branch or sha drawn as a git ref chip, for fillHtml. `text` must be a trusted build-time string. */
export const refHtml = (text: string) => `<code class="ref">${text}</code>`;

/** "16 days later", in the locale of `t`. */
export function laterLabel(
  days: number,
  t: (key: "commits.later.same" | "commits.later.one" | "commits.later.many", values?: { n: number }) => string,
): string {
  if (days <= 0) return t("commits.later.same");
  return days === 1 ? t("commits.later.one") : t("commits.later.many", { n: days });
}
