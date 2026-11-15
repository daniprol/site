/**
 * Moving between Snacks pages with Astro's client router (<ClientRouter /> in BaseLayout): instead of a full
 * page load, Astro fetches the next page, swaps it in, and fires events along the way
 * (astro:before-preparation, astro:before-swap, astro:after-swap) that this file listens to.
 *
 * - Tells CSS which way a navigation goes (data-cm-dir on <html>), so the page slides the right way
 *   (see the view-transition rules at the end of styles/commits.css).
 * - Slides the graph strip from the old entry to the new one, so the graph reads as one long line.
 * - Carries a swipe on into the slide, so the page leaves from under the finger (see swipe.ts).
 */
import { navLink, reducedMotion, root, samePage, STRIP_RATIO, stripTrack, currentEntry } from "./dom";

/** older/newer: between neighbouring entries. open: from a list into an entry. close: back to the list. */
type Direction = "older" | "newer" | "open" | "close";

/** How far the strip had been dragged when a swipe turned into a navigation. */
let carriedStripOffset = 0;
/** Slots the strip has to travel on the pending navigation: -1 older, +1 newer. */
let pendingSlots = 0;
let pendingDirection: Direction | undefined;
/** Where a swipe left the page, in px, so the outgoing page carries on from under the finger. */
let pendingDrag = 0;

/** Called by swipe.ts just before it navigates, with how far the finger had dragged the page. */
export function carrySwipeIntoNavigation(dragX: number) {
  carriedStripOffset = reducedMotion.matches ? 0 : dragX * STRIP_RATIO;
  pendingDrag = reducedMotion.matches ? 0 : dragX;
}

function setDirection(direction: Direction | undefined) {
  if (direction) root.dataset.cmDir = direction;
  else delete root.dataset.cmDir;
  if (direction && pendingDrag) root.style.setProperty("--cm-drag", `${pendingDrag}px`);
  else root.style.removeProperty("--cm-drag");
}

/** Which way is this navigation going? Read from the strip of the page we are leaving. */
function directionOf(from: URL, to: URL): { direction: Direction; slots: number } | undefined {
  const leavingEntry = currentEntry();
  if (leavingEntry) {
    // Each neighbour in the strip knows how many slots away it is (data-offset, set by GraphStrip.astro).
    const slot = [...document.querySelectorAll<HTMLAnchorElement>("a.cm-slot")].find((a) =>
      samePage(new URL(a.href).pathname, to.pathname),
    );
    if (slot) {
      const slots = Number(slot.dataset.offset);
      return { direction: slots < 0 ? "older" : "newer", slots };
    }
    const up = navLink("up");
    if (up && samePage(new URL(up.href).pathname, to.pathname)) return { direction: "close", slots: 0 };
    return undefined;
  }
  // Arriving from a list: any row or grid cell that points at the target.
  const opensEntry = [...document.querySelectorAll<HTMLAnchorElement>("a.cm-link, a.cm-cell")].some((a) =>
    samePage(new URL(a.href).pathname, to.pathname),
  );
  return opensEntry && !samePage(from.pathname, to.pathname) ? { direction: "open", slots: 0 } : undefined;
}

// Before the next page is fetched: work out the direction while the old page is still there to read.
document.addEventListener("astro:before-preparation", (event) => {
  const found = directionOf(event.from, event.to);
  pendingSlots = found?.slots ?? 0;
  pendingDirection = found?.direction;
  setDirection(pendingDirection);
});

document.addEventListener("astro:before-swap", (event) => {
  // Keep the direction on <html> until the transition is over, then forget it.
  const clear = () => {
    pendingDirection = undefined;
    pendingDrag = 0;
    setDirection(undefined);
  };
  event.viewTransition.finished.then(clear, clear);
});

document.addEventListener("astro:after-swap", () => {
  // The swap replaces <html>'s attributes with the new page's, so put the direction back.
  setDirection(pendingDirection);
  const strip = stripTrack();
  const slots = pendingSlots;
  const carried = carriedStripOffset;
  pendingSlots = 0;
  carriedStripOffset = 0;
  if (!strip || !slots || reducedMotion.matches) return;
  // Start the new strip where the old one stood, then let it glide to its own centre.
  const slotWidth = strip.querySelector<HTMLElement>(".cm-slot")?.offsetWidth ?? 160;
  strip.style.transition = "none";
  strip.style.translate = `${slots * slotWidth + carried}px 0`;
  void strip.offsetWidth; // Reading a size forces the browser to apply the start position before the glide.
  strip.style.transition = "";
  strip.style.translate = "";
});
