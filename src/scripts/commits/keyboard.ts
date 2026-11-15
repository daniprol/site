/**
 * Keyboard shortcuts on an entry page: ← or j for the older entry, → or k for the newer one, Esc back to the
 * list. The page shows them as <kbd> hints next to the links.
 */
import { navigate } from "astro:transitions/client";

import { currentEntry, navLink, type NavTarget } from "./dom";

const KEYS: Record<string, NavTarget> = {
  j: "older",
  ArrowLeft: "older",
  k: "newer",
  ArrowRight: "newer",
  Escape: "up",
};

/** The Navigation API (not in every browser yet, nor in TypeScript's DOM types): only what is used here. */
interface NavigationLike {
  entries(): { url: string | null }[];
  currentEntry: { index: number } | null;
}

/** Follows the page's link to `target`. Returns false when there is none (e.g. no older entry). */
function go(target: NavTarget) {
  const link = navLink(target);
  if (!link) return false;
  // Esc right after opening an entry from the list goes back, so the list keeps its scroll position.
  const nav = "navigation" in window ? (window.navigation as NavigationLike) : undefined;
  const previous = nav?.entries()[(nav.currentEntry?.index ?? 0) - 1];
  if (target === "up" && previous?.url === link.href) history.back();
  else navigate(link.href);
  return true;
}

document.addEventListener("keydown", (event) => {
  const target = KEYS[event.key];
  if (!target || !currentEntry()) return;
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.defaultPrevented) return;
  // Leave keys alone while a dialog is open or the reader is typing.
  if (document.querySelector("dialog[open]")) return;
  const active = document.activeElement;
  if (active instanceof HTMLElement && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)))
    return;
  if (go(target)) event.preventDefault();
});
