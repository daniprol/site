# Contributing

- **Branches:** work on a branch and open a PR; Cloudflare posts a preview URL on each one.
- **Hooks:** pre-commit formats and lints staged files; pre-push type-checks and builds. Don't skip them.
- **Content:** use `pnpm new`. Frontmatter is validated at build time, so a typo fails the build with a clear message.
- **Styling:** use Tailwind utilities and the tokens in `src/styles/tokens.css`. Add a token before adding a raw colour or font.
- **Components:** one component per file, PascalCase names, no barrel files. Keep pages thin: data comes from `src/lib/`.
- **JavaScript:** default to zero. Use an Astro component unless something needs state; then a React island with `client:visible`.
