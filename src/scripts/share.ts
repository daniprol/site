/**
 * Behaviour for ShareButton.astro: copying the link, the Link / Markdown / Diff tabs on snacks, the phone's
 * own share sheet, and closing the panel on Esc or a click elsewhere. Everything is delegated from the
 * document, so it keeps working across client-side navigations without being set up again.
 */
import { shareHref } from "@/lib/share";

/** The share widget (<details data-share>) that contains `target`, if any. */
const widgetOf = (target: EventTarget | null) =>
  target instanceof Element ? target.closest<HTMLDetailsElement>("[data-share]") : null;

/** The address the reader is on, without query or hash: right on previews and any domain. */
const pageUrl = () => location.origin + location.pathname;

/** What the Copy button copies: the link, a Markdown link, or the link to the diff, per the pressed tab. */
function textToCopy(widget: HTMLElement): string {
  const pressed = widget.querySelector<HTMLElement>("[data-share-format][aria-pressed='true']");
  const url = pageUrl();
  switch (pressed?.dataset.shareFormat) {
    case "markdown":
      return `[${widget.dataset.title ?? document.title}](${url})`;
    case "diff":
      return `${url}#${pressed.dataset.hash ?? ""}`;
    default:
      return url;
  }
}

/** Fills in the real address and reveals what only works with JavaScript. */
function prepare(widget: HTMLDetailsElement) {
  const url = pageUrl();
  const title = widget.dataset.title ?? document.title;
  const field = widget.querySelector<HTMLInputElement>("[data-share-url]");
  if (field) field.value = textToCopy(widget);
  for (const link of widget.querySelectorAll<HTMLAnchorElement>("[data-share-target]")) {
    link.href = shareHref(link.dataset.shareTarget ?? "", url, title);
  }
  widget.querySelector("[data-share-copy]")?.removeAttribute("hidden");
  widget.querySelector("[data-share-tabs]")?.removeAttribute("hidden");
  if (typeof navigator.share === "function") widget.querySelector("[data-share-native]")?.removeAttribute("hidden");
}

/** Closes every open share panel except `except`. */
const closeAll = (except?: Element | null) => {
  for (const open of document.querySelectorAll<HTMLDetailsElement>("[data-share][open]")) {
    if (open !== except) open.open = false;
  }
};

// "toggle" does not bubble, so listen in the capture phase.
document.addEventListener(
  "toggle",
  (event) => {
    const widget = widgetOf(event.target);
    if (widget?.open) prepare(widget);
  },
  true,
);

/** How long the button says "Copied" before going back to "Copy". */
const COPIED_LABEL_MS = 1600;

/** Copies the field's text and briefly shows "Copied" on the button. */
async function copy(widget: HTMLElement, button: HTMLElement) {
  const field = widget.querySelector<HTMLInputElement>("[data-share-url]");
  if (!field) return;
  try {
    await navigator.clipboard.writeText(field.value);
  } catch {
    // No clipboard access (old browser, blocked permission): leave the text selected to copy by hand.
    field.focus();
    field.select();
    return;
  }
  const label = button.querySelector<HTMLElement>("[data-share-copy-text]");
  if (!label || button.dataset.busy) return;
  const before = label.textContent;
  button.dataset.busy = "true";
  label.textContent = button.dataset.copied ?? before;
  setTimeout(() => {
    label.textContent = before;
    delete button.dataset.busy;
  }, COPIED_LABEL_MS);
}

document.addEventListener("click", (event) => {
  const widget = widgetOf(event.target);
  closeAll(widget);
  if (!widget || !(event.target instanceof Element)) return;

  const copyButton = event.target.closest<HTMLElement>("[data-share-copy]");
  if (copyButton) return void copy(widget, copyButton);

  const format = event.target.closest<HTMLElement>("[data-share-format]");
  if (format) {
    for (const tab of widget.querySelectorAll("[data-share-format]")) {
      tab.setAttribute("aria-pressed", String(tab === format));
    }
    const field = widget.querySelector<HTMLInputElement>("[data-share-url]");
    if (field) field.value = textToCopy(widget);
    return;
  }

  if (event.target.closest("[data-share-native]")) {
    // The reader closing the sheet rejects the promise; that is not an error.
    navigator.share({ title: widget.dataset.title ?? document.title, url: pageUrl() }).catch(() => undefined);
    return;
  }
  if (event.target.closest("[data-share-url]")) (event.target as HTMLInputElement).select();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const open = document.querySelector<HTMLDetailsElement>("[data-share][open]");
  if (!open) return;
  // Keep Esc from also leaving the entry (the snack page uses it to go back to the list).
  event.stopImmediatePropagation();
  open.open = false;
  open.querySelector("summary")?.focus();
});
