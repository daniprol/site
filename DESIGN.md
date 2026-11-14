# Proof

A bright, crisp blog for a mathematician turned engineer. Writing leads; the personality is in the
margins: a plotted curve for a logo, a yellow highlighter, numbered sections, verdicts as set
membership, and every post closing like a proof (∎).

## Type

- **Atkinson Hyperlegible Next** (variable, 200–800) for everything you read. Humanist, open, very
  legible on phones, and not the usual Inter/Grotesk pick. Headings are the same face at 700 with
  tight tracking; no display sizes (posts top out at 2.4rem).
- **Atkinson Hyperlegible Mono** for meta, code, project names and section numbers. Same DNA, so the
  pair reads as one voice.
- KaTeX's own math face for formulas and the ∈ ≈ ∉ verdict glyphs.
- Body 17px on phones, 18px in posts from 768px; line-height 1.7.

## Colour (oklch, light / dark, all in `src/styles/tokens.css`)

| token             | role                        |
| ----------------- | --------------------------- |
| `bg`              | cool white / deep navy ink  |
| `fg`              | navy ink / soft white       |
| `muted`           | blue-grey, AA on bg         |
| `accent`          | cobalt pen (links, numbers) |
| `accent-soft`     | pale cobalt wash (notes)    |
| `mark`            | yellow highlighter          |
| `keep/maybe/drop` | green, amber, red verdicts  |

## Layout

One 42rem column, 16px gutters on phones. Header: wordmark + language + theme on one row, the four
sections as an even row of 44px tabs underneath; one line from 768px. Sidenotes become margin notes
from 1280px; section numbers hang in the left margin from 1024px.

## Motion

Only the highlighter: it sweeps in under links and titles on hover (0.45s ease-out), and the logo
curve redraws on hover. View transitions morph post titles. On /snacks the history is drawn as you scroll: HEAD rides
down the trunk and each branch appears as it passes. Opening an entry flies its commit dot into the
strip; swiping (or ← →) slides the strip and the page together. Everything starts from the finished
state, so no JavaScript, no scroll-timeline support or reduced motion all show the still version. All disabled by reduced-motion.

## Signature details

1. **Highlighter** — current nav item, the intro's key phrase, `**bold**` in posts, hover on every list.
2. **Plotted mark** — two axes and a curve ending on a yellow point (logo and favicon).
3. **Proof furniture** — numbered `§` headings, blockquotes as "Note." asides, a `<Callout kind="definition|lemma|note">` MDX component (About opens with _Definition 1 (Daniel Prol)_), and a ∎ tombstone at the end of each post.
4. **Snacks as commits** — the short reviews are a git history at /snacks, with time running up.
   Each one is a branch off the trunk, true to real git: merged (keep) lands back on the trunk as a
   merge commit, reverted (drop) is merged and then followed by a red revert commit, open (maybe)
   ends at its commit. A small graph of the latest entries sits under the title. Picking one opens
   `/snacks/<slug>` as a pull request: the same history on its side as a strip at the top, the review
   as the opening comment, pros and cons as a diff, the verdict as the merge box. Chrome stays small,
   mono and muted so the text leads. An entry can have a main picture and a small gallery; every
   picture opens in a viewer. The activity grid points at rows in the list instead of leaving the page. Proof colours and our own icons; nothing from GitHub's artwork,
   and the section is not called "Commits" so nobody takes these for real ones.
5. **Pipeline as composition** — the stepper's nodes fill along a track, labelled f₁…f₄.
