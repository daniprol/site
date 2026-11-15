/** "3 days ago", in the page's language, with the full date for the tooltip. */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 days ago" (or "in 2 hours"), using the largest unit that fits. */
export function timeAgo(iso: string, localeTag: string, now = Date.now()): string {
  const seconds = (Date.parse(iso) - now) / 1000;
  const format = new Intl.RelativeTimeFormat(localeTag, { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(0, "minute");
}

/** "15 November 2026 at 10:30", for the tooltip on the relative time. */
export const fullDate = (iso: string, localeTag: string) =>
  new Date(iso).toLocaleString(localeTag, { dateStyle: "long", timeStyle: "short" });
