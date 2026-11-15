/**
 * Touch swipes on an entry page: drag sideways to pull in the older (drag right) or newer (drag left) entry.
 * The page and the graph strip follow the finger; let go past SWIPE_COMMIT_PX and the next entry opens,
 * otherwise everything settles back. Mouse and pen are left alone.
 */
import { navigate } from "astro:transitions/client";

import { currentEntry, navLink, reducedMotion, STRIP_RATIO, stripTrack, type NavTarget } from "./dom";
import { carrySwipeIntoNavigation } from "./page-transitions";

/** Leave the screen edges to the browser's own back gesture. */
const EDGE_PX = 24;
/** Sideways travel before a touch counts as a swipe rather than a tap or a scroll. */
const SWIPE_START_PX = 12;
/** Travel that turns a swipe into a navigation when the finger lifts. */
const SWIPE_COMMIT_PX = 72;
/** With no entry on that side, the page moves this fraction of the finger's travel, so it feels stuck. */
const RESISTANCE = 0.22;

/** The swipe in progress, if any. */
interface Swipe {
  pointer: number;
  /** Where the finger went down. */
  x: number;
  y: number;
  /** How far the page has been dragged sideways. */
  dx: number;
  /** False until the movement is clearly sideways. */
  active: boolean;
  panel: HTMLElement | null;
  strip: HTMLElement | null;
}
let swipe: Swipe | undefined;

/** Code blocks, tables and formulas scroll sideways on their own; a swipe there is theirs. */
function scrollsSideways(start: Element, stop: Element) {
  for (let el: Element | null = start; el && el !== stop; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth + 1 && /auto|scroll/.test(getComputedStyle(el).overflowX)) return true;
  }
  return false;
}

/** Puts the page and strip back in place; `settle` animates it, otherwise it snaps. */
function release(current: Swipe, settle: boolean) {
  for (const el of [current.panel, current.strip]) {
    if (!el) continue;
    el.style.transition = settle ? "translate 320ms var(--ease-out-soft), opacity 320ms" : "";
    el.style.translate = "";
    el.style.opacity = "";
    if (settle) el.addEventListener("transitionend", () => (el.style.transition = ""), { once: true });
  }
}

document.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch" || !event.isPrimary) return;
  const article = currentEntry();
  const target = event.target;
  if (!article || !(target instanceof Element) || !article.contains(target)) return;
  if (event.clientX < EDGE_PX || event.clientX > innerWidth - EDGE_PX) return;
  if (scrollsSideways(target, article)) return;
  swipe = {
    pointer: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    dx: 0,
    active: false,
    panel: article.querySelector<HTMLElement>(".pr-panel"),
    strip: stripTrack(),
  };
});

document.addEventListener("pointermove", (event) => {
  if (!swipe || event.pointerId !== swipe.pointer) return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  if (!swipe.active) {
    // Mostly vertical: the reader is scrolling, so let go. Clearly sideways: it is a swipe.
    if (Math.abs(dy) > SWIPE_START_PX && Math.abs(dy) >= Math.abs(dx)) swipe = undefined;
    else if (Math.abs(dx) > SWIPE_START_PX && Math.abs(dx) > Math.abs(dy) * 1.4) swipe.active = true;
    if (!swipe?.active) return;
  }
  // Dragging right pulls the older entry in from the left. With nothing there, the page resists.
  const available = navLink(dx > 0 ? "older" : "newer");
  swipe.dx = available ? dx : dx * RESISTANCE;
  if (reducedMotion.matches) return;
  if (swipe.panel) {
    swipe.panel.style.transition = "none";
    swipe.panel.style.translate = `${swipe.dx}px 0`;
    swipe.panel.style.opacity = String(Math.max(0.35, 1 - Math.abs(swipe.dx) / 420));
  }
  if (swipe.strip) {
    swipe.strip.style.transition = "none";
    swipe.strip.style.translate = `${swipe.dx * STRIP_RATIO}px 0`;
  }
});

function endSwipe(event: PointerEvent, cancelled: boolean) {
  if (!swipe || event.pointerId !== swipe.pointer) return;
  const current = swipe;
  swipe = undefined;
  if (!current.active) return;
  const target: NavTarget = current.dx > 0 ? "older" : "newer";
  const link = navLink(target);
  if (cancelled || Math.abs(current.dx) < SWIPE_COMMIT_PX || !link) {
    release(current, true);
    return;
  }
  carrySwipeIntoNavigation(current.dx);
  navigate(link.href);
}
document.addEventListener("pointerup", (event) => endSwipe(event, false));
document.addEventListener("pointercancel", (event) => endSwipe(event, true));
