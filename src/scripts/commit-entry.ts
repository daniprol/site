/**
 * Motion and gestures for the Snacks section. Everything here is an enhancement: the pages are
 * plain links without it.
 *
 * - Tells CSS which way a navigation goes (data-cm-dir on <html>), so the page slides the right way.
 * - Slides the graph strip from the old entry to the new one, so the graph reads as one long line.
 * - Swipe left or right on an entry (touch) to open the newer or older one.
 * - Keys: ← / j older, → / k newer, Esc back to the list.
 *
 * Loaded once and kept across client-side navigations, so every listener sits on document.
 */
import { navigate } from "astro:transitions/client";

type Direction = "older" | "newer" | "open" | "close";
type Target = "older" | "newer" | "up";

interface NavigationLike {
  entries(): { url: string | null }[];
  currentEntry: { index: number } | null;
}

const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const samePage = (a: string, b: string) => a.replace(/\/$/, "") === b.replace(/\/$/, "");
const entry = () => document.querySelector<HTMLElement>("[data-cm-entry]");
const track = () => document.querySelector<HTMLElement>(".cm-strip-track");
const linkTo = (target: Target) => document.querySelector<HTMLAnchorElement>(`[data-cm-nav="${target}"]`);

/** How far the strip had been dragged when a swipe turned into a navigation. */
let carriedStripOffset = 0;
/** Slots the strip has to travel on the pending navigation: -1 older, +1 newer. */
let pendingSlots = 0;
let pendingDirection: Direction | undefined;
/** Where a swipe left the page, in px, so the outgoing page carries on from under the finger. */
let pendingDrag = 0;

function setDirection(direction: Direction | undefined) {
  if (direction) root.dataset.cmDir = direction;
  else delete root.dataset.cmDir;
  if (direction && pendingDrag) root.style.setProperty("--cm-drag", `${pendingDrag}px`);
  else root.style.removeProperty("--cm-drag");
}

/** Which way is this navigation going? Read from the strip of the page we are leaving. */
function directionOf(from: URL, to: URL): { direction: Direction; slots: number } | undefined {
  const leavingEntry = entry();
  if (leavingEntry) {
    const slot = [...document.querySelectorAll<HTMLAnchorElement>("a.cm-slot")].find((a) =>
      samePage(new URL(a.href).pathname, to.pathname),
    );
    if (slot) {
      const slots = Number(slot.dataset.offset);
      return { direction: slots < 0 ? "older" : "newer", slots };
    }
    const up = linkTo("up");
    if (up && samePage(new URL(up.href).pathname, to.pathname)) return { direction: "close", slots: 0 };
    return undefined;
  }
  // Arriving from a list: any row or grid cell that points at the target.
  const opensEntry = [...document.querySelectorAll<HTMLAnchorElement>("a.cm-link, a.cm-cell")].some((a) =>
    samePage(new URL(a.href).pathname, to.pathname),
  );
  return opensEntry && !samePage(from.pathname, to.pathname) ? { direction: "open", slots: 0 } : undefined;
}

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
  const strip = track();
  const slots = pendingSlots;
  const carried = carriedStripOffset;
  pendingSlots = 0;
  carriedStripOffset = 0;
  if (!strip || !slots || reducedMotion.matches) return;
  // Start the new strip where the old one stood, then let it glide to its own centre.
  const slotWidth = strip.querySelector<HTMLElement>(".cm-slot")?.offsetWidth ?? 160;
  strip.style.transition = "none";
  strip.style.translate = `${slots * slotWidth + carried}px 0`;
  void strip.offsetWidth;
  strip.style.transition = "";
  strip.style.translate = "";
});

/* ---------- Keys ---------- */

const KEYS: Record<string, Target> = {
  j: "older",
  ArrowLeft: "older",
  k: "newer",
  ArrowRight: "newer",
  Escape: "up",
};

function go(target: Target) {
  const link = linkTo(target);
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
  if (!target || !entry()) return;
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.defaultPrevented) return;
  if (document.querySelector("dialog[open]")) return;
  const active = document.activeElement;
  if (active instanceof HTMLElement && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)))
    return;
  if (go(target)) event.preventDefault();
});

/* ---------- Swipe ---------- */

