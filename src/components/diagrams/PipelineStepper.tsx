/**
 * Example interactive diagram: a pipeline the reader steps through.
 * A small ball rolls along the track to the active stage; stages are also clickable.
 * Rendered to HTML at build time; React hydrates only when it scrolls into view (client:visible).
 */
import { useState } from "react";

const STAGES = [
  { id: "parse", label: "Parse", detail: "The query is tokenized and normalized in Rust." },
  { id: "lexical", label: "Lexical", detail: "BM25 scores candidate documents from the inverted index." },
  { id: "semantic", label: "Semantic", detail: "Local embeddings re-rank the top candidates." },
  { id: "return", label: "Return", detail: "Hits cross the PyO3 boundary as plain Python objects." },
] as const;

const buttonClass =
  "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border px-4 text-sm font-medium " +
  "transition-colors hover:border-[var(--color-ball)] disabled:cursor-default disabled:opacity-40 disabled:hover:border-border";

export default function PipelineStepper() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active] ?? STAGES[0];
  // Ball position as a share of the track: centre of the active column.
  const ballLeft = `${((active + 0.5) / STAGES.length) * 100}%`;

  return (
    <div className="rounded-xl border border-border bg-[var(--color-surface)] p-4 sm:p-6">
      <div className="relative">
        {/* Track: a hairline across the column centres, filled in orange up to the active stage. */}
        <div className="absolute top-[0.6rem] right-[12.5%] left-[12.5%] h-px bg-border" aria-hidden="true" />
        <div
          className="absolute top-[0.6rem] left-[12.5%] h-px bg-[var(--color-ball)] transition-[width] duration-500"
          style={{ width: `${(active / STAGES.length) * 100}%` }}
          aria-hidden="true"
        />
        <div
          className="absolute top-0 size-5 -translate-x-1/2 rounded-full bg-[var(--color-ball)] shadow-[inset_0_0_0_1.5px_var(--color-seam)] transition-[left] duration-500 ease-[var(--ease-bounce)]"
          style={{ left: ballLeft }}
          aria-hidden="true"
        />
        <ol className="relative grid grid-cols-4 pt-7">
          {STAGES.map((s, i) => (
            <li key={s.id} className="flex justify-center">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={i === active ? "step" : undefined}
                className={`min-h-11 cursor-pointer rounded-lg px-1 text-[0.8rem] transition-colors sm:text-sm ${
                  i === active
                    ? "font-semibold text-[var(--color-fg)]"
                    : "text-[var(--color-muted)] hover:text-[var(--color-fg)]"
                }`}
              >
                <span className="block font-mono text-[0.65rem] opacity-70">0{i + 1}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-4 min-h-12 border-t border-border pt-4 text-[0.95rem]" aria-live="polite">
        {stage.detail}
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" className={buttonClass} disabled={active === 0} onClick={() => setActive((i) => i - 1)}>
          Back
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={active === STAGES.length - 1}
          onClick={() => setActive((i) => i + 1)}
        >
          Next step
        </button>
      </div>
    </div>
  );
}
