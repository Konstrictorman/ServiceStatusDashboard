import { z } from 'zod';

/**
 * API contract shared by the server (validates and documents responses)
 * and the web app (parses responses, so a shape mismatch fails loudly).
 */

export const ServiceStatusValue = z.enum(['operational', 'degraded', 'down', 'unknown']);
export type ServiceStatusValue = z.infer<typeof ServiceStatusValue>;

export const ServiceStatus = z.object({
  /** Stable identifier used in URLs, e.g. "payments". */
  id: z.string().min(1),
  /** Display name, e.g. "Payments". */
  name: z.string().min(1),
  status: ServiceStatusValue,
  /** Null when the check failed, timed out, or has not run yet. */
  latencyMs: z.number().nonnegative().nullable(),
  /** Human-readable detail for non-operational states, e.g. "Check timed out after 2000 ms". */
  message: z.string().nullable(),
  /** ISO timestamp of the last completed check; null before the first check. */
  lastCheckedAt: z.iso.datetime().nullable(),
});
export type ServiceStatus = z.infer<typeof ServiceStatus>;

export const StatusEvent = z.object({
  id: z.string().min(1),
  serviceId: z.string().min(1),
  serviceName: z.string().min(1),
  from: ServiceStatusValue,
  to: ServiceStatusValue,
  message: z.string().nullable(),
  occurredAt: z.iso.datetime(),
});
export type StatusEvent = z.infer<typeof StatusEvent>;

export const ServicesResponse = z.object({
  overall: ServiceStatusValue,
  services: z.array(ServiceStatus),
  generatedAt: z.iso.datetime(),
  /**
   * Server timing settings, sent so the client follows the server instead of keeping its own copy
   * (single source of truth). Results older than `staleAfterMs` must be treated as "unknown".
   */
  staleAfterMs: z.number().int().positive(),
  /** How often the server checks every service. */
  pollIntervalMs: z.number().int().positive(),
});
export type ServicesResponse = z.infer<typeof ServicesResponse>;

export const ServiceResponse = z.object({
  service: ServiceStatus,
});
export type ServiceResponse = z.infer<typeof ServiceResponse>;

export const EventsResponse = z.object({
  events: z.array(StatusEvent),
});
export type EventsResponse = z.infer<typeof EventsResponse>;

export const ErrorResponse = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string(),
  }),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;
