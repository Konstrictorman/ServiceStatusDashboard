import type { z } from 'zod';
import { ErrorResponse, EventsResponse, ServicesResponse } from '@ssd/shared';

/** An error returned by the API (or a network failure), carrying the request ID for support. */
export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string;
  readonly requestId: string | null;

  constructor(
    message: string,
    opts: { status: number | null; code: string; requestId: string | null },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.requestId = opts.requestId;
  }
}

async function getJson<T extends z.ZodType>(
  url: string,
  schema: T,
  signal?: AbortSignal,
): Promise<z.infer<T>> {
  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError("Can't reach the status API", {
      status: null,
      code: 'NETWORK_ERROR',
      requestId: null,
    });
  }

  const requestId = res.headers.get('x-request-id');
  const body: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const parsed = ErrorResponse.safeParse(body);
    throw parsed.success
      ? new ApiError(parsed.data.error.message, {
          status: res.status,
          code: parsed.data.error.code,
          requestId: parsed.data.error.requestId,
        })
      : new ApiError(`Request failed with HTTP ${res.status}`, {
          status: res.status,
          code: 'HTTP_ERROR',
          requestId,
        });
  }

  // Validate the shape so a server/client mismatch fails loudly instead of rendering broken data.
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('Unexpected response from the status API', {
      status: res.status,
      code: 'INVALID_RESPONSE',
      requestId,
    });
  }
  return parsed.data;
}

export const fetchServices = (signal?: AbortSignal) =>
  getJson('/api/services', ServicesResponse, signal);

export const fetchEvents = (limit: number, signal?: AbortSignal) =>
  getJson(`/api/events?limit=${limit}`, EventsResponse, signal);
