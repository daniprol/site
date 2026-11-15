# Code tour

A map of the code for someone opening it for the first time. You do not need to know Astro or TypeScript
already; the terms you will meet are explained as they come up. For how things should look, see
[DESIGN.md](../DESIGN.md); for the house rules, [CONTRIBUTING.md](../CONTRIBUTING.md).

## The big picture

The site is a set of plain HTML pages, generated ahead of time by [Astro](https://docs.astro.build) from the
files in `src/`. There is no server rendering pages on request. A few parts of a page need JavaScript in the
browser, and those come in two forms:

- **Scripts** (`<script>` in an `.astro` file, or a file in `src/scripts/`): small bits of browser code
  that enhance the HTML, such as the share panel or the swipes on a snack.
- **Islands**: React components (`.tsx`) that Astro renders to HTML at build time and then "hydrates" in
  the browser, which means React downloads and takes over that one part of the page. `client:visible` waits
  until the island scrolls into view; `client:load` starts at once. Pages without islands ship no React.

The only server code is the comments backend: a small Cloudflare Worker in `worker/` that answers `/api/*`.

```text
                      build time                                       in the browser
src/content/*.md(x) ─┐
src/pages/*.astro  ──┼─ astro build ─► dist/*.html, CSS, JS ─► Cloudflare ─► reader
src/components/... ──┘     + pagefind (search index)                ▲
                                                                     │ /api/* only
                                         worker/ (Cloudflare Worker) ┴─► GitHub Discussions
```

## Folder map

```text
astro.config.ts        Astro settings: base path, languages, fonts, Markdown (KaTeX), code blocks, env vars
wrangler.jsonc         Cloudflare settings: serve ./dist, run the Worker for /api/* only, its config values
eslint.config.js       Lint rules; .oxfmtrc.json is the formatter's config; lefthook.yml the git hooks
scripts/new.ts         `pnpm new post|snack|project "Title"`: creates a content file with frontmatter
public/                Copied to the site as is: favicons, manifest, _headers (Cloudflare response headers)
docs/                  This file

src/
  content.config.ts    The content collections and the frontmatter every file must have
  site.config.ts       Name, links, navigation, experience and education
  content/             All writing: posts/, snacks/, projects/ (and snacks/images/). No code here
  pages/               One file per route (see "Pages and languages")
  layouts/             BaseLayout (the shell of every page) and PostLayout (a post)
  components/
    ui/                Small building blocks: lists, dates, page and section headers
    site/              Header, footer, SEO tags, theme, language, search, share, the comments section
    mdx/               Components posts can use: Callout, Figure, Sidenote
    diagrams/          React islands for posts
    commits/           Everything in the Snacks section (history, entry page, compare)
    comments/          The comments island (React) and its helpers
  lib/                 Build-time data and helpers: content queries, the snacks "commits", dates, sharing
  i18n/                Languages, URL helpers and every interface string (ui.ts)
  scripts/             Browser scripts: share.ts, and commits/ for the Snacks pages
  styles/              tokens.css (colours, fonts), global.css (imports the rest), one file per area

worker/
  src/index.ts         The Worker's entry point and its list of routes
  src/contract.ts      The shapes of the comments API, shared with the island
  src/routes/          One function per route
  src/github/          Calls to GitHub: the app's token, sign-in, Discussions, Markdown
  README.md            Routes, configuration and local development of the Worker
```

## Pages and languages

Astro turns each file in `src/pages/` into one or more URLs. Square brackets are placeholders:
`snacks/[slug].astro` builds `/snacks/ghostty`, `/snacks/herdr`, and so on. A page that has placeholders
exports `getStaticPaths()`, which runs at build time and lists every URL to build (`params`) and the data
each one gets (`props`, read in the page as `Astro.props`).

Almost every page lives under `src/pages/[...locale]/`. `[...locale]` is a placeholder that may be empty, so
one file builds the English page (`/writing`, no prefix) and the Spanish and Galician ones (`/es/writing`,
`/gl/writing`). Pages without other placeholders just write `export const getStaticPaths = localeParams`.

- Interface text comes from `src/i18n/ui.ts` through `useTranslations(locale)`. Every key exists in all three
  languages; TypeScript fails the check if one is missing.
- Never write an internal link by hand: use `localePath(locale, "/writing")` for pages and `withBase("/rss.xml")`
  for files (both from `@/i18n`). They add the language prefix and the base path that the GitHub Pages copy
  needs (`/site`).
- Posts are written in English; a translation is an `es.mdx` or `gl.mdx` next to the post's `index.mdx`.
  Without one, the other languages show the English text with a notice.
- Files that are not pages (`rss.xml.ts`, `snacks/og/[slug].png.ts`) export a `GET` function that returns
  the file's contents, also at build time.

## Content

`src/content.config.ts` defines three collections (posts, snacks, projects): which folder each reads, and
a schema for its frontmatter. A file that does not match fails the build with a message saying why. Pages
never read the collections directly: they call the helpers in `src/lib/content.ts` (`getPosts`, `getSnacks`,
`getProjects`), which also hide drafts from production builds. To turn an entry into HTML, a page calls
`render(entry)` and places the returned `<Content />`.

## How a snack page is put together

The Snacks section shows short reviews as a git history. The vocabulary: a _snack_ is a content file, and a
_commit_ is a snack plus what the git look needs (number, short sha, branch, the verdict today). Verdicts map
to git: keep = merged, maybe = open, drop = reverted.

1. `src/lib/commits.ts` reads the snacks and builds the commits (`getCommits`).
2. `src/pages/[...locale]/snacks/[slug].astro` builds one page per commit and language. It composes
   components from `src/components/commits/`: `GraphStrip` (the history on its side), `TimelineComment`
   (the review and each follow-up), `DiffBlock` (pros and cons), `TimelineEvent`, `MergeBox` and `EntryNav`,
   plus `CommentsSection` and `ShareButton` from `components/site/`.
3. The styles are in `src/styles/commits/` (`entry.css` for this page; `.pr-*` classes stand for
   "pull request", `.cm-*` for the history).
4. `src/scripts/commits/setup.ts` adds the extras in the browser: keys, swipes, the picture viewer, the
   sliding strip and the "N commits behind" marks. Without JavaScript the page is still complete.
5. `src/pages/snacks/og/[slug].png.ts` draws each entry's share image with `src/lib/share-card.ts`.

The list at `/snacks` (`snacks/index.astro`) uses `TitleGraph`, `ActivityGrid` and `CommitHistory`.

## How comments work

Comments are stored in GitHub Discussions: one discussion per page, titled with the page's path without
base or language (its "term", such as `writing/how-foliq-works`), so all languages of a page share one
thread.

1. `CommentsSection.astro` renders the island `components/comments/CommentsIsland.tsx` with
   `client:visible`. Builds without the Worker set `COMMENTS=false` and render nothing.
2. In the browser, the island calls the API through `components/comments/api.ts`: `/api/session`, then
   `/api/comments?term=…`.
3. Cloudflare sends `/api/*` to the Worker (`worker/src/index.ts`), which picks the handler in
   `worker/src/routes/`. Every other URL is served straight from `dist/` without running any code.
4. The handler reads or writes the discussion with GitHub's GraphQL API (`worker/src/github/discussions.ts`).
   Signed-out reads run as the GitHub App and are kept in Cloudflare's edge cache for a minute
   (`cache.ts`); posts, reactions and signed-in reads run as the visitor.
5. Signing in is GitHub's OAuth flow (`routes/auth.ts`, `github/oauth.ts`). The visitor's token is kept in
   one encrypted cookie (`cookies.ts`, `session.ts`); there is no database.
6. `worker/src/contract.ts` holds the request and response types. The island imports them too, so the two
   sides cannot drift apart without a type error.

`worker/README.md` has the routes, the configuration and how to run the Worker locally.

## Styles

Styling is Tailwind utilities in the markup, on top of the design tokens in `src/styles/tokens.css`
(colours, fonts, motion). Larger features have their own stylesheet with a class prefix: `commits/` for
Snacks, `comments.css` (`.cx-*`), `share.css`, `prose.css` for long-form text, `dialog.css` for search.
`global.css` imports them all; their order matters. A few components keep small styles of their own in a
`<style>` block, which Astro scopes to that component.

## Common tasks

- **Write a post:** `pnpm new post "Title"`, write in `src/content/posts/<slug>/index.mdx`, then remove
  `draft: true` to publish. Interactive diagrams go in `src/components/diagrams/` and are used with
  `client:visible` (see the README).
- **Add a snack:** `pnpm new snack "Title"`, fill in the frontmatter (the comments in the template list the
  options), and put pictures in `src/content/snacks/images/`. A later change of mind goes in `updates`.
- **Add a page:** create `src/pages/[...locale]/<name>.astro` with `export const getStaticPaths = localeParams`,
  wrap it in `BaseLayout`, add its strings to `src/i18n/ui.ts` in all three languages, and add it to
  `site.nav` in `src/site.config.ts` if it belongs in the menu. Data goes in a helper in `src/lib/`.
- **Add a component:** one component per file, PascalCase, in the folder for its area. Use an Astro
  component unless it needs state in the browser; then a React island.

## Deploys and checks

- **Cloudflare Workers** builds every push (`wrangler.jsonc`): `main` is production, other branches get a
  preview URL. It serves `dist/` and runs the Worker for `/api/*`.
- **GitHub Pages** (`.github/workflows/pages.yml`) publishes `main` after CI passes, under `/site/`, with
  comments turned off. Try it locally with `SITE_BASE=/site pnpm build`.
- **CI** (`.github/workflows/ci.yml`) runs format, lint, type checks, the build and a link check. The git
  hooks run the same steps locally: formatting and lint on commit, type checks and build on push.
