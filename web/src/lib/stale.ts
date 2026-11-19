import type { ServicesResponse } from '@ssd/shared';

/**
 * Whether the browser should stop trusting the data it holds. Only when refreshes are failing:
 * the server already applies staleness to the results it sends. `staleAfterMs` comes from the
 * server's response, so client and server always use the same threshold.
 */
export function isClientStale(opts: {
  isError: boolean;
  updatedAt: number;
  now: number;
  staleAfterMs: number;
}): boolean {
  return opts.isError && opts.updatedAt > 0 && opts.now - opts.updatedAt > opts.staleAfterMs;
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
