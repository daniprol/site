/**
 * Example interactive diagram: a pipeline the reader steps through.
 * Rendered to HTML at build time; React hydrates only when it scrolls into view (client:visible).
 * Each stage is a tappable cell; the active one turns vermilion, like the rest of the site.
 */
import { useState } from "react";

const STAGES = [
  { id: "parse", label: "Parse", detail: "The query is tokenized and normalized in Rust." },
  { id: "lexical", label: "Lexical", detail: "BM25 scores candidate documents from the inverted index." },
  { id: "semantic", label: "Semantic", detail: "Local embeddings re-rank the top candidates." },
  { id: "return", label: "Return", detail: "Hits cross the PyO3 boundary as plain Python objects." },
] as const;

const button =
  "flex h-11 items-center px-4 font-mono text-[0.6875rem] font-semibold uppercase tracking-wide transition-colors " +
  "enabled:cursor-pointer enabled:hover:bg-sheet-fg enabled:hover:text-sheet enabled:active:bg-mark enabled:active:text-ink disabled:opacity-35";

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];

  return (
    <div className="bg-code-bg text-sheet-fg">
      <ol className="grid grid-cols-4 border-b border-rule" aria-label="Pipeline stages">
        {STAGES.map((s, i) => (
          <li key={s.id} className="border-r border-rule last:border-r-0">
            <button
              type="button"
              aria-current={i === active ? "step" : undefined}
              onClick={() => setActive(i)}
              className={`flex min-h-20 w-full cursor-pointer flex-col justify-between p-2.5 text-left transition-colors sm:min-h-24 sm:p-3.5 ${
                i === active
                  ? "bg-mark text-ink"
                  : i < active
                    ? "text-sheet-fg"
                    : "text-sheet-muted hover:text-sheet-fg"
              }`}
            >
              <span className="font-mono text-[0.625rem] font-semibold">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-display text-[0.95rem] leading-none font-extrabold uppercase [font-stretch:85%] sm:text-lg">
                {s.label}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="h-1 bg-rule" aria-hidden="true">
        <div
          className="h-full origin-left bg-sheet-fg transition-transform duration-300 ease-snap"
          style={{ transform: `scaleX(${(active + 1) / STAGES.length})` }}
        />
      </div>
      <p className="min-h-20 px-4 pt-4 pb-2 text-base leading-snug sm:px-5" aria-live="polite">
        {stage.detail}
      </p>
      <div className="flex justify-between px-1 pb-1">
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
