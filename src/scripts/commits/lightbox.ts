/**
 * The picture viewer on an entry page. Clicking the cover, a picture in the text or a gallery thumbnail
 * opens it in a <dialog> (Lightbox.astro) with the entry's other pictures a step away: arrows or ← → to
 * move, Esc, a click or a swipe down to close. Without JavaScript the pictures are plain links to the files.
 */
import { currentEntry, reducedMotion, root } from "./dom";

/** One picture the viewer can show. */
interface Shot {
  /** What was clicked: the zoom link around a picture, or a bare <img> in the text. */
  el: HTMLElement;
  img: HTMLImageElement;
  src: string;
  alt: string;
  caption: string;
}
/** The pictures of the open entry, collected when the viewer opens. */
let shots: Shot[] = [];
/** Which of them is on screen. */
let shotIndex = 0;

/** The viewer's <dialog> (Lightbox.astro). */
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

/** Puts picture `index` in the viewer, with its caption and "2 / 5" count. */
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
  // A view transition animates between two states of the page. Giving the thumbnail (before) and the large
  // picture (after) the same view-transition-name makes the browser morph one into the other.
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

/** Opens the viewer on picture `index`. */
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

/** Closes the viewer, shrinking the picture back into its thumbnail. */
function closeShot() {
  const dialog = lightbox();
  if (dialog?.open) zoom(shots[shotIndex]?.img, () => dialog.close(), false);
}

/** Shows the next (`by` = 1) or previous (-1) picture, wrapping around. */
const step = (by: number) => show((shotIndex + by + shots.length) % shots.length);

// "cm-js" on <html> tells CSS the viewer works, so pictures in the text get a zoom-in cursor. The swap resets
// <html>'s classes, so it is added again after every navigation.
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
    const article = currentEntry();
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

/* In the viewer: swipe sideways for the next picture, swipe down to close. */

/** Sideways travel that moves to the next or previous picture. */
const VIEWER_STEP_PX = 48;
/** Downward travel that closes the viewer. */
const VIEWER_CLOSE_PX = 64;

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
  if (Math.abs(dx) > VIEWER_STEP_PX && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  else if (dy > VIEWER_CLOSE_PX) closeShot();
});
