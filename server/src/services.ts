export interface ServiceDefinition {
  /** Stable identifier used in URLs, e.g. "payments". */
  id: string;
  /** Display name, e.g. "Payments". */
  name: string;
}

/** The monitored services. In production this would come from a service catalog or config file. */
export const SERVICES: readonly ServiceDefinition[] = [
  { id: 'authentication', name: 'Authentication' },
  { id: 'payments', name: 'Payments' },
  { id: 'notifications', name: 'Notifications' },
  { id: 'search', name: 'Search' },
  { id: 'ai', name: 'AI' },
];
