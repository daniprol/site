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

The highlighter sweeps in under links and titles on hover (0.45s ease-out), and the logo curve
redraws on hover. View transitions morph post titles. Cherry picks add their own: the graph draws
itself on first paint, cherries sway on hover and travel to the entry header, and the pick result
types itself once. All disabled by reduced-motion.

## Signature details

1. **Highlighter** — current nav item, the intro's key phrase, `**bold**` in posts, hover on every list.
2. **Plotted mark** — two axes and a curve ending on a yellow point (logo and favicon).
3. **Proof furniture** — numbered `§` headings, blockquotes as "Note." asides, a `<Callout kind="definition|lemma|note">` MDX component (About opens with _Definition 1 (Daniel Prol)_), and a ∎ tombstone at the end of each post.
4. **Cherry picks** — the short-reviews section is a git graph where every commit is a cherry. Two
   lines run down the list: `main` (solid, my toolbox) and `upstream` (dashed, everything I try). A
   picked tool is carried over to main by a red arc and hangs there as a ripe cherry; a maybe is a
   yellow Rainier still ripening on upstream; a dropped one lies under the branch. The ∈ ≈ ∉ glyphs
   stay next to the words. Click a row and its cherry is plucked and travels to the entry's header
   (a view transition); the entry itself is plain Proof prose and ends with the pick result, a
   small terminal where pros and cons are the + and − lines and git's answer is the verdict.
   Artwork lives in `src/components/cherry/`, colours in the cherry tokens. Everything is a link
   or a radio button first, so it works without JavaScript, and it holds still under reduced motion.
5. **Pipeline as composition** — the stepper's nodes fill along a track, labelled f₁…f₄.
