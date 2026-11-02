import type { Locale } from "@/i18n";

const LOCALE_TAGS: Record<Locale, string> = { en: "en-GB", es: "es-ES", gl: "gl-ES" };

/** "20 Oct 2026" */
export function formatDate(date: Date, locale: Locale, style: "long" | "short" = "long"): string {
  return date.toLocaleDateString(LOCALE_TAGS[locale], {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  });
}

/** "2026-10-20", for <time datetime> and compact lists. */
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
