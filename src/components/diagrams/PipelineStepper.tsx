/**
 * Example interactive diagram: a pipeline the reader steps through.
 * Stages are paper tiles on a strip; the active one is a lifted sticky note.
 * Rendered to HTML at build time; React hydrates only when it scrolls into view (client:visible).
 */
import { useState } from "react";

const STAGES = [
  { id: "parse", label: "Parse", detail: "The query is tokenized and normalized in Rust." },
  { id: "lexical", label: "Lexical", detail: "BM25 scores candidate documents from the inverted index." },
  { id: "semantic", label: "Semantic", detail: "Local embeddings re-rank the top candidates." },
  { id: "return", label: "Return", detail: "Hits cross the PyO3 boundary as plain Python objects." },
] as const;

const TONES = [
  "var(--color-sticky-yellow)",
  "var(--color-sticky-pink)",
  "var(--color-sticky-sky)",
  "var(--color-sticky-orange)",
];

const button =
  "inline-flex min-h-11 cursor-pointer items-center px-4 font-mono text-[0.6875rem] font-medium tracking-wide uppercase shadow-[var(--shadow-paper)] disabled:cursor-default disabled:opacity-40";

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];

  return (
    <div className="bg-paper-2 p-4 sm:p-6">
      <ol className="grid grid-cols-4 gap-2" aria-label="Pipeline stages">
        {STAGES.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active ? "step" : undefined}
              className="flex aspect-square w-full cursor-pointer flex-col justify-between p-2 text-left transition-[rotate,translate,box-shadow] duration-300 ease-[var(--ease-out-soft)] sm:p-3"
              style={{
                background: i === active ? TONES[i] : i < active ? "var(--color-paper)" : "transparent",
                color: i === active ? "var(--color-sticky-ink)" : "var(--color-ink)",
                outline: i > active ? "1px dashed var(--color-ink-soft)" : undefined,
                outlineOffset: "-1px",
                boxShadow: i === active ? "var(--shadow-lifted)" : i < active ? "var(--shadow-paper)" : "none",
                rotate: i === active ? `${i % 2 ? 2 : -2}deg` : "0deg",
                translate: i === active ? "0 -4px" : "0 0",
              }}
            >
              <span className="font-mono text-[0.625rem]">0{i + 1}</span>
              <span className="font-display text-sm font-bold sm:text-lg">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-5 min-h-12 text-base" aria-live="polite">
        {stage.detail}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={`${button} bg-paper text-ink`}
          disabled={active === 0}
          onClick={() => setActive((i) => i - 1)}
        >
          ← Back
        </button>
        <button
          type="button"
          className={`${button} bg-ink text-paper`}
          disabled={active === STAGES.length - 1}
          onClick={() => setActive((i) => i + 1)}
        >
          Next step →
        </button>
      </div>
    </div>
  );
}
