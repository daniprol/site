# Notebook

An engineer-mathematician's notebook. The site is set like a working paper: one calm column of serif text,
a margin for notes, numbered sections and figures, and metadata pencilled in small monospace.
Taste through restraint: two typefaces, one accent, hairlines instead of boxes.

## Type

- **Source Serif 4** (variable, opsz 8–60, wght 300–700, true italics): body, headings, captions.
  18px body on a 28px line, ~65ch measure, old-style proportional figures. Headings at weight 450, balanced.
- **IBM Plex Mono** (400/500): dates, tags, verdicts, nav, section and figure numbers. 12px, tabular lining figures.
- No third face. Files are vendored in `src/assets/fonts` (latin subset, OFL) and loaded with Astro's Fonts API.

## Colour (`src/styles/tokens.css`, oklch + `light-dark()`)

| Token    | Light (paper)          | Dark (warm charcoal) | Use                              |
| -------- | ---------------------- | -------------------- | -------------------------------- |
| `bg`     | 0.974 0.009 84         | 0.205 0.007 65       | Paper                            |
| `fg`     | 0.235 0.012 60         | 0.905 0.014 82       | Ink                              |
| `muted`  | 0.47 0.012 62          | 0.71 0.012 75        | Pencil: metadata, notes          |
| `border` | 0.865 0.013 78         | 0.335 0.009 65       | Hairlines                        |
| `faint`  | 0.915 0.014 80         | 0.258 0.008 65       | Ruled lines, graph paper         |
| `code`   | 0.955 0.011 82         | 0.235 0.008 65       | Code and figure plates           |
| `accent` | 0.505 0.145 33 (oxide) | 0.735 0.12 40        | Links, active nav, diagram focus |

## Layout

A single `.sheet`: text column (37rem) + 3rem gap + 14rem margin column on screens ≥ 64rem.
Header, main and footer share it, so every left edge lines up. Section numbers, years and snack dates
**hang** into the left margin on wide screens; on phones they sit inline. Vertical rhythm in multiples of
one 28px line. Phones: name and utilities on one row, the four sections on a ruled row below, all 44px targets.

## Signature details

1. **Margin notes** — mono numerals in the accent, notes in the right margin with hanging numbers;
   on phones a tap opens the note under the line, ruled in oxide red. Pure CSS.
2. **Numbered like a paper** — h2/h3 get hanging section numbers (1, 1.1); figures are “Figure n” with the
   caption in the margin, the figure itself on a faint graph-paper plate. Articles end with a tombstone ∎.
3. **Snacks on ruled paper** — every line is one baseline tall and sits on a faint rule; dates hang like a
   log book. The verdict is one small word: **keep**, maybe, ~~drop~~.
4. **Index as a table of contents** — post titles with dot leaders to the date; the title morphs into the
   post heading via a view transition (projects too).
5. **Print** — A4 margins, chrome hidden, light theme forced, margin notes inline, external URLs printed.

## Motion

Only view transitions: a 180ms root crossfade and a 320ms title morph, both off under reduced motion.
Hover is a colour change. The theme icon turns half a turn. Nothing else moves.
