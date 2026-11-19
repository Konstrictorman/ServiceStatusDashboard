import type { ServiceDefinition } from '../services';

/** Statuses a check can produce. "unknown" is never produced by a check; it is derived from staleness. */
export type CheckStatus = 'operational' | 'degraded' | 'down';

export interface CheckResult {
  status: CheckStatus;
  /** Null when the check failed or timed out. */
  latencyMs: number | null;
  message: string | null;
}

/**
 * Checks one service. Implementations must stop work when `signal` aborts (the caller enforces a
 * timeout). Swap the simulator for an HTTP implementation without touching the poller or routes.
 */
export interface HealthChecker {
  check(service: ServiceDefinition, signal: AbortSignal): Promise<CheckResult>;
}
