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

  // Self-hosted variable fonts from Fontsource, served and preloaded by Astro's Fonts API.
  fonts: [
    {
      name: "Anybody",
      cssVariable: "--font-anybody",
      provider: fontProviders.local(),
      fallbacks: ["Arial Black", "sans-serif"],
      options: {
        variants: [
          {
            src: ["./node_modules/@fontsource-variable/anybody/files/anybody-latin-standard-normal.woff2"],
            weight: "100 900",
            stretch: "50% 150%",
            style: "normal",
          },
        ],
      },
    },
    {
      name: "Instrument Sans",
      cssVariable: "--font-instrument-sans",
      provider: fontProviders.local(),
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            src: ["./node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2"],
            weight: "400 700",
            style: "normal",
          },
          {
            src: ["./node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-italic.woff2"],
            weight: "400 700",
            style: "italic",
          },
        ],
      },
    },
    {
      name: "Instrument Serif",
      cssVariable: "--font-instrument-serif",
      provider: fontProviders.local(),
      fallbacks: ["serif"],
      options: {
        variants: [
          {
            src: ["./node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2"],
            weight: 400,
            style: "italic",
          },
        ],
      },
    },
  ],

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
      themes: ["min-light", "vitesse-black"],
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      styleOverrides: {
        borderRadius: "0",
        borderWidth: "0",
        codeFontFamily: "ui-monospace, 'SFMono-Regular', Menlo, monospace",
        codeFontSize: "0.875rem",
        codeBackground: "var(--color-code)",
        codeLineHeight: "1.65",
        uiFontFamily: "var(--font-sans)",
        frames: {
          shadowColor: "transparent",
          editorTabBarBackground: "var(--color-ink-soft)",
          editorActiveTabBackground: "var(--color-code)",
          editorActiveTabIndicatorTopColor: "var(--issue-tone, var(--color-accent))",
          editorActiveTabIndicatorBottomColor: "transparent",
          editorTabBarBorderBottomColor: "transparent",
          terminalTitlebarBackground: "var(--color-ink-soft)",
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
