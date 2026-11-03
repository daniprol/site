# Courtside

A friendly blog first, portfolio second. Ink-navy text on chalk white, one warm basketball orange used like a
highlighter pen, and a lively-but-readable type pairing. Personality lives in a handful of small, quiet basketball
nods rather than in layout: the page itself stays a calm reading column.

## Type

- **Bricolage Grotesque** (variable, 620–740): headings, post titles, the name. Quirky ink traps give warmth at small sizes.
- **Figtree** (variable, roman + italic): body and UI, 17–18px, line-height 1.6–1.72. Open, round, very readable.
- **JetBrains Mono**: dates, kinds, stacks, code. Always small, always muted.

All self-hosted through Fontsource + Astro's Fonts API (`local` provider), latin subset.

## Colour (tokens.css, `light-dark()`)

| token           | light                      | dark               | use                               |
| --------------- | -------------------------- | ------------------ | --------------------------------- |
| bg              | chalk white                | deep navy-charcoal | page                              |
| surface         | warm off-white             | lifted navy        | snack cards, chips, stepper       |
| fg / muted      | ink navy / slate           | warm white / slate | text                              |
| accent          | burnt orange (AA)          | soft orange (AA)   | text accents: Fig. labels, series |
| ball            | basketball orange          | basketball orange  | decorative: dots, underlines      |
| highlight       | pale apricot               | dim amber          | link hover swipe, selection       |
| keep/maybe/drop | green / ochre / rose tints | same, darkened     | verdict stamps                    |

## Layout

Single 44rem column (40rem measure for prose), 20px gutters. Sidenotes float into the right margin from 72rem.
Phones: brand + theme toggle on one row, the four sections as a full-width row of 48px tabs; language picker moves to
the footer. Home: name, two-line intro, "Now", then Writing (with descriptions), Snacks (2-up cards), Projects.

## Motion

Short and springy (`--ease-bounce`), only on interaction; all disabled under `prefers-reduced-motion`.

## Signature details

1. **The ball.** A tiny basketball is the brand mark; hover it and it takes one dribble. The current nav section has a
   ball resting under it. Sidenote numbers sit in little orange balls; posts end with the ball at rest.
2. **Theme toggle as a basketball**: a half-filled ball with seams that spins half a turn so the dark side swaps.
3. **Highlighter links**: a thin orange underline that swipes into an apricot highlight on hover (post titles too).
4. **Snack stamps**: snacks are quick cards with a slightly crooked keep / maybe / drop stamp that straightens on hover.
5. **Court line**: one divider drawn as a half-court line with centre circle; "Back to top" dribbles on hover; the 404
   is an airball.