const EDGE = 24; // leave the screen edges to the browser's own back gesture
const START = 12; // px of sideways travel before a swipe starts
const COMMIT = 72; // px of travel that turns a swipe into a navigation
/** The strip moves less than the finger, so a full-width swipe is about one slot. */
const STRIP_RATIO = 0.56;

interface Swipe {
  pointer: number;
  x: number;
  y: number;
  dx: number;
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
  const article = entry();
  const target = event.target;
  if (!article || !(target instanceof Element) || !article.contains(target)) return;
  if (event.clientX < EDGE || event.clientX > innerWidth - EDGE) return;
  if (scrollsSideways(target, article)) return;
  swipe = {
    pointer: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    dx: 0,
    active: false,
    panel: article.querySelector<HTMLElement>(".pr-panel"),
    strip: track(),
  };
});

document.addEventListener("pointermove", (event) => {
  if (!swipe || event.pointerId !== swipe.pointer) return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  if (!swipe.active) {
    if (Math.abs(dy) > START && Math.abs(dy) >= Math.abs(dx)) swipe = undefined;
    else if (Math.abs(dx) > START && Math.abs(dx) > Math.abs(dy) * 1.4) swipe.active = true;
    if (!swipe?.active) return;
  }
  // Dragging right pulls the older entry in from the left. With nothing there, the page resists.
  const available = linkTo(dx > 0 ? "older" : "newer");
  swipe.dx = available ? dx : dx * 0.22;
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
  const target: Target = current.dx > 0 ? "older" : "newer";
  const link = linkTo(target);
  if (cancelled || Math.abs(current.dx) < COMMIT || !link) {
    release(current, true);
    return;
  }
  carriedStripOffset = reducedMotion.matches ? 0 : current.dx * STRIP_RATIO;
  pendingDrag = reducedMotion.matches ? 0 : current.dx;
  navigate(link.href);
}
document.addEventListener("pointerup", (event) => endSwipe(event, false));
document.addEventListener("pointercancel", (event) => endSwipe(event, true));

/* ---------- Activity grid: point at the row, do not leave the page ---------- */

const rowFor = (cell: Element) => {
  const id = cell.getAttribute("href")?.slice(1);
  return id ? document.getElementById(id) : null;
};

document.addEventListener("click", (event) => {
  const cell = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-cm-jump]") : null;
  const row = cell && rowFor(cell);
  if (!cell || !row) return;
  event.preventDefault();
  // A filtered-out row cannot be shown, so go back to "All" first.
  const all = document.querySelector<HTMLInputElement>('.cm-filter input[value="all"]');
  if (all) all.checked = true;
  document.querySelectorAll(".cm-row.is-target").forEach((el) => el.classList.remove("is-target"));
  row.classList.add("is-target");
  row.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
  history.replaceState(history.state, "", cell.hash);
  row.querySelector<HTMLElement>("a.cm-link")?.focus({ preventScroll: true });
});

/** Hovering a day lights up its row, and hovering a row lights up its day. */
function link(event: Event, on: boolean) {
  if (!(event.target instanceof Element)) return;
  const cell = event.target.closest<HTMLAnchorElement>("a[data-cm-jump]");
  const row = cell ? rowFor(cell) : event.target.closest<HTMLElement>(".cm-row[id]");
  if (!row) return;
  row.classList.toggle("is-linked", on && Boolean(cell));
  const day = cell ?? document.querySelector(`a[data-cm-jump][href="#${CSS.escape(row.id)}"]`);
  day?.classList.toggle("is-linked", on && !cell);
}
document.addEventListener("pointerover", (event) => link(event, true));
document.addEventListener("pointerout", (event) => link(event, false));

/* ---------- Pictures: click to see one large ---------- */

interface Shot {
  el: HTMLElement;
  img: HTMLImageElement;
  src: string;
  alt: string;
  caption: string;
}
let shots: Shot[] = [];
let shotIndex = 0;

const lightbox = () => document.querySelector<HTMLDialogElement>("[data-cm-lightbox]");

/** Every picture of the entry in reading order: cover, pictures in the text, gallery. */
function collectShots(article: HTMLElement): Shot[] {
  const found: Shot[] = [];
  for (const el of article.querySelectorAll<HTMLElement>("[data-cm-zoom], .pr-body .prose-site img")) {
    const img = el instanceof HTMLImageElement ? el : el.querySelector("img");
    if (!img || (el instanceof HTMLImageElement && el.closest("[data-cm-zoom]"))) continue;
    found.push({
      el,
      img,
      src: el instanceof HTMLAnchorElement ? el.href : img.currentSrc || img.src,
      alt: img.alt,
      caption: el.dataset.caption ?? "",
    });
  }
  return found;
}

