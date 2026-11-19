import type { ServiceStatus, StatusEvent } from '@ssd/shared';
import type { CheckResult } from '../health/types';

/**
 * Where check results and status-change events live. The poller writes, the routes read.
 * Async on purpose: an in-memory store today, Redis (several instances) or Postgres (history) later.
 */
export interface StatusRepository {
  /** All services, in configured order. Results older than the staleness threshold read as "unknown". */
  listServices(now: Date): Promise<ServiceStatus[]>;
  getService(id: string, now: Date): Promise<ServiceStatus | undefined>;
  /** Stores the latest result. Returns the event when the status changed, otherwise null. */
  recordResult(
    serviceId: string,
    result: CheckResult,
    checkedAt: Date,
  ): Promise<StatusEvent | null>;
  /** Most recent events first. */
  listEvents(limit: number): Promise<StatusEvent[]>;
}
