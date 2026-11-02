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

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];

  return (
    <div className="rounded-lg border border-border p-4 sm:p-6">
      <svg viewBox="0 0 400 60" className="w-full" role="img" aria-label="Pipeline stages">
        {STAGES.map((s, i) => (
          <g key={s.id} transform={`translate(${i * 100 + 10}, 10)`}>
            <rect
              width="80"
              height="40"
              rx="6"
              className="transition-colors duration-300"
              fill={i === active ? "var(--color-accent)" : "transparent"}
              stroke={i <= active ? "var(--color-accent)" : "var(--color-border)"}
            />
            <text
              x="40"
              y="25"
              textAnchor="middle"
              fontSize="12"
              fill={i === active ? "var(--color-bg)" : "var(--color-fg)"}
            >
              {s.label}
            </text>
            {i < STAGES.length - 1 && <line x1="82" y1="20" x2="98" y2="20" stroke="var(--color-border)" />}
          </g>
        ))}
      </svg>
      <p className="mt-4 min-h-12 text-sm" aria-live="polite">
        {stage.detail}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40"
          disabled={active === 0}
          onClick={() => setActive((i) => i - 1)}
        >
          Back
        </button>
        <button
          type="button"
          className="rounded border border-border px-3 py-1 text-sm disabled:opacity-40"
          disabled={active === STAGES.length - 1}
          onClick={() => setActive((i) => i + 1)}
        >
          Next step
        </button>
      </div>
    </div>
  );
}
