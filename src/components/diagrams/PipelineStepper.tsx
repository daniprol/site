/**
 * Example interactive diagram: a pipeline the reader steps through.
 * Rendered to HTML at build time; React hydrates only when it scrolls into view (client:visible).
 */
import { useState } from "react";

const STAGES = [
  { id: "parse", label: "Parse", detail: "The query is tokenized and normalized in Rust." },
  { id: "lexical", label: "Lexical", detail: "BM25 scores candidate documents from the inverted index." },
  { id: "semantic", label: "Semantic", detail: "Local embeddings re-rank the top candidates." },
  { id: "return", label: "Return", detail: "Hits cross the PyO3 boundary as plain Python objects." },
] as const;

const button =
  "inline-flex min-h-11 cursor-pointer items-center rounded border border-border bg-bg px-4 font-mono text-[0.8125rem] transition-colors hover:border-accent hover:text-accent disabled:cursor-default disabled:opacity-40 disabled:hover:border-border disabled:hover:text-fg";

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];

  return (
    <div className="rounded-md border border-border bg-surface p-4 sm:p-5">
      <ol className="grid grid-cols-4 gap-1.5 sm:gap-3" aria-label="Pipeline stages">
        {STAGES.map((s, i) => (
          <li key={s.id} className="relative">
            <button
              type="button"
              aria-current={i === active ? "step" : undefined}
              onClick={() => setActive(i)}
              className={`flex min-h-11 w-full cursor-pointer items-center justify-center rounded border px-1 font-mono text-[0.75rem] transition-colors duration-300 sm:text-[0.8125rem] ${
                i === active
                  ? "border-accent bg-accent font-bold text-on-accent"
                  : i < active
                    ? "border-accent bg-bg text-fg"
                    : "border-border bg-bg text-muted hover:text-fg"
              }`}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-3 min-h-12 text-[0.9375rem] leading-relaxed" aria-live="polite">
        <span className="mr-2 font-mono text-[0.8125rem] text-muted">
          {active + 1}/{STAGES.length}
        </span>
        {stage.detail}
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" className={button} disabled={active === 0} onClick={() => setActive((i) => i - 1)}>
          ← Back
        </button>
        <button
          type="button"
          className={button}
          disabled={active === STAGES.length - 1}
          onClick={() => setActive((i) => i + 1)}
        >
          Next step →
        </button>
      </div>
    </div>
  );
}
