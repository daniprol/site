/**
 * Astro's configuration: where the site is served from, languages, fonts, Markdown/MDX processing and
 * integrations. Read by `astro dev` and `astro build`. https://docs.astro.build/en/reference/configuration-reference/
 */
import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import { defineConfig, envField, fontProviders } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { DEFAULT_LOCALE, LOCALES } from "./src/i18n/config";

export default defineConfig({
  // Cloudflare builds use the defaults. The GitHub Pages workflow sets both: SITE_URL to the Pages origin and
  // SITE_BASE to the project path ("/site"). Internal links get the base through withBase/localePath in src/i18n.
  site: process.env.SITE_URL ?? "https://example.com", // TODO: replace with the real domain
  base: process.env.SITE_BASE ?? "/",
  // Every page is rendered to an HTML file at build time; there is no server rendering.
  output: "static",
  trailingSlash: "ignore",

  // Typed environment variables. Pages import them from "astro:env/server"; a wrong value fails the build.
  env: {
    schema: {
      // Comments need the Worker's /api/*, which only the Cloudflare deploy has. The GitHub Pages build sets
      // COMMENTS=false, and pages then render no comments section at all.
      COMMENTS: envField.boolean({ context: "server", access: "public", default: true }),
    },
  },

  // Languages. English has no URL prefix; the others live under /es/ and /gl/ (see src/i18n).
  i18n: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    routing: { prefixDefaultLocale: false },
  },

  // Self-hosted from Fontsource packages: Atkinson Hyperlegible Next for text, its Mono sibling for code.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Atkinson Hyperlegible Next",
      cssVariable: "--font-atkinson",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            src: [
              "@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2",
            ],
            weight: "200 800",
            style: "normal",
          },
          {
            src: [
              "@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-italic.woff2",
            ],
            weight: "200 800",
            style: "italic",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Atkinson Hyperlegible Mono",
      cssVariable: "--font-atkinson-mono",
      fallbacks: ["ui-monospace", "monospace"],
      options: {
        variants: [
          {
            src: [
              "@fontsource-variable/atkinson-hyperlegible-mono/files/atkinson-hyperlegible-mono-latin-wght-normal.woff2",
            ],
            weight: "200 800",
            style: "normal",
          },
        ],
      },
    },
  ],

  // unified (remark/rehype) instead of the default Sätteri processor, for KaTeX math support.
  markdown: {
    processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }),
  },

  // expressiveCode must come before mdx so it can handle code blocks in MDX.
  integrations: [
    expressiveCode({
      themes: ["github-light", "github-dark"],
      // Follow the site's own toggle (html[data-theme]) rather than only the OS setting.
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      styleOverrides: {
        borderRadius: "0.5rem",
        borderColor: "var(--color-border)",
        codeBackground: "var(--color-code-bg)",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "0.875rem",
        codeLineHeight: "1.65",
        uiFontFamily: "var(--font-sans)",
        frames: {
          shadowColor: "transparent",
          editorActiveTabBackground: "var(--color-code-bg)",
          editorActiveTabIndicatorTopColor: "var(--color-accent)",
          editorActiveTabIndicatorBottomColor: "transparent",
          editorTabBarBackground: "var(--color-surface)",
          editorTabBarBorderBottomColor: "var(--color-border)",
          terminalBackground: "var(--color-code-bg)",
          terminalTitlebarBackground: "var(--color-surface)",
        },
      },
    }),
    mdx(),
    // Lets .tsx components run as islands (client:visible / client:load); pages without one ship no React.
    react(),
    sitemap({
      i18n: { defaultLocale: DEFAULT_LOCALE, locales: { en: "en", es: "es", gl: "gl" } },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    // `astro dev` has no Worker: send /api/* to `wrangler dev` (pnpm preview) on its default port.
    server: { proxy: { "/api": "http://localhost:8787" } },
  },
});
