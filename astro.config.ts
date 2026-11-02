import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import { defineConfig, fontProviders } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { DEFAULT_LOCALE, LOCALES } from "./src/i18n/config";

export default defineConfig({
  site: "https://example.com", // TODO: replace with the real domain
  output: "static",
  trailingSlash: "ignore",

  i18n: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    routing: { prefixDefaultLocale: false },
  },

  // Swiss theme type: one grotesk for display and text, one mono for indexes and code.
  // Self-hosted latin subsets (both SIL Open Font License), so builds need no network.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Schibsted Grotesk",
      cssVariable: "--font-grotesk",
      fallbacks: ["Helvetica Neue", "Arial", "sans-serif"],
      options: {
        variants: [
          { src: ["./src/assets/fonts/schibsted-grotesk-latin-wght-normal.woff2"], weight: "400 900", style: "normal" },
          { src: ["./src/assets/fonts/schibsted-grotesk-latin-wght-italic.woff2"], weight: "400 900", style: "italic" },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "IBM Plex Mono",
      cssVariable: "--font-plex-mono",
      fallbacks: ["ui-monospace", "monospace"],
      options: {
        variants: [
          { src: ["./src/assets/fonts/ibm-plex-mono-latin-400.woff2"], weight: 400, style: "normal" },
          { src: ["./src/assets/fonts/ibm-plex-mono-latin-500.woff2"], weight: 500, style: "normal" },
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
      themes: ["min-light", "min-dark"],
      // Follow the site toggle (html[data-theme]) rather than only the OS preference.
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      styleOverrides: {
        borderRadius: "0",
        borderWidth: "0",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "0.875rem",
        codeLineHeight: "1.65",
        uiFontFamily: "var(--font-mono)",
        codeBackground: "var(--color-surface)",
        frames: {
          shadowColor: "transparent",
          frameBoxShadowCssValue: "none",
          editorTabBarBackground: "var(--color-surface)",
          editorActiveTabBackground: "var(--color-surface)",
          editorActiveTabIndicatorTopColor: "var(--color-accent)",
          editorActiveTabIndicatorBottomColor: "transparent",
          editorTabBarBorderBottomColor: "var(--color-border)",
          terminalTitlebarBackground: "var(--color-surface)",
          terminalBackground: "var(--color-surface)",
        },
      },
    }),
    mdx(),
    react(),
    sitemap({
      i18n: { defaultLocale: DEFAULT_LOCALE, locales: { en: "en", es: "es", gl: "gl" } },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
