# Studio

A design engineer's notebook: grey on grey, soft and tactile, with the detail saved for a second look.
Everything is quiet at rest and answers when touched — rows lift, controls give under the finger, the
nav thumb glides between pages. One warm accent, used almost nowhere.

## Type

- **Inter** (variable, with the `opsz` axis, so headings get the display cut automatically).
  Features: `cv01` (open 1), `cv05` (tailed l), `ss03` (round quotes). UI 16/24, long-form 17/28, labels 13/20.
- **Geist Mono** only for dates, counts, tags and code.
- Every line-height is a multiple of 4px; prose blocks sit one line (28px) apart.
- Fonts are self-hosted through Astro's Fonts API (`local` provider pointing at `@fontsource-variable/*`).

## Colour (`src/styles/tokens.css`)

Cool neutral greys (oklch, hue 260, chroma ≤ 0.005), each defined once with `light-dark()`:
`bg` → `surface-sunken` / `surface` / `surface-hover` / `surface-active`, `border` / `border-strong`,
a 1px top `highlight`, and three text steps `fg` / `muted` / `faint` (all AA).
Accent: a warm signal orange (`oklch(0.56 0.16 42)` / `oklch(0.76 0.13 52)`) for focus rings, link
hovers, the current-locale dot and the "Now" pulse. Verdicts use desaturated dots only.
A 3.5% paper grain softens the flat greys.

## Layout

Single centred column (38rem) on phones and tablets. At 70rem it becomes a rail grid:
`label 9rem | main 38rem | margin 12rem`. Section titles and post/project metadata sit sticky in the
label rail; sidenotes float into the margin. On phones the main nav detaches into a bottom dock within
thumb reach; header keeps name, language and theme.

## Motion

- One spring (`--ease-spring`, a sampled `linear()` damped spring, ~4% overshoot) for anything that moves.
- Rows: a raised panel scales in under the hovered item and covers its hairlines; press shrinks it.
- Nav thumb has a view-transition name, so it slides to the new section on navigation.
- Theme toggle: rays fold away while a shadow disc slides across the sun to leave a crescent.
- List items reveal on scroll with `animation-timeline: view()` where supported.
- Sidenotes on phones open as a card via `@starting-style`.
- All of it is off under `prefers-reduced-motion`. No JS was added outside the diagram island.

## PipelineStepper

A segmented control you tap directly (arrow keys too), with a raised thumb that springs between
stages, numbers that turn into checks once passed, a hairline progress bar and a detail line that
eases in. Back / Next (→ Start over) are 44px pills.
