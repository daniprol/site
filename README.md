# site

Personal site, blog and portfolio of Daniel Prol. Built with [Astro](https://astro.build), fully static, deployed to Cloudflare.

## Quick start

```sh
pnpm install     # also installs git hooks
pnpm dev         # http://localhost:4321
```

Requires Node 24 (see `.node-version`) and pnpm 11 (`corepack enable`).

## Scripts

| Command                                 | What it does                                             |
| --------------------------------------- | -------------------------------------------------------- |
| `pnpm dev`                              | Dev server with drafts visible                           |
| `pnpm build`                            | Static build to `dist/`, then the Pagefind search index  |
| `pnpm preview`                          | Serve `dist/` with Wrangler, as Cloudflare will          |
| `pnpm check`                            | Type-check `.astro`, `.ts` and `.tsx`                    |
| `pnpm lint` / `lint:fix`                | ESLint (TypeScript, Astro, React hooks, a11y)            |
| `pnpm format` / `format:check`          | oxfmt, including `.astro` files and Tailwind class order |
| `pnpm new post\|snack\|project "Title"` | Create a content file with frontmatter                   |

## Where things live

```text
src/
  content.config.ts     Schemas for every collection (posts, snacks, projects)
  site.config.ts        Name, links, nav, experience, education
  content/              All writing. No layout code here.
    posts/<slug>/index.mdx   A post; translations sit next to it as es.mdx / gl.mdx
    snacks/<date>-<slug>.md  One short review per file
    projects/<slug>.md       One case study per file
  pages/[...locale]/    Routes. One file serves /, /es/ and /gl/
  layouts/              BaseLayout (page shell), PostLayout
  components/
    ui/                 Small building blocks: lists, dates, sections
    site/               Header, Footer, theme and language switchers, SEO
    mdx/                Components posts may use: Sidenote, Figure
    diagrams/           Interactive React islands for posts
  lib/                  Content queries and formatting. Pages never call getCollection directly.
  i18n/                 Locales and interface strings
  styles/               tokens.css (the theme), global.css, prose.css
```

## Languages

English is the default and has no URL prefix; Spanish lives under `/es/` and Galician under `/gl/`.
Interface strings are translated in `src/i18n/ui.ts`. Posts are written in English; to translate one, add `es.mdx` or `gl.mdx` next to its `index.mdx` with `lang: es`. Untranslated posts show the English text with a notice, and point search engines at the English URL.

## Interactive components

Diagrams are React components in `src/components/diagrams/`. Import them in MDX and always add `client:visible`, so React only downloads when the diagram scrolls into view:

```mdx
import PipelineStepper from "@/components/diagrams/PipelineStepper.tsx";

<PipelineStepper client:visible />
```

Pages without islands ship no React at all.
