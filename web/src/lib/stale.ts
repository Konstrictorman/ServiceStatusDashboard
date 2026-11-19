import type { ServicesResponse } from '@ssd/shared';

/** After this long without a successful refresh, cached data is no longer trusted. Matches the server. */
export const CLIENT_STALE_AFTER_MS = 30_000;

export function isClientStale(opts: { isError: boolean; updatedAt: number; now: number }): boolean {
  return opts.isError && opts.updatedAt > 0 && opts.now - opts.updatedAt > CLIENT_STALE_AFTER_MS;
}

/**
 * When the API can't be reached, the browser still holds the last response. Once that is too old,
 * show every service as "unknown" rather than a possibly outdated green.
 */
export function markAllUnknown(data: ServicesResponse): ServicesResponse {
  return {
    ...data,
    overall: 'unknown',
    services: data.services.map((s) => ({
      ...s,
      status: 'unknown',
      latencyMs: null,
      message: 'Data is stale',
    })),
  };
}
