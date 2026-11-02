/** Languages the site is available in. English is the default and has no URL prefix. */
export const LOCALES = ["en", "es", "gl"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  gl: "Galego",
};
