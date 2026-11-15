// ESLint configuration (`pnpm lint`). Later blocks add to or override earlier ones for the files they match.
import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist/", ".astro/", ".wrangler/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  ...astro.configs["flat/recommended"],
  ...astro.configs["flat/jsx-a11y-strict"],
  // Site code runs in the browser.
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
  },
  // React islands: the rules of hooks and accessibility checks for JSX.
  {
    files: ["src/components/diagrams/**/*.tsx", "src/components/comments/**/*.tsx"],
    plugins: { "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
  // The comments Worker runs on Cloudflare, which has service-worker globals rather than the DOM.
  {
    files: ["worker/**/*.ts"],
    languageOptions: { globals: globals.serviceworker },
  },
  // Build scripts and config files run in Node.
  {
    files: ["scripts/**", "*.config.{js,ts}"],
    languageOptions: { globals: globals.node },
  },
);
