/** A short message shown at the bottom of the screen that hides itself after a few seconds. */
import { useEffect, useState } from "react";

const NOTICE_DURATION_MS = 5000;

/** Returns the current notice (or null) and a function to show a new one. */
export function useNotice() {
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);
  return [notice, setNotice] as const;
}
