/**
 * Example interactive diagram: a pipeline the reader steps through.
 * Rendered to HTML at build time; React hydrates only when it scrolls into view (client:visible).
 * Drawn like a notebook sketch: hairline boxes, the current stage in the accent, past stages in ink.
 */
import { useState } from "react";

const STAGES = [
  { id: "parse", label: "Parse", detail: "The query is tokenized and normalized in Rust." },
  { id: "lexical", label: "Lexical", detail: "BM25 scores candidate documents from the inverted index." },
  { id: "semantic", label: "Semantic", detail: "Local embeddings re-rank the top candidates." },
  { id: "return", label: "Return", detail: "Hits cross the PyO3 boundary as plain Python objects." },
] as const;

const mono = "font-mono text-meta tabular-nums";

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];

  return (
    <div>
      <ol className="flex items-stretch" aria-label="Pipeline stages">
        {STAGES.map((s, i) => {
          const state = i === active ? "current" : i < active ? "done" : "todo";
          return (
            <li key={s.id} className="flex min-w-0 flex-1 items-center">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={state === "current" ? "step" : undefined}
                className={[
                  "flex min-h-14 w-full min-w-0 cursor-pointer flex-col items-start justify-center border bg-bg px-1.5 py-1.5 text-left transition-colors duration-300 sm:px-3",
                  state === "current"
                    ? "border-accent text-accent"
                    : state === "done"
                      ? "border-fg text-fg"
                      : "border-border text-muted hover:text-fg",
                ].join(" ")}
              >
                <span className={`${mono} leading-none opacity-80`}>{i + 1}</span>
                <span className="mt-1 truncate text-sm leading-tight sm:text-base">{s.label}</span>
              </button>
              {i < STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={[
                    "h-px w-1.5 shrink-0 transition-colors duration-300 sm:w-5",
                    i < active ? "bg-fg" : "bg-border",
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-5 min-h-14 text-base leading-7" aria-live="polite">
        <span className={`${mono} mr-2 text-muted`}>
          {active + 1}/{STAGES.length}
        </span>
        {stage.detail}
      </p>

      <div className={`mt-3 flex gap-2 ${mono}`}>
        <button
          type="button"
          className="min-h-11 cursor-pointer border border-border bg-bg px-4 text-fg transition-colors hover:border-fg disabled:cursor-default disabled:opacity-40 disabled:hover:border-border"
          disabled={active === 0}
          onClick={() => setActive((i) => i - 1)}
        >
          ← Back
        </button>
        <button
          type="button"
          className="min-h-11 cursor-pointer border border-border bg-bg px-4 text-fg transition-colors hover:border-fg disabled:cursor-default disabled:opacity-40 disabled:hover:border-border"
          disabled={active === STAGES.length - 1}
          onClick={() => setActive((i) => i + 1)}
        >
          Next step →
        </button>
      </div>
    </div>
  );
}
