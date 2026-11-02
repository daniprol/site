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
      themes: ["min-light", "vesper"],
      // Follow the site toggle (html[data-theme]) rather than the OS setting.
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      styleOverrides: {
        borderRadius: "0",
        borderWidth: "0",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "0.8125rem",
        codeLineHeight: "1.7",
        uiFontFamily: "var(--font-mono)",
        codeBackground: "var(--color-code-bg)",
        frames: {
          shadowColor: "transparent",
          editorActiveTabBackground: "var(--color-code-bg)",
          editorActiveTabForeground: "var(--color-sheet-fg)",
          editorActiveTabIndicatorTopColor: "var(--color-signal)",
          editorActiveTabIndicatorBottomColor: "transparent",
          editorTabBarBackground: "var(--color-code-bar)",
          editorTabBarBorderBottomColor: "transparent",
          terminalTitlebarBackground: "var(--color-code-bar)",
          terminalBackground: "var(--color-code-bg)",
          frameBoxShadowCssValue: "none",
        },
      },
    }),
    mdx(),
    react(),
    sitemap({
      i18n: { defaultLocale: DEFAULT_LOCALE, locales: { en: "en", es: "es", gl: "gl" } },
    }),
  ],

  // Self-hosted variable fonts from Fontsource packages (latin subset only).
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Anybody",
      cssVariable: "--font-anybody",
      fallbacks: ["Arial Narrow", "sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/anybody/files/anybody-latin-standard-normal.woff2"],
            weight: "100 900",
            stretch: "50% 150%",
            style: "normal",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Hanken Grotesk",
      cssVariable: "--font-hanken",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2"],
            weight: "100 900",
            style: "normal",
          },
          {
            src: ["@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-italic.woff2"],
            weight: "100 900",
            style: "italic",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Martian Mono",
      cssVariable: "--font-martian",
      fallbacks: ["monospace"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/martian-mono/files/martian-mono-latin-wght-normal.woff2"],
            weight: "100 800",
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
