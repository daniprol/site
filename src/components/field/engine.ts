/**
 * The live hero: particles ("agents") flow through the field and search for their place
 * in a name. At rest each one draws a short dash along the local flow, so the name reads
 * as a quiver plot that keeps turning. Pointer and touch disturb it; scrolling releases it.
 * Runs only while visible; draws a single still frame under prefers-reduced-motion.
 */
import { hash, makeField, random } from "./field";

interface Palette {
  ground: string;
  ink: string;
  flare: string;
}

/** Resolve token colours (light-dark() included) to concrete values via a probe element. */
function readPalette(root: HTMLElement): Palette {
  const probe = document.createElement("span");
  probe.style.display = "none";
  root.append(probe);
  const read = (token: string) => {
    probe.style.color = `var(${token})`;
    return getComputedStyle(probe).color;
  };
  const palette = { ground: read("--color-field"), ink: read("--color-field-ink"), flare: read("--color-flare") };
  probe.remove();
  return palette;
}

export function mountField(root: HTMLElement): () => void {
  const canvas = root.querySelector("canvas");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return () => undefined;
  const cv: HTMLCanvasElement = canvas;
  const g: CanvasRenderingContext2D = ctx;
  const readout = root.querySelector<HTMLElement>("[data-field-readout]");
  const words = (root.dataset.name ?? "").toUpperCase().split(/\s+/);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const field = makeField(hash(root.dataset.seed ?? "field"));

  let W = 0;
  let H = 0;
  let S = 1;
  let count = 0;
  let free = 0;
  // Struct-of-arrays keeps the per-frame loop allocation-free.
  let x = new Float32Array(0);
  let y = x;
  let vx = x;
  let vy = x;
  let tx = x;
  let ty = x;
  let life = x;
  let palette = readPalette(root);
  let order = 0;
  let visible = true;
  let frame = 0;
  let start = performance.now();
  let lastReadout = 0;
  const pointer = { x: 0, y: 0, active: false, pulse: 0 };

  /** Rasterise the name offscreen and sample target points from its glyphs. */
  function sampleTargets(n: number): Float32Array {
    const off = document.createElement("canvas");
    const k = 0.5; // sample at half resolution; plenty for target points
    off.width = Math.ceil(W * k);
    off.height = Math.ceil(H * k);
    const o = off.getContext("2d", { willReadFrequently: true });
    if (!o) return new Float32Array(0);
    const family = getComputedStyle(root).getPropertyValue("--font-display") || "sans-serif";
    const narrow = W < 720;
    const lines = narrow ? words : [words.join(" ")];
    const gutter = narrow ? 16 : 48;
    o.scale(k, k);
    (o as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = narrow ? "semi-expanded" : "expanded";
    o.font = `800 100px ${family}`;
    const widest = Math.max(...lines.map((l) => o.measureText(l).width));
    const size = Math.min(((W - gutter * 2) / widest) * 100, (H * (narrow ? 0.62 : 0.5)) / lines.length);
    o.font = `800 ${size}px ${family}`;
    o.textBaseline = "alphabetic";
    o.fillStyle = "#000";
    const lead = size * 0.86;
    const top = narrow ? H * 0.25 : H * 0.36;
    lines.forEach((line, i) => o.fillText(line, gutter, top + lead * (i + 1) - size * 0.12));

    const data = o.getImageData(0, 0, off.width, off.height).data;
    let filled = 0;
    for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) > 128) filled++;
    const grid = Math.max(1, Math.sqrt(filled / n));
    const r = random(7);
    const out: number[] = [];
    for (let gy = 0; gy < off.height; gy += grid) {
      for (let gx = 0; gx < off.width; gx += grid) {
        const px = Math.min(off.width - 1, Math.round(gx + (r() - 0.5) * grid * 0.6));
        const py = Math.min(off.height - 1, Math.round(gy + (r() - 0.5) * grid * 0.6));
        if ((data[(py * off.width + px) * 4 + 3] ?? 0) > 128) out.push(px / k, py / k);
      }
    }
    return Float32Array.from(out);
  }

  function resize() {
    const rect = root.getBoundingClientRect();
    if (Math.abs(rect.width - W) < 1 && Math.abs(rect.height - H) < H * 0.15) return;
    W = rect.width;
    H = rect.height;
    S = Math.max(W, H) * 0.7;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targets = sampleTargets(W < 720 ? 1900 : 3400);
    const locked = targets.length / 2;
    free = Math.round(locked * 0.35);
    count = locked + free;
    x = new Float32Array(count);
    y = new Float32Array(count);
    vx = new Float32Array(count);
    vy = new Float32Array(count);
    tx = new Float32Array(count);
    ty = new Float32Array(count);
    life = new Float32Array(count);
    const r = random(11);
    for (let i = 0; i < count; i++) {
      x[i] = r() * W;
      y[i] = r() * H;
      tx[i] = i < locked ? (targets[i * 2] ?? -1) : -1;
      ty[i] = i < locked ? (targets[i * 2 + 1] ?? -1) : -1;
      life[i] = 60 + r() * 240;
    }
    if (still) {
      for (let i = 0; i < locked; i++) {
        x[i] = tx[i] ?? 0;
        y[i] = ty[i] ?? 0;
      }
      order = 1;
      draw(0, true);
    }
  }

  /** One simulation + render step. `t` is seconds since mount. */
  function draw(t: number, clear = false) {
    g.globalAlpha = clear ? 1 : 0.26;
    g.fillStyle = palette.ground;
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 1;

    // Order: 0 = pure flow, 1 = the name. Builds on load, dissolves as the hero scrolls away.
    const intro = Math.min(1, Math.max(0, (t - 0.3) / 1.6));
    const scrolled = Math.min(1, Math.max(0, scrollY / (H * 0.85)));
    const goal = (1 - (1 - intro) ** 3) * (1 - scrolled * 0.9);
    order += (goal - order) * 0.06;
    pointer.pulse *= 0.9;

    const R = W < 720 ? 90 : 140;
    const dash = W < 720 ? 2.6 : 3.2;
    const flareEvery = 29;
    const ink = new Path2D();
    const flare = new Path2D();
    for (let i = 0; i < count; i++) {
      let px = x[i] ?? 0;
      let py = y[i] ?? 0;
      const gx = tx[i] ?? -1;
      const gy = ty[i] ?? -1;
      const a = field.angle(px / S, py / S, t);
      const fx = Math.cos(a);
      const fy = Math.sin(a);
      let ax = vx[i] ?? 0;
      let ay = vy[i] ?? 0;
      if (still) {
        ax = 0;
        ay = 0;
      } else if (gx >= 0) {
        ax = ax * 0.84 + (gx - px) * 0.02 * order + fx * 0.5 * (1 - order) + fx * 0.04;
        ay = ay * 0.84 + (gy - py) * 0.02 * order + fy * 0.5 * (1 - order) + fy * 0.04;
      } else {
        ax = ax * 0.9 + fx * 0.28;
        ay = ay * 0.9 + fy * 0.28;
      }
      if (pointer.active || pointer.pulse > 0.02) {
        const dx = px - pointer.x;
        const dy = py - pointer.y;
        const d = Math.hypot(dx, dy) + 0.01;
        const reach = R * (1 + pointer.pulse * 1.5);
        if (d < reach) {
          const f = (1 - d / reach) * (pointer.active ? 2.2 : 0) + (1 - d / reach) * pointer.pulse * 9;
          ax += (dx / d) * f - (dy / d) * f * 0.5;
          ay += (dy / d) * f + (dx / d) * f * 0.5;
        }
      }
      vx[i] = ax;
      vy[i] = ay;
      const nx = px + ax;
      const ny = py + ay;
      const path = i % flareEvery === 0 ? flare : ink;
      if (Math.abs(ax) + Math.abs(ay) < dash * 0.5) {
        // Settled: a dash along the local flow, centred on the particle.
        path.moveTo(nx - fx * dash, ny - fy * dash);
        path.lineTo(nx + fx * dash, ny + fy * dash);
      } else {
        path.moveTo(px, py);
        path.lineTo(nx, ny);
      }
      px = nx;
      py = ny;
      // Free agents live briefly and respawn anywhere, so they never all pool in the field's sinks.
      if (gx < 0 && (life[i] = (life[i] ?? 0) - 1) < 0) {
        px = Math.random() * W;
        py = Math.random() * H;
        vx[i] = 0;
        vy[i] = 0;
        life[i] = 60 + Math.random() * 240;
      }
      x[i] = px;
      y[i] = py;
    }
    g.lineCap = "round";
    g.lineWidth = W < 720 ? 1.4 : 1.5;
    g.strokeStyle = palette.ink;
    g.stroke(ink);
    g.lineWidth = 2.2;
    g.strokeStyle = palette.flare;
    g.stroke(flare);

    if (readout && t - lastReadout > 0.25) {
      lastReadout = t;
      readout.textContent = `n=${count.toLocaleString("en")}  order=${order.toFixed(2)}`;
    }
  }

  function loop(now: number) {
    frame = 0;
    if (!visible || document.hidden) return;
    draw((now - start) / 1000);
    frame = requestAnimationFrame(loop);
  }
  const play = () => {
    if (!still && !frame && visible && !document.hidden) frame = requestAnimationFrame(loop);
  };

  const move = (e: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.active = e.pointerType === "mouse";
  };
  const down = (e: PointerEvent) => {
    move(e);
    pointer.pulse = 1;
  };
  const leave = () => {
    pointer.active = false;
  };
  const onVisibility = () => play();
  const onTheme = () => {
    palette = readPalette(root);
    if (still) draw(0, true);
  };

  const io = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    play();
  });
  const ro = new ResizeObserver(() => resize());
  const mo = new MutationObserver(onTheme);

  resize();
  root.classList.add("is-live");
  io.observe(root);
  ro.observe(root);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  document.addEventListener("visibilitychange", onVisibility);
  if (!still) {
    root.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerdown", down, { passive: true });
    root.addEventListener("pointerleave", leave);
  }
  // Wait for the display face before sampling glyphs, then rebuild once.
  document.fonts?.ready.then(() => {
    W = 0;
    resize();
    start = performance.now();
    play();
  });

  return () => {
    cancelAnimationFrame(frame);
    io.disconnect();
    ro.disconnect();
    mo.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    root.removeEventListener("pointermove", move);
    root.removeEventListener("pointerdown", down);
    root.removeEventListener("pointerleave", leave);
  };
}
