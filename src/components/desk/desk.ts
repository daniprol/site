/**
 * Desk behaviour (desktop only, mouse/pen): drag the mat to pan, drag objects to move
 * them, a minimap, and a "Tidy up" toggle. Panning itself is native scrolling, so this
 * file only adds to what already works without it. Positions persist per browser.
 */
const KEY = "desk:v1";
const DRAG_THRESHOLD = 4;

interface Saved {
  tidy?: boolean;
  moved?: Record<string, [number, number]>;
}

function load(): Saved {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Saved;
  } catch {
    return {};
  }
}

function save(state: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: the desk just forgets.
  }
}

export function initDesk(root: HTMLElement) {
  if (root.dataset.ready) return;
  root.dataset.ready = "1";

  const stage = root.querySelector<HTMLElement>("[data-stage]");
  const board = root.querySelector<HTMLElement>("[data-board]");
  const map = root.querySelector<HTMLElement>("[data-minimap]");
  const view = root.querySelector<HTMLElement>("[data-view]");
  const tidyButton = root.querySelector<HTMLButtonElement>("[data-tidy]");
  const resetButton = root.querySelector<HTMLButtonElement>("[data-reset]");
  if (!stage || !board) return;

  const desktop = matchMedia("(min-width: 64rem)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const objects = [...board.querySelectorAll<HTMLElement>("[data-obj]")];
  const state = load();
  state.moved ??= {};
  let z = 10;

  const isDesk = () => desktop.matches && !board.classList.contains("is-tidy");

  const setOffset = (el: HTMLElement, [dx, dy]: [number, number]) => {
    el.style.setProperty("--dx", `${dx}px`);
    el.style.setProperty("--dy", `${dy}px`);
  };
  objects.forEach((el) => {
    const offset = state.moved?.[el.dataset.obj ?? ""];
    if (offset) setOffset(el, offset);
  });

  const centre = (behavior: ScrollBehavior = "auto") =>
    stage.scrollTo({
      left: Number(board.dataset.cx) - stage.clientWidth / 2,
      top: Number(board.dataset.cy) - stage.clientHeight / 2,
      behavior,
    });

  // ---- Minimap ----
  const pieces = new Map<HTMLElement, HTMLElement>();
  const scale = () => (map ? map.clientWidth / board.offsetWidth : 0);
  const drawMap = () => {
    if (!map || !isDesk()) return;
    const s = scale();
    for (const el of objects) {
      if (el.hasAttribute("data-desk-only")) continue;
      let piece = pieces.get(el);
      if (!piece) {
        piece = document.createElement("span");
        piece.className = "mm-obj";
        map.append(piece);
        pieces.set(el, piece);
      }
      const dx = parseFloat(el.style.getPropertyValue("--dx")) || 0;
      const dy = parseFloat(el.style.getPropertyValue("--dy")) || 0;
      Object.assign(piece.style, {
        left: `${(el.offsetLeft + dx) * s}px`,
        top: `${(el.offsetTop + dy) * s}px`,
        width: `${el.offsetWidth * s}px`,
        height: `${el.offsetHeight * s}px`,
      });
    }
    drawView();
  };
  const drawView = () => {
    if (!view) return;
    const s = scale();
    Object.assign(view.style, {
      left: `${stage.scrollLeft * s}px`,
      top: `${stage.scrollTop * s}px`,
      width: `${stage.clientWidth * s}px`,
      height: `${stage.clientHeight * s}px`,
    });
  };
  let frame = 0;
  stage.addEventListener(
    "scroll",
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(drawView);
    },
    { passive: true },
  );
  map?.addEventListener("click", (e) => {
    const rect = map.getBoundingClientRect();
    const s = scale();
    stage.scrollTo({
      left: (e.clientX - rect.left) / s - stage.clientWidth / 2,
      top: (e.clientY - rect.top) / s - stage.clientHeight / 2,
      behavior: reduce.matches ? "auto" : "smooth",
    });
  });
  map?.style.setProperty("--bw-ratio", `${board.offsetWidth} / ${board.offsetHeight}`);

  // ---- Dragging: the mat pans, objects move. ----
  let drag: {
    id: number;
    x: number;
    y: number;
    left: number;
    top: number;
    obj: HTMLElement | null;
    from: [number, number];
    moved: boolean;
  } | null = null;

  board.addEventListener("pointerdown", (e) => {
    if (!isDesk() || e.button !== 0 || e.pointerType === "touch") return;
    const obj = (e.target as Element).closest<HTMLElement>("[data-obj]");
    const offset = state.moved?.[obj?.dataset.obj ?? ""] ?? [0, 0];
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      left: stage.scrollLeft,
      top: stage.scrollTop,
      obj,
      from: offset,
      moved: false,
    };
  });

  board.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      // Capture only once it is a real drag, so plain clicks still reach links.
      board.setPointerCapture(e.pointerId);
      if (drag.obj) {
        drag.obj.classList.add("is-lifted");
        drag.obj.style.zIndex = String(++z);
      } else root.classList.add("is-panning");
    }
    if (drag.obj) setOffset(drag.obj, [drag.from[0] + dx, drag.from[1] + dy]);
    else stage.scrollTo(drag.left - dx, drag.top - dy);
  });

  const end = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { obj, moved, from, x, y } = drag;
    drag = null;
    root.classList.remove("is-panning");
    if (!moved) return;
    // A drag is not a click: swallow the click that follows it.
    board.addEventListener("click", (ev) => ev.preventDefault(), { capture: true, once: true });
    if (obj?.dataset.obj) {
      obj.classList.remove("is-lifted");
      state.moved = { ...state.moved, [obj.dataset.obj]: [from[0] + e.clientX - x, from[1] + e.clientY - y] };
      save(state);
      drawMap();
    }
  };
  board.addEventListener("pointerup", end);
  board.addEventListener("pointercancel", end);
  board.addEventListener("dragstart", (e) => e.preventDefault());

  // Keyboard: bring whatever gets focus to the middle of the view.
  board.addEventListener("focusin", (e) => {
    const target = e.target as Element;
    // Only for keyboard focus: a mouse press on a link must not yank the view.
    if (!isDesk() || !target.matches(":focus-visible")) return;
    const obj = target.closest<HTMLElement>("[data-obj]");
    obj?.scrollIntoView({ block: "center", inline: "center", behavior: reduce.matches ? "auto" : "smooth" });
  });

  // ---- Tidy up / spread out ----
  const syncTidy = () => {
    const tidy = board.classList.contains("is-tidy");
    root.classList.toggle("is-tidy", tidy);
    tidyButton?.setAttribute("aria-pressed", String(tidy));
  };
  syncTidy();

  tidyButton?.addEventListener("click", () => {
    const apply = () => {
      board.classList.toggle("is-tidy");
      syncTidy();
      state.tidy = board.classList.contains("is-tidy");
      save(state);
      if (state.tidy) stage.scrollTo(0, 0);
      else {
        centre();
        drawMap();
      }
    };
    if (document.startViewTransition && !reduce.matches) document.startViewTransition(apply);
    else apply();
  });

  resetButton?.addEventListener("click", () => {
    state.moved = {};
    save(state);
    objects.forEach((el) => {
      el.style.removeProperty("--dx");
      el.style.removeProperty("--dy");
    });
    centre(reduce.matches ? "auto" : "smooth");
    drawMap();
  });

  // Fonts change object heights; redraw the map once they are in, and on resize.
  const life = new AbortController();
  document.addEventListener("astro:before-swap", () => life.abort(), { once: true });
  void document.fonts?.ready.then(drawMap);
  addEventListener("resize", drawMap, { passive: true, signal: life.signal });
  drawMap();
}
