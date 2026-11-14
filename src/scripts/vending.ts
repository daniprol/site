/**
 * The show on /snacks. Products are plain links; this turns a click into: coil turns, the package
 * drops into the tray, the flap opens, then the snack page opens through the client router
 * (the package morphs into the reader's chip by sharing a view-transition name).
 *
 * - Reduced motion: nothing here runs, the link just opens.
 * - Interruptible: a second click on the same product opens it at once, a click on another
 *   product vends that one instead, Escape cancels.
 * - Listeners are delegated from document and bound once, so they survive client-side navigation.
 */
import { navigate } from "astro:transitions/client";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

/** Gravity in px/ms². A real drop of this height takes about as long; it reads as weight. */
const GRAVITY = 0.0075;
const PUSH_MS = 150;
const SETTLE_MS = 210;
const OPEN_MS = 110;
const STEP_MS = 1000 / 60;

interface Run {
  item: HTMLAnchorElement;
  animations: Animation[];
  timers: number[];
  /** Skip to the end and open the snack now. */
  open: () => void;
  /** Put everything back. */
  cancel: () => void;
}
let run: Run | undefined;

const transform = (x: number, y: number, deg: number, scale: number) =>
  `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${deg.toFixed(1)}deg) scale(${scale.toFixed(3)})`;

/** Position of `el` relative to `origin`, unaffected by page scroll. */
function boxIn(el: Element, origin: DOMRect) {
  const r = el.getBoundingClientRect();
  return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
}

/**
 * Simulates the drop and returns keyframes for the Web Animations API, one per frame.
 * The package tips as it falls, lands on a corner, bounces once or twice and comes to rest on its side.
 */
function simulateDrop(dropHeight: number, halfW: number, halfH: number, spin: 1 | -1, drift: number) {
  const frames: Keyframe[] = [];
  const restAngle = 90 * spin;
  const fallMs = Math.sqrt((2 * dropHeight) / GRAVITY);
  // Half the height of the rotated package: how far its centre sits above the tray floor.
  const reach = (deg: number) => {
    const rad = (Math.abs(deg) * Math.PI) / 180;
    return halfH * Math.abs(Math.cos(rad)) + halfW * Math.abs(Math.sin(rad));
  };
  // The centre starts halfH above the slot floor and ends reach(90) above the tray floor.
  const floor = dropHeight + halfH;
  let y = 0;
  let vy = 0;
  let angle = -2.5;
  let spinRate = (64 * spin - angle) / fallMs;
  let t = 0;
  let impactAt = 0;
  let bounces = 0;

  // Leaning out of the coil.
  for (; t < PUSH_MS; t += STEP_MS) {
    const p = (t / PUSH_MS) ** 2;
    frames.push({ transform: transform(0, -3 + 5 * p, -2.5 - 2 * p, 1 + 0.05 * p), offset: t });
  }
  const start = t;
  const end = start + fallMs + SETTLE_MS;
  for (; t <= end; t += STEP_MS) {
    vy += GRAVITY * STEP_MS;
    y += vy * STEP_MS;
    angle += spinRate * STEP_MS;
    const lowest = floor - reach(angle);
    if (y >= lowest) {
      y = lowest;
      if (bounces === 0) impactAt = t;
      if (vy > 0.25 && bounces < 2) {
        vy = -vy * (bounces === 0 ? 0.19 : 0.3);
        bounces++;
      } else {
        vy = 0;
      }
      // After the first hit the package rolls onto its side.
      spinRate = (restAngle - angle) / 110;
    }
    if (bounces > 0 && (restAngle - angle) * spin < 1) {
      angle = restAngle;
      spinRate = 0;
    }
    const progress = Math.min(1, (t - start) / fallMs);
    frames.push({ transform: transform(drift * progress, 2 + y, angle, 1.05), offset: t });
  }
  frames.push({ transform: transform(drift, 2 + floor - reach(restAngle), restAngle, 1.05), offset: t });
  const total = t;
  for (const frame of frames) frame.offset = Math.min(1, (frame.offset as number) / total);
  return { frames, total, impactAt: impactAt || start + fallMs };
}

function setDisplay(machine: Element, head?: string, body?: string) {
  const display = machine.querySelector<HTMLElement>("[data-vm-display]");
  if (!display) return;
  const headEl = display.querySelector("[data-vm-head]");
  const bodyEl = display.querySelector("[data-vm-body]");
  if (headEl) headEl.textContent = head ?? display.dataset.idle ?? "";
  if (bodyEl) bodyEl.textContent = body ?? display.dataset.idleNote ?? "";
}

