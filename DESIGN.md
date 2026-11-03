# Atlantic

A blog that comes from somewhere: Santiago de Compostela, on Galicia's Atlantic coast. Granite paper under an
overcast sky by day, the ría at night. Writing leads; personality comes from a few quiet details, never decoration.

## Type

- **Literata** (variable, optical sizes) for reading: post bodies, descriptions, the home intro. A screen-first text serif, cool rather than bookish.
- **Schibsted Grotesk** for headings, titles, navigation and metadata. An editorial newspaper grotesque, warmer than the usual safe sans.
- **Fragment Mono** for code, snack kinds and coordinates.
- Self-hosted from Fontsource via Astro's Fonts API (`local` provider). Body 17px on phones, 18px from 640px, line height 1.72.

## Colour (`src/styles/tokens.css`, `light-dark()`)

| Token               | Light                      | Dark                 |
| ------------------- | -------------------------- | -------------------- |
| bg / surface        | pale cool granite          | deep night-sea slate |
| fg / muted          | slate ink                  | mist                 |
| accent              | Atlantic blue-teal         | sea glass            |
| keep / maybe / drop | moss / gorse / lichen-rust | same, lifted         |

One accent only. Verdict colours appear only on snacks. All text pairs pass WCAG AA.

## Layout

A single 40rem column, 20px gutters. Phones get a two-row header: name and controls, then the four sections
spread across a full-width row of 44px targets. Sidenotes move into the right margin from 80rem.

## Motion

Astro view transitions; the post title morphs from the list into the article. Colour transitions on hover (150ms).
Everything respects `prefers-reduced-motion`.

## Signature details

1. **The tide line**: a low, slow wave (CSS mask, accent colour) used as the only ornament: under page and post
   headers, and across the footer.
2. **The Santiago clock**: "Written in Santiago de Compostela, 07:55 there now, probably drizzling." Live local time
   from a few lines of inline JS; Galician reads "seguramente orballando". Coordinates sit under it as metadata.
3. **Verdict marks** on snacks: filled, half and hollow dots in moss, gorse and lichen.
4. Literata descriptions under sans titles make the post list read like a contents page, not a feed.

Zero JS apart from the theme toggle, the clock and React diagram islands.
