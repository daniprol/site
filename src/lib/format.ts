import type { Locale } from "@/i18n";

const LOCALE_TAGS: Record<Locale, string> = { en: "en-GB", es: "es-ES", gl: "gl-ES" };

/** "20 October 2026", "20 Oct 2026", or "20 Oct" for dense lists ("day"). */
export function formatDate(date: Date, locale: Locale, style: "long" | "short" | "day" = "long"): string {
  return date.toLocaleDateString(LOCALE_TAGS[locale], {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    ...(style !== "day" && { year: "numeric" as const }),
  });
}

/** "2026-10-20", for <time datetime> and compact lists. */
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
