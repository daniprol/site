/**
 * "You are 3 commits behind": remembers the newest row of the history a reader has seen (in their
 * own browser, nothing is sent anywhere) and, on the next visit, marks what was added since.
 * In git terms the reader is a ref that lags behind HEAD, and "git pull" fast-forwards it.
 *
 * Rows are numbered from the oldest (data-seq). To see it without waiting for a new entry, open
 * the history with ?behind=3.
 */
const SEEN = "snacks:seen"; // localStorage: { seq, at } of the newest row seen on the last visit
const BASE = "snacks:base"; // sessionStorage: where the reader stood when this tab's session began

interface Seen {
  seq: number;
  at?: number;
}

function read(storage: () => Storage, key: string): Seen | undefined {
  try {
    const value: unknown = JSON.parse(storage().getItem(key) ?? "null");
    if (value && typeof value === "object" && "seq" in value && typeof value.seq === "number") return value as Seen;
  } catch {
    // Private mode or blocked storage: the page simply shows no marks.
  }
  return undefined;
}

function write(storage: () => Storage, key: string, value: Seen) {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {
    // See read().
  }
}

function clear(history: HTMLElement) {
  history.querySelector("[data-cm-behind]")?.setAttribute("hidden", "");
  history.querySelector(".cm-you")?.remove();
  for (const row of history.querySelectorAll(".cm-row.is-new")) row.classList.remove("is-new");
  for (const tag of history.querySelectorAll(".cm-new")) tag.remove();
}

function mark(history: HTMLElement, base: Seen, total: number) {
  const behind = total - base.seq;
  const badge = history.querySelector<HTMLElement>("[data-cm-behind]");
  const text = history.querySelector<HTMLElement>("[data-cm-behind-text]");
  if (!badge || !text || behind <= 0) return;

  const { behindOne = "", behindMany = "", you = "", lastVisit = "", new: newLabel = "" } = history.dataset;
  text.textContent = behind === 1 ? behindOne : behindMany.replace("{n}", String(behind));
  badge.removeAttribute("hidden");

  let lastSeen: HTMLElement | undefined;
  for (const row of history.querySelectorAll<HTMLElement>(".cm-row[data-seq]")) {
    const seq = Number(row.dataset.seq);
    if (seq > base.seq) {
      row.classList.add("is-new");
      const tag = document.createElement("span");
      tag.className = "cm-new";
      tag.textContent = newLabel;
      row.querySelector(".cm-meta")?.prepend(tag);
    } else if (!lastSeen) {
      lastSeen = row;
    }
  }
  if (!lastSeen) return;

  // The reader's own ref, on the trunk just above the last row they saw.
  const marker = document.createElement("li");
  marker.className = "cm-you";
  const chip = document.createElement("span");
  chip.className = "cm-chip";
  chip.textContent = you;
  marker.append(chip);
  if (base.at) {
    const { lang } = document.documentElement;
    const when = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : lang, { day: "numeric", month: "short" });
    const note = document.createElement("span");
    note.textContent = lastVisit.replace("{date}", when.format(base.at));
    marker.append(note);
  }
  lastSeen.before(marker);
}

function init() {
  const history = document.querySelector<HTMLElement>("[data-cm-history]");
  if (!history) return;
  clear(history);
  const total = Number(history.dataset.total);
  const preview = Number(new URLSearchParams(location.search).get("behind"));

  let base: Seen | undefined;
  if (preview > 0) {
    base = { seq: Math.max(1, total - preview) };
  } else {
    base = read(() => sessionStorage, BASE);
    if (!base) {
      // First page of this session: stand where the last visit ended, or at HEAD on a first visit.
      base = read(() => localStorage, SEEN) ?? { seq: total };
      write(() => sessionStorage, BASE, base);
    }
    write(() => localStorage, SEEN, { seq: total, at: Date.now() });
  }
  mark(history, base, total);

  history.querySelector("[data-cm-pull]")?.addEventListener(
    "click",
    () => {
      write(() => sessionStorage, BASE, { seq: total });
      const done = () => clear(history);
      if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        document.startViewTransition(done);
      } else {
        done();
      }
    },
    { once: true },
  );
}

document.addEventListener("astro:page-load", init);