function showItem(item: HTMLElement) {
  const machine = item.closest("[data-vm]");
  if (machine) setDisplay(machine, `${item.dataset.code} ${item.dataset.readout}`, item.dataset.take);
}

function vend(item: HTMLAnchorElement) {
  const machine = item.closest<HTMLElement>("[data-vm]");
  const cabinet = machine?.querySelector<HTMLElement>(".vm-cab");
  const layer = machine?.querySelector<HTMLElement>("[data-vm-fall]");
  const flap = machine?.querySelector<HTMLElement>("[data-vm-flap]");
  const tray = machine?.querySelector<HTMLElement>(".vm-tray");
  const win = machine?.querySelector<HTMLElement>(".vm-win");
  const pack = item.querySelector<HTMLElement>(".vm-pack");
  if (!machine || !cabinet || !layer || !flap || !tray || !win || !pack) {
    void navigate(item.href);
    return;
  }

  // Keep the whole trip on screen: the product and the tray it lands in.
  const view = cabinet.getBoundingClientRect();
  if (view.bottom > innerHeight || view.top < 0) {
    const fits = view.height <= innerHeight;
    cabinet.scrollIntoView({ block: fits ? "nearest" : "end", behavior: "smooth" });
  }

  const origin = cabinet.getBoundingClientRect();
  const from = { x: pack.offsetLeft, y: pack.offsetTop, w: pack.offsetWidth, h: pack.offsetHeight };
  const bay = boxIn(pack.offsetParent ?? pack, origin);
  const windowBox = boxIn(win, origin);
  const trayBox = boxIn(tray, origin);
  const left = bay.x + from.x;
  const top = bay.y + from.y;

  // One clip for both places the package can be seen; between them it is inside the machine.
  layer.style.clipPath = `polygon(${[
    [windowBox.x, windowBox.y],
    [windowBox.x + windowBox.w, windowBox.y],
    [windowBox.x + windowBox.w, windowBox.y + windowBox.h],
    [windowBox.x, windowBox.y + windowBox.h],
    [trayBox.x, trayBox.y],
    [trayBox.x + trayBox.w, trayBox.y],
    [trayBox.x + trayBox.w, trayBox.y + trayBox.h],
    [trayBox.x, trayBox.y + trayBox.h],
  ]
    .map(([x, y]) => `${x}px ${y}px`)
    .join(", ")})`;

  const clone = pack.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, { left: `${left}px`, top: `${top}px`, width: `${from.w}px`, height: `${from.h}px` });
  layer.replaceChildren(clone);

  const trayFloor = trayBox.y + trayBox.h - 7;
  const dropHeight = trayFloor - (top + from.h);
  const centreX = left + from.w / 2;
  // On its side the package is as wide as it was tall; keep it inside the tray.
  const margin = from.h / 2 + 8;
  const landX = Math.min(Math.max(centreX, trayBox.x + margin), trayBox.x + trayBox.w - margin);
  const spin = Math.random() < 0.5 ? 1 : -1;
  const drop = simulateDrop(dropHeight, (from.w * 1.05) / 2, (from.h * 1.05) / 2, spin, landX - centreX);

  // Warm the HTTP cache while the package falls, so the page is there when the tray opens.
  void fetch(item.href, { priority: "high" }).catch(() => undefined);

  item.classList.add("is-vending");
  setDisplay(
    machine,
    (machine.querySelector<HTMLElement>("[data-vm-display]")?.dataset.vending ?? "").replace(
      "{code}",
      item.dataset.code ?? "",
    ),
    item.dataset.take,
  );

  const timers: number[] = [];
  const animations: Animation[] = [];
  let done = false;

  const fall = clone.animate(drop.frames, { duration: drop.total, fill: "forwards", easing: "linear" });
  animations.push(fall);
  timers.push(window.setTimeout(() => item.classList.add("is-gone"), 0));

  // The flap takes the hit, then swings in out of the way.
  const flapAnimation = flap.animate(
    [
      { transform: "rotateX(0deg)", offset: 0 },
      { transform: "rotateX(-15deg)", offset: 0.18 },
      { transform: "rotateX(6deg)", offset: 0.4 },
      { transform: "rotateX(-3deg)", offset: 0.56 },
      { transform: "rotateX(0deg)", offset: 0.68 },
      { transform: "rotateX(-80deg)", offset: 1, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
    ],
    { delay: drop.impactAt, duration: drop.total - drop.impactAt + OPEN_MS, fill: "forwards", easing: "ease-out" },
  );
  animations.push(flapAnimation);
  // The cabinet feels the landing.
  animations.push(
    cabinet.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(1.5px)" }, { transform: "translateY(0)" }],
      {
        delay: drop.impactAt,
        duration: 150,
        easing: "ease-out",
      },
    ),
  );

  const open = () => {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    fall.finish();
    flapAnimation.finish();
    // The reader's chip carries the same name, so the package flies up into it.
    clone.style.viewTransitionName = "snack-pack";
    run = undefined;
    void navigate(item.href);
  };
  const cancel = () => {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    animations.forEach((animation) => animation.cancel());
    layer.replaceChildren();
    item.classList.remove("is-vending", "is-gone");
    setDisplay(machine);
    run = undefined;
  };
  timers.push(window.setTimeout(open, drop.total + OPEN_MS));
  run = { item, animations, timers, open, cancel };
}

