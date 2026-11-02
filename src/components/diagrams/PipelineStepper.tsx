/**
 * Example interactive diagram: a pipeline the reader steps through.
 * Rendered to HTML at build time; React hydrates only when it scrolls into view (client:visible).
 * Styled as a signal path: stages are nodes on one wire, the active one carries the flare.
 */
import { useState } from "react";

const STAGES = [
  { id: "parse", label: "Parse", detail: "The query is tokenized and normalized in Rust." },
  { id: "lexical", label: "Lexical", detail: "BM25 scores candidate documents from the inverted index." },
  { id: "semantic", label: "Semantic", detail: "Local embeddings re-rank the top candidates." },
  { id: "return", label: "Return", detail: "Hits cross the PyO3 boundary as plain Python objects." },
] as const;

const button =
  "label inline-flex min-h-11 cursor-pointer items-center gap-2 border border-current px-4 uppercase transition-colors enabled:hover:bg-fg enabled:hover:text-bg disabled:cursor-default disabled:opacity-35";

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];
  const x = (i: number) => 34 + i * 108;

  return (
    <div className="bg-surface p-4 sm:p-6">
      <svg viewBox="0 0 400 74" className="w-full" role="img" aria-label="Pipeline stages">
        <line x1={x(0)} y1="22" x2={x(STAGES.length - 1)} y2="22" stroke="var(--color-border)" strokeWidth="2" />
        <line
          x1={x(0)}
          y1="22"
          x2={x(active)}
          y2="22"
          stroke="var(--color-accent)"
          strokeWidth="2"
          style={{ transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
        {STAGES.map((s, i) => (
          <g key={s.id} transform={`translate(${x(i)}, 22)`}>
            <rect
              x="-11"
              y="-11"
              width="22"
              height="22"
              fill={i === active ? "var(--color-field)" : i < active ? "var(--color-accent)" : "var(--color-bg)"}
              stroke={i <= active ? "var(--color-accent)" : "var(--color-border)"}
              strokeWidth="2"
              style={{ transition: "fill 0.3s" }}
            />
            {i === active && <circle r="4" fill="var(--color-flare)" />}
            <text
              y="44"
              textAnchor="middle"
              fontSize="9.5"
              fontFamily="var(--font-mono)"
              letterSpacing="0.04em"
              fill={i === active ? "var(--color-fg)" : "var(--color-muted)"}
            >
              {String(i + 1).padStart(2, "0")} {s.label.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-4 min-h-12 text-base leading-snug" aria-live="polite">
        {stage.detail}
      </p>
      <div className="mt-4 flex gap-2">
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
