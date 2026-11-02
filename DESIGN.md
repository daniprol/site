# Signal

**Concept.** The site is a broadcast. The page itself is the colour (vermilion by day, oxblood by night), the type is
oversized and cropped by the screen, and its width axis moves with the scroll like a signal being tuned. Everything
interactive answers with the same hard inversion. Long-form posts drop into a calm reading sheet that slides up over the
title, so the identity frames the reading without shouting through it.

## Type

- **Anybody** (variable, wght 100–900, wdth 50–150%): display. Uppercase Black for cropped words; 84–92% width for titles.
- **Hanken Grotesk** (variable): body and reading, 17–18px.
- **Martian Mono** (variable): 11px uppercase labels, the "captions" of the broadcast.
- All self-hosted from Fontsource through Astro's Fonts API (`local` provider, latin subset).

## Colour (src/styles/tokens.css)

| Token              | Light                              | Dark                         |
| ------------------ | ---------------------------------- | ---------------------------- |
| `bg` (page)        | vermilion `oklch(.68 .2 33)`       | oxblood `oklch(.26 .085 27)` |
| `fg`               | ink `oklch(.16 .015 30)` (6.2:1)   | warm white (13.7:1)          |
| `signal` (display) | ink                                | hot vermilion (6:1)          |
| `band`             | ink with vermilion text            | same                         |
| `sheet` (reading)  | paper `oklch(.985 .004 30)`        | `oklch(.17 .012 30)`         |
| `accent` / `mark`  | deep vermilion (5.8:1) / vermilion | light vermilion (7.2:1)      |

No greys on the page colour: hierarchy comes from size and face, not from dimmed text.

## Layout

Full-bleed, fluid gutter `clamp(1rem, 4vw, 3rem)`, max 90rem. Rows are separated by 1px rules, never boxes. Reading column 40rem, with a
15rem sidenote margin from 72rem.

## Motion and interaction

- Hero name: DANIEL compresses and PROL widens as you scroll (CSS scroll timeline, font-stretch).
- Section words stick while their rows slide over them; their width opens up as they cross the viewport (view timeline).
- Snacks ticker (pauses on hover and offscreen).
- Hover/tap inversion on every row, link and control (`.inv`).
- Desktop cursor label ("Read", "Open") that trails the pointer; skipped on touch and reduced motion.
- Phones: a full-screen menu of huge words near the thumb; the header hides on scroll down.
- Reading: sticky title, sheet slides over it, 4px progress bar.
- `prefers-reduced-motion` and no-JS: everything is static and complete. JS total is a few hundred bytes of vanilla.

## Signature details

Cropped edge-to-edge name; "on air" blinking square; Santiago coordinates + live local time; verdict stamps (solid keep,
outlined maybe, struck drop); giant cropped email as the footer.