function onClick(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target : undefined;
  const key = target?.closest<HTMLButtonElement>("[data-vm-key]");
  if (key) return pressKey(key);

  const item = target?.closest<HTMLAnchorElement>("a.vm-item");
  if (!item || event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (reduceMotion.matches) return;
  event.preventDefault();
  pick(item);
}

function pick(item: HTMLAnchorElement) {
  if (reduceMotion.matches) return void navigate(item.href);
  if (run?.item === item) return run.open();
  run?.cancel();
  vend(item);
}

/** The keypad: a letter and a number, in either order, vend that slot. Pointer only; the links are the real controls. */
let held: HTMLButtonElement | undefined;
function pressKey(key: HTMLButtonElement) {
  const machine = key.closest<HTMLElement>("[data-vm]");
  if (!machine) return;
  const value = key.dataset.vmKey ?? "";
  const isLetter = (v: string) => /[A-Z]/.test(v);
  const previous = held?.dataset.vmKey;
  held?.classList.remove("is-held");
  if (!previous || isLetter(previous) === isLetter(value)) {
    held = key;
    key.classList.add("is-held");
    setDisplay(machine, isLetter(value) ? `${value}_` : `_${value}`, "");
    return;
  }
  held = undefined;
  const code = isLetter(value) ? value + previous : previous + value;
  const item = machine.querySelector<HTMLAnchorElement>(`a.vm-item[data-code="${code}"]`);
  if (item) pick(item);
  else setDisplay(machine, code, machine.querySelector<HTMLElement>("[data-vm-display]")?.dataset.empty);
}

function onHover(event: Event) {
  if (run) return;
  const item = event.target instanceof Element ? event.target.closest<HTMLElement>("a.vm-item") : undefined;
  if (item) showItem(item);
}
function onLeave(event: Event) {
  if (run || held) return;
  const item = event.target instanceof Element ? event.target.closest<HTMLElement>("a.vm-item") : undefined;
  const machine = item?.closest("[data-vm]");
  if (machine) setDisplay(machine);
}

// Capture phase, so this runs before the client router sees the click.
document.addEventListener("click", onClick, true);
document.addEventListener("pointerover", onHover);
document.addEventListener("pointerout", onLeave);
document.addEventListener("focusin", onHover);
document.addEventListener("focusout", onLeave);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && run) run.cancel();
});

// Coming back from a snack: its package settles into its slot again.
document.addEventListener("astro:before-swap", (event) => {
  run = undefined;
  held = undefined;
  const from = event.from.pathname.replace(/\/$/, "");
  const pack = [...event.newDocument.querySelectorAll<HTMLAnchorElement>("a.vm-item")]
    .find((item) => new URL(item.href, event.to).pathname.replace(/\/$/, "") === from)
    ?.querySelector<HTMLElement>(".vm-pack");
  if (!pack) return;
  pack.style.viewTransitionName = "snack-pack";
  void event.viewTransition.finished.finally(() => pack.style.removeProperty("view-transition-name"));
});

// The keypad works once the script is here.
function enableKeys() {
  document.querySelectorAll<HTMLButtonElement>("[data-vm-key]").forEach((key) => (key.disabled = false));
}
document.addEventListener("astro:page-load", enableKeys);
enableKeys();
