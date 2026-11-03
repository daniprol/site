# Statusline

A quiet, readable blog that feels like it was written in a well-tuned editor. Writing is the hero; the
personality lives at the edges — a slim statusline, a cursorline you can drive with `j`/`k`, and a
colourscheme of its own — so a Neovim user smiles and everyone else just reads.

## Type

- **Schibsted Grotesk** (variable, roman + italic): body, headings, UI. A newspaper grotesk with warmth; body 17px on phones, 18px from 768px, line-height 1.7.
- **Recursive Mono** (Recursive's MONO axis only, 72 KB): code, dates, metadata, statusline.
- Self-hosted via Fontsource + Astro Fonts API (`local` provider). No display sizes: titles top out at 40px.

## Colour — "Arousa" (after the ría at Cambados)

Defined once with `light-dark()` in `src/styles/tokens.css`; mirrored as an Expressive Code theme in `src/styles/code-themes.ts`.

| token         | day       | night     | role                          |
| ------------- | --------- | --------- | ----------------------------- |
| bg            | `#f7f8f8` | `#11181b` | fog / water after dark        |
| fg            | `#1c2a30` | `#d6dedf` | slate ink                     |
| muted         | `#56676e` | `#8d9da3` | secondary text (AA on bg)     |
| accent (teal) | `#0b6b6e` | `#62c3bd` | links, focus, functions, keep |
| ochre         | `#855f00` | `#dcb65e` | strings, quotes, maybe        |
| coral         | `#b03f2a` | `#ee8b70` | keywords, drop                |
| blue          | `#3a5c96` | `#90afe4` | types, numbers                |

## Layout

Single 40rem column (≈68ch), 20px gutters. Lists use a 6.5rem date gutter from 640px. Sidenotes float into
the right margin from 76rem. Phones get a 4-up section row under the name (44px targets); the language
picker lives in the footer.

## Motion

120ms colour fades on hover/cursorline, a 160ms rise for dialogs, smooth scroll for keys, Astro view
transitions on post titles. All collapsed by `prefers-reduced-motion`.

## Signature details

1. **Statusline** pinned to the bottom: section as a coloured "mode" (writing teal, snacks ochre, projects blue, about coral), `~/path` as buffer name, locale, and Vim's position report (`Top`, `42%`, `Bot`, `All`) with a 2px progress rule. Works without JS except the position.
2. **Cursorline + keys**: list rows highlight like the current line; `j/k`, `gg/G`, `g h/w/s/p/a`, `/` search, `t` theme, `?` sheet. ~70 lines of vanilla JS, ignored while typing; hints hidden on touch.
3. **Search** on Pagefind, loaded only when the dialog first opens.
4. **Snack verdicts as diff lines**: `+ keep`, `~ maybe`, `− drop`.
5. **Code at home**: custom Arousa syntax theme, vim-tab-style file title with a teal indicator, sidenotes as margin "virtual text".