function show(index: number) {
  const dialog = lightbox();
  const shot = shots[index];
  if (!dialog || !shot) return;
  shotIndex = index;
  const img = dialog.querySelector("img");
  if (img) {
    img.src = shot.src;
    img.alt = shot.alt;
  }
  const caption = dialog.querySelector("[data-caption]");
  if (caption) caption.textContent = shot.caption || shot.alt;
  const count = dialog.querySelector("[data-count]");
  if (count) count.textContent = shots.length > 1 ? `${index + 1} / ${shots.length}` : "";
  dialog.querySelectorAll<HTMLElement>("[data-step]").forEach((button) => (button.hidden = shots.length < 2));
}

/** Runs `change` as a view transition that grows the picture between thumbnail and viewer. */
function zoom(thumb: HTMLImageElement | undefined, change: () => void, opening: boolean) {
  const big = lightbox()?.querySelector("img");
  const canAnimate = "startViewTransition" in document && !reducedMotion.matches && thumb && big;
  if (!canAnimate) return change();
  const name = (el: HTMLElement, value: string) => (el.style.viewTransitionName = value);
  name(opening ? thumb : big, "cm-zoom");
  const transition = document.startViewTransition(() => {
    name(opening ? thumb : big, "");
    change();
    name(opening ? big : thumb, "cm-zoom");
  });
  const clear = () => [thumb, big].forEach((el) => name(el, ""));
  transition.finished.then(clear, clear);
}

function openShot(index: number) {
  const dialog = lightbox();
  if (!dialog || dialog.open) return;
  show(index);
  const big = dialog.querySelector("img");
  const start = () => zoom(shots[index]?.img, () => dialog.showModal(), true);
  // Wait for the large file, so the picture does not grow into an empty frame.
  if (big && !big.complete) big.decode().then(start, start);
  else start();
}

function closeShot() {
  const dialog = lightbox();
  if (dialog?.open) zoom(shots[shotIndex]?.img, () => dialog.close(), false);
}

const step = (by: number) => show((shotIndex + by + shots.length) % shots.length);

root.classList.add("cm-js");
document.addEventListener("astro:after-swap", () => root.classList.add("cm-js"));

document.addEventListener(
  "click",
  (event) => {
    if (!(event.target instanceof Element)) return;
    const dialog = lightbox();
    if (dialog?.open) {
      const stepBy = event.target.closest<HTMLElement>("[data-step]")?.dataset.step;
      if (stepBy) step(Number(stepBy));
      // Anything that is not a control closes: the picture, the caption, the backdrop.
      else closeShot();
      return;
    }
    const article = entry();
    if (!article || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const hit = event.target.closest<HTMLElement>("[data-cm-zoom], .pr-body .prose-site img");
    if (!hit || !article.contains(hit)) return;
    shots = collectShots(article);
    const index = shots.findIndex((shot) => shot.el === hit || shot.img === hit);
    if (index < 0) return;
    event.preventDefault();
    openShot(index);
    // Capture phase: this has to run before the client router follows the link to the image file.
  },
  true,
);

document.addEventListener("keydown", (event) => {
  const dialog = lightbox();
  if (!dialog?.open) return;
  if (event.key === "ArrowLeft") step(-1);
  else if (event.key === "ArrowRight") step(1);
  else if (event.key === "Escape") {
    // Take over from the dialog's own Esc, so closing gets the same animation.
    event.preventDefault();
    closeShot();
  }
});

/** In the viewer: swipe sideways for the next picture, swipe down to close. */
let viewerSwipe: { pointer: number; x: number; y: number } | undefined;
document.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch" && lightbox()?.open)
    viewerSwipe = { pointer: event.pointerId, x: event.clientX, y: event.clientY };
});
document.addEventListener("pointerup", (event) => {
  if (!viewerSwipe || event.pointerId !== viewerSwipe.pointer) return;
  const dx = event.clientX - viewerSwipe.x;
  const dy = event.clientY - viewerSwipe.y;
  viewerSwipe = undefined;
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  else if (dy > 64) closeShot();
});
