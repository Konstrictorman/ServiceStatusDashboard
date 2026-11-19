import { describe, expect, it } from 'vitest';
import { compareBySeverity, deriveOverallStatus } from './status';
import { ServicesResponse } from './schemas';
import type { ServiceStatusValue } from './schemas';

const svc = (status: ServiceStatusValue, name: string = status) => ({ status, name });

describe('deriveOverallStatus', () => {
  it('is operational when every service is operational', () => {
    expect(deriveOverallStatus([svc('operational'), svc('operational')])).toBe('operational');
  });

  it('returns the worst status present', () => {
    expect(deriveOverallStatus([svc('operational'), svc('degraded')])).toBe('degraded');
    expect(deriveOverallStatus([svc('degraded'), svc('down'), svc('operational')])).toBe('down');
  });

  it('ranks unknown above operational but below degraded', () => {
    expect(deriveOverallStatus([svc('operational'), svc('unknown')])).toBe('unknown');
    expect(deriveOverallStatus([svc('unknown'), svc('degraded')])).toBe('degraded');
  });

  it('is unknown when there are no services', () => {
    expect(deriveOverallStatus([])).toBe('unknown');
  });
});

describe('compareBySeverity', () => {
  it('puts the worst status first, then sorts by name', () => {
    const sorted = [
      svc('operational', 'Search'),
      svc('down', 'Payments'),
      svc('operational', 'Auth'),
      svc('degraded', 'AI'),
    ].sort(compareBySeverity);
    expect(sorted.map((s) => s.name)).toEqual(['Payments', 'AI', 'Auth', 'Search']);
  });
});

describe('ServicesResponse schema', () => {
  it('accepts a valid payload', () => {
    const payload = {
      overall: 'down',
      generatedAt: '2026-11-19T14:10:05.000Z',
      services: [
        {
          id: 'payments',
          name: 'Payments',
          status: 'down',
          latencyMs: null,
          message: 'Check timed out after 2000 ms',
          lastCheckedAt: '2026-11-19T14:10:03.000Z',
        },
      ],
    };
    expect(ServicesResponse.safeParse(payload).success).toBe(true);
  });

  it('rejects an unknown status value', () => {
    const payload = {
      overall: 'broken',
      generatedAt: '2026-11-19T14:10:05.000Z',
      services: [],
    };
    expect(ServicesResponse.safeParse(payload).success).toBe(false);
  });
});
