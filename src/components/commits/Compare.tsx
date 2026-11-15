/**
 * Two snacks side by side, as a split diff of what I liked (+) and what I did not (−).
 * The server renders a default pair, so the page reads fine without JavaScript; with it, the two
 * pickers work and the choice lives in the URL (?a=herdr&b=t3-code) so a comparison can be shared.
 */
import { useEffect, useState } from "react";

export interface CompareItem {
  slug: string;
  title: string;
  take: string | undefined;
  kind: string;
  verdict: "keep" | "maybe" | "drop";
  state: string;
  href: string;
  pros: string[];
  cons: string[];
}

export interface CompareLabels {
  base: string;
  compare: string;
  swap: string;
  liked: string;
  disliked: string;
  none: string;
  read: string;
  same: string;
}

interface Props {
  items: CompareItem[];
  labels: CompareLabels;
  initialA: string;
  initialB: string;
}

function Lines({ texts, kind, label, none }: { texts: string[]; kind: "add" | "del"; label: string; none: string }) {
  return (
    <>
      <p className="cmp-hunk">
        @@ {label} · {texts.length} @@
      </p>
      {texts.length > 0 ? (
        <ol className="pr-lines" lang="en">
          {texts.map((text, i) => (
            <li key={text} className={kind}>
              <span className="no" aria-hidden="true">
                {i + 1}
              </span>
              <span className="sign">{kind === "add" ? "+" : "−"}</span>
              <span className="text">{text}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="cmp-none">{none}</p>
      )}
    </>
  );
}

function Side({ item, labels }: { item: CompareItem; labels: CompareLabels }) {
  return (
    <article className="pr-box cmp-side" data-verdict={item.verdict}>
      <header className="cmp-head">
        <h2 className="cmp-title">
          <a className="group" href={item.href}>
            <span className="marker-hover">{item.title}</span>
          </a>
        </h2>
        <span className="cm-pill">{item.state}</span>
        {item.take && <p className="cmp-take">{item.take}</p>}
      </header>
      <Lines texts={item.pros} kind="add" label={labels.liked} none={labels.none} />
      <Lines texts={item.cons} kind="del" label={labels.disliked} none={labels.none} />
      <p className="cmp-foot">
        <a className="cm-textlink" href={item.href}>
          {labels.read}
        </a>
      </p>
    </article>
  );
}

export default function Compare({ items, labels, initialA, initialB }: Props) {
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const [ready, setReady] = useState(false);
  const known = (slug: string | null): slug is string => items.some((item) => item.slug === slug);

  // The URL wins over the default pair. Read after hydration so server and client HTML match.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromA = params.get("a");
    const fromB = params.get("b");
    const nextA = known(fromA) ? fromA : initialA;
    let nextB = known(fromB) ? fromB : initialB;
    if (nextB === nextA) nextB = items.find((item) => item.slug !== nextA)?.slug ?? nextB;
    setA(nextA);
    setB(nextB);
    setReady(true);
  }, []); // once, on mount

  useEffect(() => {
    if (!ready) return;
    const url = new URL(location.href);
    url.searchParams.set("a", a);
    url.searchParams.set("b", b);
    history.replaceState(history.state, "", url);
  }, [a, b, ready]);

  const left = items.find((item) => item.slug === a);
  const right = items.find((item) => item.slug === b);
  const picker = (label: string, value: string, change: (slug: string) => void) => (
    <label className="cmp-pick">
      <span>{label}</span>
      <select value={value} disabled={!ready} onChange={(event) => change(event.target.value)}>
        {items.map((item) => (
          <option key={item.slug} value={item.slug}>
            {item.title}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="pr cmp">
      <div className="cmp-bar">
        {picker(labels.base, a, setA)}
        <button
          type="button"
          className="cmp-swap"
          disabled={!ready}
          aria-label={labels.swap}
          title={labels.swap}
          onClick={() => {
            setA(b);
            setB(a);
          }}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 5.5h11m-3-3 3 3-3 3M14 10.5H3m3-3-3 3 3 3" />
          </svg>
        </button>
        {picker(labels.compare, b, setB)}
      </div>
      {a === b ? (
        <p className="cmp-same">{labels.same}</p>
      ) : (
        <div className="cmp-grid">
          {left && <Side item={left} labels={labels} />}
          {right && <Side item={right} labels={labels} />}
        </div>
      )}
    </div>
  );
}
