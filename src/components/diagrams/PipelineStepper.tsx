/**
 * Example interactive diagram: a pipeline the reader steps through.
 * Rendered to HTML at build time; React hydrates only when it scrolls into view (client:visible).
 * Swiss styling: four numbered cells on a rule; the active stage is a solid red block.
 */
import { useState } from "react";

const STAGES = [
  { id: "parse", label: "Parse", detail: "The query is tokenized and normalized in Rust." },
  { id: "lexical", label: "Lexical", detail: "BM25 scores candidate documents from the inverted index." },
  { id: "semantic", label: "Semantic", detail: "Local embeddings re-rank the top candidates." },
  { id: "return", label: "Return", detail: "Hits cross the PyO3 boundary as plain Python objects." },
] as const;

const button =
  "label flex h-11 cursor-pointer items-center px-4 transition-colors disabled:cursor-default disabled:opacity-35";

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];

  return (
    <div className="bg-surface p-4 sm:p-6">
      <ol className="grid grid-cols-4 gap-1" aria-label="Pipeline stages">
        {STAGES.map((s, i) => {
          const state = i === active ? "active" : i < active ? "done" : "todo";
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={state === "active" ? "step" : undefined}
                className={[
                  "flex h-20 w-full cursor-pointer flex-col justify-between border-t-2 p-2 text-left transition-colors duration-200 sm:h-24 sm:p-3",
                  state === "active" && "border-accent bg-accent text-accent-ink",
                  state === "done" && "border-fg text-fg hover:text-accent",
                  state === "todo" && "border-border text-muted hover:text-fg",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="font-mono text-[0.6875rem] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm font-semibold tracking-tight sm:text-base">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-5 min-h-14 text-lg leading-snug font-medium tracking-tight text-pretty" aria-live="polite">
        {stage.detail}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className={`${button} outline outline-1 -outline-offset-1 outline-fg hover:text-accent`}
          disabled={active === 0}
          onClick={() => setActive((i) => i - 1)}
        >
          Back
        </button>
        <button
          type="button"
          className={`${button} bg-fg text-bg hover:bg-accent hover:text-accent-ink`}
          disabled={active === STAGES.length - 1}
          onClick={() => setActive((i) => i + 1)}
        >
          Next step
        </button>
      </div>
    </div>
  );
}
