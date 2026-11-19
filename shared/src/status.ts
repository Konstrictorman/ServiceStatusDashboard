import type { ServiceStatus, ServiceStatusValue } from './schemas';

/**
 * How bad each status is, from best to worst.
 * "unknown" ranks above "operational" (we can't confirm it's healthy, so it must not look green)
 * but below "degraded" (missing data is not proof of an outage).
 */
export const STATUS_SEVERITY: Record<ServiceStatusValue, number> = {
  operational: 0,
  unknown: 1,
  degraded: 2,
  down: 3,
};

/** Returns the worst status among the services; "unknown" when there are none. */
export function deriveOverallStatus(
  services: ReadonlyArray<Pick<ServiceStatus, 'status'>>,
): ServiceStatusValue {
  if (services.length === 0) return 'unknown';
  return services.reduce<ServiceStatusValue>(
    (worst, { status }) => (STATUS_SEVERITY[status] > STATUS_SEVERITY[worst] ? status : worst),
    'operational',
  );
}

/** Sort comparator: worst status first, then by name. Used to put problems at the top. */
export function compareBySeverity(
  a: Pick<ServiceStatus, 'status' | 'name'>,
  b: Pick<ServiceStatus, 'status' | 'name'>,
): number {
  return STATUS_SEVERITY[b.status] - STATUS_SEVERITY[a.status] || a.name.localeCompare(b.name);
}
