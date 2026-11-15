/**
 * The activity grid on /snacks (ActivityGrid.astro): a day with an entry is a link to its row (#s-<slug>).
 * Instead of jumping, clicking brings the row to the middle of the screen and highlights it, and hovering a
 * day and its row lights up the other.
 */
import { reducedMotion } from "./dom";

/** The history row a grid cell points at. */
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
function highlightPair(event: Event, on: boolean) {
  if (!(event.target instanceof Element)) return;
  const cell = event.target.closest<HTMLAnchorElement>("a[data-cm-jump]");
  const row = cell ? rowFor(cell) : event.target.closest<HTMLElement>(".cm-row[id]");
  if (!row) return;
  row.classList.toggle("is-linked", on && Boolean(cell));
  const day = cell ?? document.querySelector(`a[data-cm-jump][href="#${CSS.escape(row.id)}"]`);
  day?.classList.toggle("is-linked", on && !cell);
}
document.addEventListener("pointerover", (event) => highlightPair(event, true));
document.addEventListener("pointerout", (event) => highlightPair(event, false));
