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
      themes: ["min-light", "min-dark"],
      // Follow html[data-theme] (set by ThemeScript) instead of the OS media query.
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      styleOverrides: {
        borderRadius: "0.75rem",
        borderColor: "var(--color-border)",
        borderWidth: "1px",
        codeBackground: "var(--color-surface)",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "0.8125rem",
        codeLineHeight: "1.7",
        uiFontFamily: "var(--font-sans)",
        uiFontSize: "0.75rem",
        focusBorder: "var(--color-accent)",
        scrollbarThumbColor: "var(--color-border-strong)",
        frames: {
          frameBoxShadowCssValue: "none",
          editorBackground: "var(--color-surface)",
          editorTabBarBackground: "var(--color-surface-sunken)",
          editorActiveTabBackground: "var(--color-surface)",
          editorActiveTabForeground: "var(--color-fg)",
          editorActiveTabIndicatorTopColor: "transparent",
          editorActiveTabIndicatorBottomColor: "var(--color-surface)",
          editorTabBarBorderBottomColor: "var(--color-border)",
          editorTabBorderRadius: "0",
          terminalBackground: "var(--color-surface)",
          terminalTitlebarBackground: "var(--color-surface-sunken)",
          terminalTitlebarBorderBottomColor: "var(--color-border)",
          inlineButtonBorder: "var(--color-border-strong)",
          inlineButtonForeground: "var(--color-muted)",
          tooltipSuccessBackground: "var(--color-fg)",
          tooltipSuccessForeground: "var(--color-bg)",
        },
      },
    }),
    mdx(),
    react(),
    sitemap({
      i18n: { defaultLocale: DEFAULT_LOCALE, locales: { en: "en", es: "es", gl: "gl" } },
    }),
  ],

  // Inter for everything readable (its opsz axis gives display cuts at large sizes), Geist Mono for code and
  // metadata. Latin subsets cover en, es and gl; files come from the installed @fontsource-variable packages,
  // so builds need no font CDN.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Inter",
      cssVariable: "--font-inter",
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2"],
            weight: "100 900",
            style: "normal",
          },
          {
            src: ["@fontsource-variable/inter/files/inter-latin-opsz-italic.woff2"],
            weight: "100 900",
            style: "italic",
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
