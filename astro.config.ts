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
      themes: ["vitesse-light", "vitesse-dark"],
      // Follow the site's own toggle (html[data-theme]) rather than the OS.
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      styleOverrides: {
        borderRadius: "0",
        borderColor: "var(--color-border)",
        codeBackground: "var(--color-code)",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "0.8125rem",
        codeLineHeight: "1.75",
        uiFontFamily: "var(--font-mono)",
        uiFontSize: "0.75rem",
        frames: {
          shadowColor: "transparent",
          editorBackground: "var(--color-code)",
          editorTabBarBackground: "var(--color-bg)",
          editorTabBarBorderBottomColor: "var(--color-border)",
          editorActiveTabBackground: "var(--color-code)",
          editorActiveTabForeground: "var(--color-muted)",
          editorActiveTabIndicatorTopColor: "transparent",
          editorActiveTabIndicatorBottomColor: "var(--color-code)",
          editorActiveTabBorderColor: "var(--color-border)",
          terminalBackground: "var(--color-code)",
          terminalTitlebarBackground: "var(--color-bg)",
          terminalTitlebarBorderBottomColor: "var(--color-border)",
          terminalTitlebarForeground: "var(--color-muted)",
        },
      },
    }),
    mdx(),
    react(),
    sitemap({
      i18n: { defaultLocale: DEFAULT_LOCALE, locales: { en: "en", es: "es", gl: "gl" } },
    }),
  ],

  // Two families only: a text serif for reading, a mono for metadata.
  // Files are vendored (latin subset, OFL, all OpenType features kept: old-style figures,
  // small caps) so builds never depend on a font CDN.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Source Serif 4",
      cssVariable: "--font-source-serif",
      fallbacks: ["Georgia", "serif"],
      options: {
        variants: [
          { src: ["./src/assets/fonts/source-serif-4-roman.woff2"], weight: "300 700", style: "normal" },
          { src: ["./src/assets/fonts/source-serif-4-italic.woff2"], weight: "300 700", style: "italic" },
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
          { src: ["./src/assets/fonts/plex-mono-400.woff2"], weight: 400, style: "normal" },
          { src: ["./src/assets/fonts/plex-mono-500.woff2"], weight: 500, style: "normal" },
        ],
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
