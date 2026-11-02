/**
 * Example interactive diagram: a pipeline the reader steps through.
 * Rendered to HTML at build time; React hydrates only when it scrolls into view (client:visible).
 * Colours come from the surrounding cover palette (--field, --ink, --pop), with site fallbacks.
 */
import { useState } from "react";

const STAGES = [
  { id: "parse", label: "Parse", detail: "The query is tokenized and normalized in Rust." },
  { id: "lexical", label: "Lexical", detail: "BM25 scores candidate documents from the inverted index." },
  { id: "semantic", label: "Semantic", detail: "Local embeddings re-rank the top candidates." },
  { id: "return", label: "Return", detail: "Hits cross the PyO3 boundary as plain Python objects." },
] as const;

const FIELD = "var(--field, var(--color-fg))";
const INK = "var(--ink, var(--color-bg))";

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];

  return (
    <div className="border-y-[3px] border-fg py-5">
      <ol className="grid grid-cols-4 gap-1.5" aria-label="Pipeline stages">
        {STAGES.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active ? "step" : undefined}
              className="flex min-h-20 w-full cursor-pointer flex-col justify-between p-2 text-left transition-colors duration-300 sm:min-h-24 sm:p-3"
              style={
                i === active
                  ? { background: FIELD, color: INK }
                  : { boxShadow: `inset 0 0 0 2px ${i < active ? FIELD : "var(--color-border)"}` }
              }
            >
              <span className="text-xs font-bold tracking-wider">{String(i + 1).padStart(2, "0")}</span>
              <span
                className="font-display text-sm leading-none font-extrabold uppercase sm:text-lg"
                style={{ fontVariationSettings: '"wdth" 75' }}
              >
                {s.label}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-5 min-h-14 font-serif text-xl leading-snug italic sm:text-2xl" aria-live="polite">
        {stage.detail}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="min-h-11 cursor-pointer rounded-full border-2 border-fg px-5 text-sm font-bold tracking-wider uppercase disabled:cursor-default disabled:opacity-30"
          disabled={active === 0}
          onClick={() => setActive((i) => i - 1)}
        >
          Back
        </button>
        <button
          type="button"
          className="min-h-11 cursor-pointer rounded-full px-5 text-sm font-bold tracking-wider uppercase disabled:cursor-default disabled:opacity-30"
          style={{ background: FIELD, color: INK }}
          disabled={active === STAGES.length - 1}
          onClick={() => setActive((i) => i + 1)}
        >
          Next step
        </button>
      </div>
    </div>
  );
}
