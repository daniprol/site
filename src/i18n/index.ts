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

/** Builds a URL path for `locale`. English paths have no prefix: localePath("es", "/writing") -> "/es/writing". */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}/` : `/${locale}${clean}`;
}

/** Removes a locale prefix from a pathname: "/es/writing" -> "/writing". */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  return isLocale(first) ? `/${rest.join("/")}` : pathname;
}

/** Static paths for the `[...locale]` route segment: undefined is English. */
export function localeParams() {
  return LOCALES.map((locale) => ({
    params: { locale: locale === DEFAULT_LOCALE ? undefined : locale },
    props: { locale },
  }));
}
