/**
 * Shared lookups for the Snacks page scripts in this folder. They are functions, not constants, because the
 * client router swaps the page's content on every navigation, so an element found earlier may be gone.
 */

export const root = document.documentElement;

/** Live: `.matches` follows the reader's setting even if it changes while the page is open. */
export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

/** Where a link from an entry page can go: the older or newer entry, or up to the list. */
export type NavTarget = "older" | "newer" | "up";

/** The entry's <article> on /snacks/<slug> (null on the list page). */
export const currentEntry = () => document.querySelector<HTMLElement>("[data-cm-entry]");

/** The sliding row of the graph strip at the top of an entry (GraphStrip.astro). */
export const stripTrack = () => document.querySelector<HTMLElement>(".cm-strip-track");

/** The page's link to `target` (the ← / → and "All snacks" links on an entry). */
export const navLink = (target: NavTarget) => document.querySelector<HTMLAnchorElement>(`[data-cm-nav="${target}"]`);

/** Whether two paths are the same page, ignoring a trailing slash. */
export const samePage = (a: string, b: string) => a.replace(/\/$/, "") === b.replace(/\/$/, "");

/** The strip moves less than the finger, so a full-width swipe is about one slot. */
export const STRIP_RATIO = 0.56;
