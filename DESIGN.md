# Instrument

The site is read like the datasheet of a well-made instrument: labelled panels, hairline rules, every
value aligned to a column, one signal colour that only lights up when something is active or worth a look.
Precise, not cold — the About page drops the apparatus and speaks in first person.

## Type

- **Geist** (variable) for reading text and titles. Body 17px / 1.65.
- **Geist Mono** (variable) for everything that is data: labels, dates, indices, kinds, verdicts, code.
- Scale: label 12px mono caps (+0.08em) · data 13px mono · body 17px · h2 22px · h1 30→44px. Titles at -0.02em.

Both self-hosted from `@fontsource-variable/*` via Astro's Fonts API (local provider, latin subset) — no network at build.

## Colour (tokens.css, `light-dark()`)

| token                  | light                | dark                | use                          |
| ---------------------- | -------------------- | ------------------- | ---------------------------- |
| `bg`                   | warm paper 0.982     | graphite 0.165      | page                         |
| `surface`              | 0.958                | 0.198               | panels, hover rows           |
| `fg` / `muted`         | 0.21 / 0.47          | 0.93 / 0.71         | text                         |
| `rule` / `rule-strong` | 0.885 / 0.74         | 0.29 / 0.42         | hairlines, frames            |
| `signal`               | orange 0.555 0.19 40 | orange 0.75 0.16 55 | active, links, keep, diagram |

One accent only. AA checked for text on both backgrounds.

## Grid

Mobile first, 20px gutters. From 64rem: a 3-track page grid — **rail** (11rem, section index + label),
**content** (≤ 42rem), **margin** (sidenotes, figure notes). Everything snaps to the rail line.

## Motion

120–180ms, `cubic-bezier(0.2, 0, 0, 1)` (fast attack, hard stop). Row hover slides a 2px signal tick in;
arrows step 3px. View transitions cross-fade the page body only. All off under `prefers-reduced-motion`.

## Signature details

1. **Ruler strip** under the header: a CSS tick scale; the active nav cell's signal bar sits on it. On phones the nav is a 4-cell segmented panel.
2. **Indexed sections**: `01 — Latest writing`, numbered like a spec sheet; posts number their `h2`s.
3. **Snacks as a datasheet**: date · kind · item · verdict, verdict shown as a status lamp (■ keep, ◧ maybe, □ drop).
4. **Figures with crop marks** and a `FIG. 01` plate; diagrams drawn as schematics with a readout panel.
5. **Spec plate** on the home page (role, base with coordinates, now) and a build revision stamp in the footer.
