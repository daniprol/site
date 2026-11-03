/**
 * Example interactive diagram: a pipeline the reader steps through.
 * Rendered to HTML at build time; React hydrates only when it scrolls into view (client:visible).
 * Plain HTML rather than SVG so labels stay at reading size on phones.
 */
import { useState } from "react";

const STAGES = [
  { id: "parse", label: "Parse", detail: "The query is tokenized and normalized in Rust." },
  { id: "lexical", label: "Lexical", detail: "BM25 scores candidate documents from the inverted index." },
  { id: "semantic", label: "Semantic", detail: "Local embeddings re-rank the top candidates." },
  { id: "return", label: "Return", detail: "Hits cross the PyO3 boundary as plain Python objects." },
] as const;

const button =
  "inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border px-4 text-sm transition-colors hover:border-accent hover:text-accent disabled:cursor-default disabled:opacity-40 disabled:hover:border-border disabled:hover:text-current";

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];

  return (
    <div className="rounded-lg border border-border bg-surface p-4 font-sans sm:p-6">
      <ol className="relative grid grid-cols-4" aria-label="Pipeline stages">
        {/* The connecting line, filled up to the active stage. */}
        <span aria-hidden="true" className="absolute top-3 right-[12.5%] left-[12.5%] h-px bg-border" />
        <span
          aria-hidden="true"
          className="absolute top-3 left-[12.5%] h-px bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${(active / (STAGES.length - 1)) * 75}%` }}
        />
        {STAGES.map((s, i) => (
          <li key={s.id} className="relative flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active ? "step" : undefined}
              className="flex cursor-pointer flex-col items-center gap-2 px-1 pb-1"
            >
              <span
                className={[
                  "flex size-6 items-center justify-center rounded-full border font-mono text-[0.6875rem] transition-colors duration-300",
                  i === active
                    ? "border-accent bg-accent text-bg"
                    : i < active
                      ? "border-accent bg-surface text-accent"
                      : "border-border bg-surface text-muted",
                ].join(" ")}
              >
                {i + 1}
              </span>
              <span
                className={["text-[0.8125rem] sm:text-sm", i === active ? "font-semibold" : "text-muted"].join(" ")}
              >
                {s.label}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-5 min-h-12 font-serif text-[0.98rem] leading-relaxed" aria-live="polite">
        {stage.detail}
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" className={button} disabled={active === 0} onClick={() => setActive((i) => i - 1)}>
          Back
        </button>
        <button
          type="button"
          className={button}
          disabled={active === STAGES.length - 1}
          onClick={() => setActive((i) => i + 1)}
        >
          Next step
        </button>
      </div>
    </div>
  );
}
