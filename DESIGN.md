# Cover

**Concept.** The site is a magazine and every piece of work is an issue. Each post and project gets its own cover,
composed at build time from its slug and title: a palette, a layout, a set of shapes, a width and weight for the
headline and a barcode, all picked by a seeded generator inside one strict system. The index pages are a wall of
covers; every post opens on its cover and carries its colour into the article. Snacks are the fast, loud "front of
book".

## Type

- **Anybody** (variable, `wdth` 50–150, `wght` 100–900): display. The generator moves the width axis per cover, so
  one family reads as condensed poster type on one cover and extended masthead type on the next.
- **Instrument Sans** (variable): text and UI. Body at 18px / 1.65, 66ch measure.
- **Instrument Serif Italic**: decks, cover lines and pull quotes. The magazine voice.

## Colour

- Chrome: `paper` (pure white / near-black) and `ink`, plus a signal `vermilion` accent. No beige, no grey mood.
- Eight cover palettes in `tokens.css` (`[data-palette]`): vermilion, cobalt, saffron, bubblegum, emerald, night,
  lilac, forest. Each sets `--field`, `--ink`, `--pop`, `--deep` and `--tone` (a text-safe accent for the article,
  defined for light and dark). Every ink/field pair is ≥ 4.5:1, ink over shapes ≥ 3:1.

## Layout

- Mobile first: a cover is 4:5 and fills a phone screen. Walls go 1 → 2 → 3 columns.
- Articles: 66ch column; sidenotes hang in a 15rem right margin from 72rem up.
- Post covers turn into a wide "spread" on desktop, recomposed (not cropped) for a 2:1 frame.

## Motion

- Covers lift a few pixels and their shapes drift on hover; view transitions carry the cover from the wall into
  the post. Everything is off under `prefers-reduced-motion`. No JS besides the theme toggle.

## Signature details

- Generated barcodes encode the slug; issue numbers count posts in order.
- Masthead "PROL" on every cover, set wider or narrower with the cover.
- The phone menu is a full-screen colour field (native `popover`, no JS).
- Snack verdicts are rubber stamps: KEEP, MAYBE, DROP.
