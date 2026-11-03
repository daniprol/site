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
      themes: ["github-light", "nord"],
      // Follow the site toggle (html[data-theme]) instead of the OS setting.
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      styleOverrides: {
        borderRadius: "0.375rem",
        borderColor: "var(--color-border)",
        codeBackground: "var(--color-surface)",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "0.875rem",
        codeLineHeight: "1.65",
        uiFontFamily: "var(--font-sans)",
        frames: {
          shadowColor: "transparent",
          editorTabBarBackground: "var(--color-surface)",
          editorActiveTabBackground: "var(--color-bg)",
          editorActiveTabIndicatorTopColor: "var(--color-accent)",
          editorActiveTabForeground: "var(--color-fg)",
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

  // Self-hosted from Fontsource packages; no third-party requests.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Literata",
      cssVariable: "--font-literata",
      fallbacks: ["Georgia", "serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/literata/files/literata-latin-opsz-normal.woff2"],
            weight: "200 900",
            style: "normal",
          },
          {
            src: ["@fontsource-variable/literata/files/literata-latin-opsz-italic.woff2"],
            weight: "200 900",
            style: "italic",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Schibsted Grotesk",
      cssVariable: "--font-schibsted",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2"],
            weight: "400 900",
            style: "normal",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Fragment Mono",
      cssVariable: "--font-fragment",
      fallbacks: ["ui-monospace", "monospace"],
      options: {
        variants: [
          {
            src: ["@fontsource/fragment-mono/files/fragment-mono-latin-400-normal.woff2"],
            weight: "400",
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
