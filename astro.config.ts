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

  // unified (remark/rehype) instead of the default Sätteri processor, for KaTeX math support.
  markdown: {
    processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }),
  },

  // expressiveCode must come before mdx so it can handle code blocks in MDX.
  integrations: [
    expressiveCode({
      themes: ["github-light", "github-dark"],
      // Follow the site's own toggle (html[data-theme]) instead of the OS setting.
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      styleOverrides: {
        borderRadius: "0",
        borderColor: "var(--color-rule)",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "0.875rem",
        codeLineHeight: "1.65",
        uiFontFamily: "var(--font-mono)",
        uiFontSize: "0.75rem",
        codeBackground: "var(--color-surface)",
        frames: {
          shadowColor: "transparent",
          frameBoxShadowCssValue: "none",
          editorActiveTabBackground: "var(--color-surface)",
          editorActiveTabIndicatorTopColor: "var(--color-signal)",
          editorActiveTabIndicatorBottomColor: "transparent",
          editorTabBarBackground: "var(--color-bg)",
          editorTabBarBorderBottomColor: "var(--color-rule)",
          terminalBackground: "var(--color-surface)",
          terminalTitlebarBackground: "var(--color-bg)",
          terminalTitlebarBorderBottomColor: "var(--color-rule)",
        },
      },
    }),
    mdx(),
    react(),
    sitemap({
      i18n: { defaultLocale: DEFAULT_LOCALE, locales: { en: "en", es: "es", gl: "gl" } },
    }),
  ],

  // Geist for reading, Geist Mono for data: variable fonts from local @fontsource packages,
  // so the build never needs the network. The latin subset covers en, es and gl.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Geist",
      cssVariable: "--font-geist",
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/geist/files/geist-latin-wght-normal.woff2"],
            weight: "100 900",
            style: "normal",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Geist Mono",
      cssVariable: "--font-geist-mono",
      fallbacks: ["ui-monospace", "monospace"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2"],
            weight: "100 900",
            style: "normal",
          },
        ],
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
