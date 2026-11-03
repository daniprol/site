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
import { arousaDark, arousaLight } from "./src/styles/code-themes";

/** Fontsource files, self-hosted through Astro's Fonts API. Latin covers en, es and gl. */
const fontsource = (pkg: string, file: string) => `./node_modules/@fontsource-variable/${pkg}/files/${file}.woff2`;

export default defineConfig({
  site: "https://example.com", // TODO: replace with the real domain
  output: "static",
  trailingSlash: "ignore",

  i18n: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    routing: { prefixDefaultLocale: false },
  },

  fonts: [
    {
      provider: fontProviders.local(),
      name: "Schibsted Grotesk",
      cssVariable: "--font-schibsted",
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
      options: {
        variants: [
          {
            src: [fontsource("schibsted-grotesk", "schibsted-grotesk-latin-wght-normal")],
            weight: "400 900",
            style: "normal",
          },
          {
            src: [fontsource("schibsted-grotesk", "schibsted-grotesk-latin-wght-italic")],
            weight: "400 900",
            style: "italic",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Recursive Mono",
      cssVariable: "--font-recursive",
      fallbacks: ["ui-monospace", "monospace"],
      options: {
        variants: [
          { src: [fontsource("recursive", "recursive-latin-mono-normal")], weight: "300 1000", style: "normal" },
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
      themes: [arousaLight, arousaDark],
      // ThemeScript always sets html[data-theme], so the toggle (not the OS) decides.
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
      styleOverrides: {
        borderRadius: "6px",
        borderColor: "var(--color-border)",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "0.875rem",
        codeLineHeight: "1.65",
        uiFontFamily: "var(--font-mono)",
        uiFontSize: "0.75rem",
        frames: {
          shadowColor: "transparent",
          frameBoxShadowCssValue: "none",
          editorTabBarBackground: "var(--color-surface)",
          editorTabBarBorderBottomColor: "var(--color-border)",
          editorActiveTabBackground: "var(--color-bg)",
          editorActiveTabForeground: "var(--color-fg)",
          editorActiveTabIndicatorTopColor: "var(--color-accent)",
          editorActiveTabIndicatorBottomColor: "transparent",
          terminalTitlebarBackground: "var(--color-surface)",
          terminalTitlebarBorderBottomColor: "var(--color-border)",
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
