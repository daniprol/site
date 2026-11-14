import { DEFAULT_LOCALE, LOCALES, type Locale } from "./config";
import { ui, type UIKey } from "./ui";

export { DEFAULT_LOCALE, LOCALES, LOCALE_NAMES, type Locale } from "./config";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Returns a translator bound to `locale`. Use `{name}` placeholders for values. */
export function useTranslations(locale: Locale) {
  return (key: UIKey, values: Record<string, string | number> = {}) =>
    Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, String(value)), ui[locale][key]);
}

/**
 * The path the site is served under, without a trailing slash: "" on Cloudflare, "/site" on GitHub Pages.
 * Set at build time with SITE_BASE (see astro.config.ts). Every internal link must go through withBase or localePath.
 */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Prefixes a root-relative path with the base: withBase("/rss.xml") -> "/site/rss.xml" on GitHub Pages. */
export function withBase(path = "/"): string {
  return `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Removes the base from a pathname: "/site/writing" -> "/writing". */
export function stripBase(pathname: string): string {
  if (!BASE || !pathname.startsWith(BASE)) return pathname;
  return pathname.slice(BASE.length) || "/";
}

/** Builds a URL path for `locale`, base included. English paths have no prefix: localePath("es", "/writing") -> "/es/writing". */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return withBase(clean);
  return withBase(clean === "/" ? `/${locale}/` : `/${locale}${clean}`);
}

/** Removes the base and any locale prefix from a pathname: "/site/es/writing" -> "/writing". */
export function stripLocale(pathname: string): string {
  const path = stripBase(pathname);
  const [, first, ...rest] = path.split("/");
  return isLocale(first) ? `/${rest.join("/")}` : path;
}

/** Static paths for the `[...locale]` route segment: undefined is English. */
export function localeParams() {
  return LOCALES.map((locale) => ({
    params: { locale: locale === DEFAULT_LOCALE ? undefined : locale },
    props: { locale },
  }));
}
