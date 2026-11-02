# Swiss

**Concept.** The site as a printed poster series: International Typographic Style read through a contemporary design
magazine. Huge, tight grotesk type carries the identity; a 12-column grid, hairline rules and numbered indexes carry the
structure; one flat signal red is the only colour, used as a graphic object rather than decoration.

## Type

- **Schibsted Grotesk** (variable, 400–900): display, UI and body. A newspaper grotesk with enough character at 900 to
  be the "image" of the site, and calm enough at 400 for long reading.
- **IBM Plex Mono** (400, 500): index numbers, dates, labels, code.
- Scale is deliberately bipolar: display sizes are fluid `clamp()` values up to ~19rem; everything else sits between
  0.75rem (mono labels) and 1.1875rem (body). Display tracking −0.055em, leading 0.8.

## Colour tokens (`src/styles/tokens.css`)

| Token        | Light          | Dark          | Use                             |
| ------------ | -------------- | ------------- | ------------------------------- |
| `bg`         | paper, L 0.975 | ink, L 0.165  | page                            |
| `fg`         | ink, L 0.17    | paper, L 0.95 | type, rules                     |
| `muted`      | L 0.48         | L 0.70        | metadata (≥ 6:1)                |
| `border`     | L 0.86         | L 0.32        | quiet hairlines                 |
| `accent`     | signal red     | lifted red    | graphic blocks, hovers, numbers |
| `accent-ink` | = bg           | = bg          | text set on red (≥ 4.8:1)       |
| `surface`    | L 0.945        | L 0.205       | code blocks, diagram panels     |

## Grid

12 columns, `--gutter` 1rem → 1.5rem, page margin 1rem → 2.5rem, max 90rem. Content snaps to named spans: labels in
columns 1–3, lists and text in 4–12 (prose starts at column 4, capped at a 38rem measure; sidenotes float into the free columns from 84rem). On phones everything stacks to one
column but keeps the same left edge.

## Motion

Colour shifts and an underline that wipes in on hover (150–180ms); the phone menu fades in; the post title morphs between list and page via view
transitions. Nothing else moves. All of it stops under `prefers-reduced-motion`.

## Signature details

- Home: name set as a poster, the last line finished by a red bar that runs to the right margin.
- Every list is a numbered index (`01`, `02` …) with a full-width rule above each row.
- Snack verdicts as print marks: **keep** is a red block, **maybe** an outline, **drop** struck through.
- Phone navigation is a full-screen popover (no JS) with huge numbered links.
- Section labels hang in the left columns like magazine running heads.
