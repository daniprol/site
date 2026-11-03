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
curve redraws on hover. View transitions morph post titles. All disabled by reduced-motion.

## Signature details

1. **Highlighter** — current nav item, the intro's key phrase, `**bold**` in posts, hover on every list.
2. **Plotted mark** — two axes and a curve ending on a yellow point (logo and favicon).
3. **Proof furniture** — numbered `§` headings, blockquotes as "Note." asides, a `<Callout kind="definition|lemma|note">` MDX component (About opens with _Definition 1 (Daniel Prol)_), and a ∎ tombstone at the end of each post.
4. **Snacks as set membership** — ∈ keep, ≈ maybe, ∉ drop, with a legend on /snacks.
5. **Pipeline as composition** — the stepper's nodes fill along a track, labelled f₁…f₄.
