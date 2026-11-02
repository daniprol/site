/**
 * Example interactive diagram: a pipeline the reader steps through.
 * Rendered to HTML at build time; React hydrates only when it scrolls into view (client:visible).
 *
 * Built like a small product component: a segmented track you can tap directly, a thumb that
 * springs to the active stage, and a detail panel that eases in on every change.
 * All motion is CSS (see the tokens); prefers-reduced-motion turns it off globally.
 */
import { useRef, useState, type KeyboardEvent } from "react";

const STAGES = [
  { id: "parse", label: "Parse", detail: "The query is tokenized and normalized in Rust." },
  { id: "lexical", label: "Lexical", detail: "BM25 scores candidate documents from the inverted index." },
  { id: "semantic", label: "Semantic", detail: "Local embeddings re-rank the top candidates." },
  { id: "return", label: "Return", detail: "Hits cross the PyO3 boundary as plain Python objects." },
] as const;

const LAST = STAGES.length - 1;
const pad = (n: number) => String(n).padStart(2, "0");

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const stage = STAGES[active] ?? STAGES[0];

  const go = (i: number, focus = false) => {
    const next = Math.max(0, Math.min(LAST, i));
    setActive(next);
    if (focus) tabs.current[next]?.focus();
  };

  // Arrow keys move along the track, like a native segmented control.
  const onKeyDown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: LAST };
    const target = keys[e.key];
    if (target === undefined) return;
    e.preventDefault();
    go(target, true);
  };

  return (
    <div className="rounded-(--radius-lg) bg-surface p-1.5 shadow-(--shadow-raised)">
      {/* Track */}
      <div
        role="toolbar"
        aria-label="Pipeline stages"
        onKeyDown={onKeyDown}
        className="relative grid grid-cols-4 gap-1 rounded-[0.6875rem] bg-surface-sunken p-1 shadow-[inset_0_0_0_1px_var(--color-border)]"
      >
        {/* Thumb: one quarter of the track, minus padding and gaps, translated by whole steps. */}
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-1 w-[calc((100%-1.25rem)/4)] rounded-(--radius-md) bg-surface shadow-(--shadow-raised) transition-transform duration-(--duration-spring) ease-(--ease-spring)"
          style={{ transform: `translateX(calc(${active} * (100% + 0.25rem)))` }}
        />
        {STAGES.map((s, i) => {
          const isActive = i === active;
          const isDone = i < active;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              tabIndex={isActive ? 0 : -1}
              aria-current={isActive ? "step" : undefined}
              onClick={() => go(i)}
              className={`group relative z-10 flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-(--radius-md) px-1 transition-[color,transform] duration-(--duration-spring) ease-(--ease-spring) active:scale-[0.94] active:duration-(--duration-fast) ${
                isActive ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              <span
                className={`relative grid size-4 place-items-center rounded-full font-mono text-[0.625rem] leading-none transition-colors duration-(--duration-base) ${
                  isActive ? "text-accent" : "text-faint"
                }`}
              >
                <span
                  className={`transition-[opacity,scale] duration-(--duration-spring) ease-(--ease-spring) ${isDone ? "scale-50 opacity-0" : ""}`}
                >
                  {pad(i + 1)}
                </span>
                {/* Completed stages trade their number for a check. */}
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className={`absolute size-3.5 transition-[opacity,scale] duration-(--duration-spring) ease-(--ease-spring) ${
                    isDone ? "scale-100 opacity-100" : "scale-50 opacity-0"
                  }`}
                >
                  <path
                    d="M3.5 8.5l3 3 6-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-[0.8125rem] leading-5 font-medium tracking-[-0.006em]">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Detail */}
      <div className="px-3 pt-4 pb-2 sm:px-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[0.6875rem] text-faint tabular-nums">
            {pad(active + 1)} / {pad(STAGES.length)}
          </span>
          {/* Progress: a hairline that fills from the left on the spring curve. */}
          <span aria-hidden="true" className="relative h-px flex-1 overflow-hidden rounded-full bg-border">
            <span
              className="absolute inset-0 origin-left bg-fg transition-transform duration-(--duration-spring) ease-(--ease-spring)"
              style={{ transform: `scaleX(${(active + 1) / STAGES.length})` }}
            />
          </span>
        </div>
        <p
          key={stage.id}
          aria-live="polite"
          className="stepper-detail mt-3 min-h-12 text-[0.9375rem] leading-6 text-pretty"
        >
          {stage.detail}
        </p>

        <div className="mt-3 flex items-center justify-end gap-1.5">
          <button
            type="button"
            disabled={active === 0}
            onClick={() => go(active - 1)}
            className="min-h-11 cursor-pointer rounded-full px-4 text-[0.8125rem] font-medium text-muted transition-[color,background-color,transform,opacity] duration-(--duration-spring) ease-(--ease-spring) hover:bg-surface-hover hover:text-fg active:scale-[0.94] active:duration-(--duration-fast) disabled:pointer-events-none disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => go(active === LAST ? 0 : active + 1)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-fg px-4 text-[0.8125rem] font-medium text-bg shadow-[inset_0_1px_0_oklch(1_0_0/0.16),0_1px_2px_oklch(0_0_0/0.18)] transition-transform duration-(--duration-spring) ease-(--ease-spring) active:scale-[0.94] active:duration-(--duration-fast)"
          >
            {active === LAST ? "Start over" : "Next step"}
            <span aria-hidden="true">{active === LAST ? "↺" : "→"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
