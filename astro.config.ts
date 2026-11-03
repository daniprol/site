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
      themes: ["github-light", "github-dark-dimmed"],
      // Follow the site toggle (html[data-theme]) rather than the OS setting.
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      styleOverrides: {
        borderRadius: "0.75rem",
        borderColor: "var(--color-border)",
        codeBackground: "var(--color-code-bg)",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "0.875rem",
        codeLineHeight: "1.65",
        uiFontFamily: "var(--font-sans)",
        frames: {
          editorTabBarBackground: "var(--color-surface)",
          editorActiveTabBackground: "var(--color-code-bg)",
          editorActiveTabIndicatorTopColor: "var(--color-ball)",
          editorActiveTabIndicatorBottomColor: "transparent",
          editorTabBarBorderBottomColor: "var(--color-border)",
          terminalTitlebarBackground: "var(--color-surface)",
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

  // Self-hosted fonts from Fontsource packages (variable woff2, latin subset covers es/gl).
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Bricolage Grotesque",
      cssVariable: "--font-bricolage",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2"],
            weight: "200 800",
            style: "normal",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Figtree",
      cssVariable: "--font-figtree",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2"],
            weight: "300 900",
            style: "normal",
          },
          {
            src: ["@fontsource-variable/figtree/files/figtree-latin-wght-italic.woff2"],
            weight: "300 900",
            style: "italic",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains",
      fallbacks: ["monospace"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2"],
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
