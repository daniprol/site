/**
 * Example interactive diagram: a pipeline the reader steps through.
 * Rendered to HTML at build time; React hydrates only when it scrolls into view (client:visible).
 * Styled like a function composition: numbered nodes on a line that fills with ink as you go.
 */
import { useState } from "react";

const STAGES = [
  { id: "parse", label: "Parse", detail: "The query is tokenized and normalized in Rust." },
  { id: "lexical", label: "Lexical", detail: "BM25 scores candidate documents from the inverted index." },
  { id: "semantic", label: "Semantic", detail: "Local embeddings re-rank the top candidates." },
  { id: "return", label: "Return", detail: "Hits cross the PyO3 boundary as plain Python objects." },
] as const;

const LAST = STAGES.length - 1;

const NODE_STATE = {
  active: "border-accent bg-accent text-bg",
  done: "border-accent bg-accent-soft text-accent",
  todo: "border-border bg-bg text-muted group-hover:border-accent",
} as const;

const CONTROL =
  "inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border px-4 text-sm font-semibold transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-40";

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];
  const progress = (active / LAST) * 100;

  return (
    <div className="rounded-xl border border-border bg-bg p-4 sm:p-6">
      <ol className="relative grid grid-cols-4" aria-label="Pipeline stages">
        {STAGES.map((s, i) => {
          const state = i === active ? "active" : i < active ? "done" : "todo";
          return (
            <li key={s.id} className="relative flex justify-center">
              {/* Track segment to the next node, filled once that step is reached. */}
              {i < LAST && (
                <span aria-hidden="true" className="absolute top-5 left-1/2 h-0.5 w-full bg-border">
                  <span
                    className="block h-full origin-left bg-accent transition-transform duration-500 ease-out-soft"
                    style={{ transform: `scaleX(${progress >= ((i + 1) / LAST) * 100 ? 1 : 0})` }}
                  />
                </span>
              )}
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={state === "active" ? "step" : undefined}
                className="group relative flex min-h-11 cursor-pointer flex-col items-center gap-1.5 rounded-md px-1"
              >
                <span
                  className={`flex size-10 items-center justify-center rounded-full border-2 font-mono text-sm font-semibold transition-colors duration-300 ${NODE_STATE[state]}`}
                >
                  {i + 1}
                </span>
                <span className={`text-xs sm:text-sm ${state === "active" ? "font-bold text-fg" : "text-muted"}`}>
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 rounded-lg bg-surface px-4 py-3">
        <p className="font-mono text-xs font-semibold text-accent">
          f<sub>{active + 1}</sub> · {stage.label}
        </p>
        <p className="mt-1 min-h-12 text-[0.95rem] leading-relaxed" aria-live="polite">
          {stage.detail}
        </p>
      </div>

      <div className="mt-4 flex justify-between gap-2">
        <button type="button" className={CONTROL} disabled={active === 0} onClick={() => setActive((i) => i - 1)}>
          ← Back
        </button>
        <button type="button" className={CONTROL} disabled={active === LAST} onClick={() => setActive((i) => i + 1)}>
          Next step →
        </button>
      </div>
    </div>
  );
}
