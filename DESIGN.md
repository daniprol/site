# Canvas: design notes

## Concept

The site is a designer's desk: a green self-healing cutting mat with things left on it. On the home page the mat is a big surface you pan and rearrange: the intro is a printed sheet with a Dymo label, posts are index cards, snacks are sticky notes stamped with a verdict, projects are specimen cards with cut-paper art, and the CV is a till receipt. Inner pages put one calm sheet of paper on the same mat.

## Type

- **Bricolage Grotesque** (variable, opsz/wdth/wght): display. Big, tight and a little odd.
- **Atkinson Hyperlegible Next** (variable): body and long-form reading, 18px/1.65.
- **Martian Mono** (variable width): labels, dates, stamps, the ruler, the receipt.
- **Caveat**: handwritten notes on the mat. Used only for short labels.

All four are self-hosted from Fontsource through Astro's Fonts API (`local` provider).

## Colour (tokens.css)

| Token                                       | Light                    | Dark                          |
| ------------------------------------------- | ------------------------ | ----------------------------- |
| `mat`                                       | cutting-mat green        | deep night green              |
| `mat-line` / `mat-ink`                      | grid lines / text on mat | same, quieter                 |
| `paper`, `paper-2`, `kraft`                 | white stock, blue, kraft | dark card stock               |
| `ink` / `ink-soft`                          | near-black / grey        | warm white / grey             |
| `sticky-yellow`, `-pink`, `-orange`, `-sky` | saturated stickies       | slightly dimmed, still bright |
| `stamp-keep` / `-maybe` / `-drop`, `cobalt` | rubber-stamp inks        | fixed (they land on stickies) |
| `link`                                      | dark green on paper      | light green on dark paper     |

Shadows are layered and tinted with the mat colour, so paper looks like it sits on the mat rather than floating over grey.

## Layout

- **Phone (designed first):** the desk turns into a vertical collage on a 6-column grid. Each object has its own span, tilt and overlap, chosen per object (`src/components/desk/layout.ts`), so it reads as a composed spread, not a stack. Navigation is a bottom dock with four tabs (≥ 56px tall), and the name label and toggles sit at the top.
- **Desktop (≥ 64rem):** a 2400×1560 board inside a native scroll container. A ruler runs along the edges and a minimap sits bottom right.
- **Reading pages:** one sheet, 65ch measure, with a margin rule and sidenotes in the sheet's own margin on wide screens.

## Motion and interaction

- Panning uses native scrolling, so trackpads, wheels, arrow keys, focus-into-view and no-JS all work. JS (`desk.ts`, about 3 KB gzipped) adds drag-to-pan, picking up and moving objects (they lift with a deeper shadow), the minimap, and a **Tidy up** toggle that animates the desk into a plain grid using the View Transitions API. Tidy up is also the list fallback.
- Moved positions and the tidy setting are remembered per browser. **Reset** puts everything back.
- With reduced motion there are no lifts or transitions.

## Signature details

1. Dymo embossed label tape for the name and section titles.
2. Rubber-stamp verdicts on the snack stickies (keep / maybe / drop).
3. Cut-paper "screenshots" for each project, generated from its slug.
4. A till-receipt CV, and a ruler with cm marks around the board.
5. Washi tape holding the reading sheet to the mat.
