/**
 * Example interactive diagram: a pipeline the reader steps through, drawn as a schematic.
 * Stages are buttons on a signal bus; a readout panel shows the active stage.
 * Rendered to HTML at build time; React hydrates only when it scrolls into view (client:visible).
 */
import { useState } from "react";

const STAGES = [
  { id: "parse", label: "Parse", detail: "The query is tokenized and normalized in Rust." },
  { id: "lexical", label: "Lexical", detail: "BM25 scores candidate documents from the inverted index." },
  { id: "semantic", label: "Semantic", detail: "Local embeddings re-rank the top candidates." },
  { id: "return", label: "Return", detail: "Hits cross the PyO3 boundary as plain Python objects." },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

/** Shared timing so every moving part lands together. */
const MOTION =
  "transition-[color,background-color,border-color,transform] duration-(--duration-base) ease-(--ease-instrument)";

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];
  const last = STAGES.length - 1;
  const progress = active / last;

  return (
    <div className="border border-rule bg-surface font-mono text-data">
      <div className="label flex items-center justify-between border-b border-rule px-3 py-2.5 text-muted">
        <span>foliq · query</span>
        <span className="tabular-nums">
          <span className="text-signal">{pad(active + 1)}</span> / {pad(STAGES.length)}
        </span>
      </div>

      <div className="relative px-3 pt-6 pb-5 sm:px-6">
        {/* The bus: a hairline behind the stages, filled with signal up to the active one. */}
        <div className="absolute inset-x-[calc(12.5%+0.375rem)] top-[calc(1.5rem+1.375rem)] h-px bg-rule-strong sm:inset-x-[calc(12.5%+0.75rem)]">
          <div className={`h-full origin-left bg-signal ${MOTION}`} style={{ transform: `scaleX(${progress})` }} />
        </div>
        <ol className="relative grid grid-cols-4 gap-1.5 sm:gap-3">
          {STAGES.map((s, i) => {
            const isActive = i === active;
            const isDone = i < active;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => setActive(i)}
                  className={[
                    "flex h-11 w-full cursor-pointer items-center justify-center border px-1 text-[0.75rem] leading-none sm:text-data",
                    MOTION,
                    isActive
                      ? "border-signal bg-signal text-signal-ink"
                      : isDone
                        ? "border-fg bg-bg text-fg"
                        : "border-rule-strong bg-bg text-muted hover:border-fg hover:text-fg",
                  ].join(" ")}
                >
                  {s.label}
                </button>
                <span
                  className={`mt-2 block text-center text-[0.6875rem] tabular-nums ${isActive ? "text-signal" : "text-muted"}`}
                  aria-hidden="true"
                >
                  S{i + 1}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-x-3 border-t border-rule px-3 py-3 sm:px-4">
        <span className="label pt-0.5 text-muted">Out</span>
        <p className="min-h-10 font-sans text-[0.9375rem] leading-snug text-fg" aria-live="polite">
          {stage.detail}
        </p>
      </div>

      <div className="label grid grid-cols-2 divide-x divide-rule border-t border-rule">
        <button
          type="button"
          className={`h-12 cursor-pointer text-muted hover:bg-bg hover:text-fg disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent ${MOTION}`}
          disabled={active === 0}
          onClick={() => setActive((i) => i - 1)}
        >
          ← Back
        </button>
        <button
          type="button"
          className={`h-12 cursor-pointer text-fg hover:bg-bg hover:text-signal disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent ${MOTION}`}
          disabled={active === last}
          onClick={() => setActive((i) => i + 1)}
        >
          Next step →
        </button>
      </div>
    </div>
  );
}
