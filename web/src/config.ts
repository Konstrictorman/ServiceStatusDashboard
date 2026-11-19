import { z } from 'zod';

const DEFAULT_REFRESH_INTERVAL_MS = 15_000;

const RefreshInterval = z.coerce
  .number()
  .int()
  .min(1_000)
  .max(10 * 60_000);

/**
 * Reads VITE_REFRESH_INTERVAL_MS (set at dev/build time, e.g. `VITE_REFRESH_INTERVAL_MS=5000 npm run dev`).
 * An invalid value falls back to the default with a console warning rather than breaking the page.
 */
export function parseRefreshInterval(raw: string | undefined): number {
  if (raw === undefined || raw === '') return DEFAULT_REFRESH_INTERVAL_MS;
  const parsed = RefreshInterval.safeParse(raw);
  if (parsed.success) return parsed.data;
  console.warn(
    `Ignoring invalid VITE_REFRESH_INTERVAL_MS="${raw}" (expected 1000–600000 ms); using ${DEFAULT_REFRESH_INTERVAL_MS} ms.`,
  );
  return DEFAULT_REFRESH_INTERVAL_MS;
}

export const REFRESH_INTERVAL_MS = parseRefreshInterval(import.meta.env.VITE_REFRESH_INTERVAL_MS);
