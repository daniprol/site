# Field — design notes

**Concept.** The site is one seeded vector field. On the home page, a few thousand particles flow through it and
search for their place in Dani's name, ending up as a turning quiver plot (maths, signals, search, agents in one image).
The same field, seeded by each slug, draws every post and project its own static header and thumbnail. You only see it
move on the hero. Reading pages stay quiet.

## Type

- **Anybody** (variable, wdth 50–150, wght 100–900). Display face. Its width axis is what moves: section titles open
  from 55% to 130% as they scroll through (CSS `animation-timeline: view()`), project titles widen on hover, and each
  letter of the wordmark widens in turn.
- **Schibsted Grotesk** (variable). Body and long-form text, 17–18px at a 1.7 line height, 40rem measure.
- **Martian Mono** (variable). Labels, dates, seeds, code.
  All three are self-hosted (Fontsource latin subset, loaded with the Astro Fonts API `local` provider).

## Colour (tokens.css, light / dark)

- `field`: ultramarine `oklch(.47 .26 266)`, or deep ultramarine in dark mode. The generative surface.
- `field-ink`: pale ice or periwinkle. Whatever is drawn on the field.
- `flare`: signal orange `oklch(.77 .17 55)`. Used only for the attractor, the active nav item, "keep" verdicts and focus rings. Never for text.
- `bg / fg / muted / border / surface`: cool paper and blue-black ink. `accent` is the text-safe ultramarine.

## Grid

Phones get a 16px gutter and one column. From 48rem the gutter is 32px, and pages use a left rail (9rem + 2rem gap)
for dates and indices. Body text starts on the 11rem line, which leaves the right margin free for sidenotes on wide screens.

## Motion

- Hero canvas: the name assembles over about 1.6s, scrolling releases it, the pointer pushes and swirls particles,
  and a tap sends out a shockwave. It pauses when offscreen or when the tab is hidden. Under reduced motion it draws
  one still frame. Without JS the name is set in type.
- Everything else is CSS: width-axis transitions on an expo ease-out, tiles turn 90° on hover, and the menu items rise in.

## Signature details

1. A name made of agents. Each particle at rest is a dash that follows the local flow, so the name keeps turning.
2. Header art seeded by the slug, drawn at build time as SVG, with no JS. It shows streamlines spiralling into one orange "result" and its seed printed in mono.
3. Kinetic section titles driven only by scroll-driven CSS.
4. A full-screen ultramarine phone menu built on `<details>`, so it works without JS.
5. Snack verdicts as marks: filled, half and empty squares.

Engine: `src/components/field/` (`field.ts` holds the maths shared by server and client; `engine.ts` is about 2.7 KB gzipped).
