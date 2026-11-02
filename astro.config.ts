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
      // Follow html[data-theme] (set by ThemeScript) instead of the OS media query.
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme="${theme.type}"]`,
      styleOverrides: {
        borderRadius: "0",
        borderWidth: "1px",
        borderColor: "var(--color-border)",
        codeBackground: "var(--color-surface)",
        codeFontFamily: "var(--font-mono)",
        codeFontSize: "0.8125rem",
        codeLineHeight: "1.7",
        uiFontFamily: "var(--font-mono)",
        frames: {
          shadowColor: "transparent",
          editorTabBarBackground: "var(--color-surface)",
          editorActiveTabBackground: "var(--color-bg)",
          editorActiveTabIndicatorTopColor: "var(--color-accent)",
          editorActiveTabIndicatorBottomColor: "transparent",
          editorTabBarBorderBottomColor: "var(--color-border)",
          terminalTitlebarBackground: "var(--color-surface)",
          terminalBackground: "var(--color-surface)",
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

  // Self-hosted variable fonts (Fontsource files, latin subset), served through the Fonts API.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Anybody",
      cssVariable: "--font-anybody",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/anybody/files/anybody-latin-standard-normal.woff2"],
            weight: "100 900",
            stretch: "50% 150%",
            style: "normal",
            display: "swap",
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Schibsted Grotesk",
      cssVariable: "--font-schibsted",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          {
            src: ["@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2"],
            weight: "400 900",
            style: "normal",
            display: "swap",
          },
          {
            src: ["@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-italic.woff2"],
            weight: "400 900",
            style: "italic",
            display: "swap",
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
            display: "swap",
          },
        ],
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
