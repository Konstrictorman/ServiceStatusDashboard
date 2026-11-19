import { describe, expect, it } from 'vitest';
import type { ServicesResponse } from '@ssd/shared';
import { isClientStale, markAllUnknown } from './stale';
import { summarize } from './status';
import { formatRelative } from './time';

describe('summarize', () => {
  it('counts operational services when everything is fine', () => {
    expect(summarize([{ status: 'operational' }, { status: 'operational' }])).toBe(
      '2 of 2 services operational',
    );
  });
  it('lists the problems', () => {
    expect(summarize([{ status: 'down' }, { status: 'degraded' }, { status: 'operational' }])).toBe(
      '1 service down, 1 degraded',
    );
    expect(summarize([{ status: 'down' }, { status: 'down' }, { status: 'unknown' }])).toBe(
      '2 services down, 1 unknown',
    );
  });
});

describe('formatRelative', () => {
  const now = Date.parse('2026-11-19T14:10:00Z');
  it.each([
    ['2026-11-19T14:10:00Z', 'just now'],
    ['2026-11-19T14:09:56Z', '4s ago'],
    ['2026-11-19T14:08:00Z', '2m ago'],
    ['2026-11-19T11:10:00Z', '3h ago'],
  ])('formats %s as "%s"', (from, expected) => {
    expect(formatRelative(from, now)).toBe(expected);
  });
});

describe('client staleness', () => {
  const now = 100_000;
  const staleAfterMs = 30_000;
  it('trusts cached data while refreshes succeed or the data is recent', () => {
    expect(isClientStale({ isError: false, updatedAt: 1, now, staleAfterMs })).toBe(false);
    expect(isClientStale({ isError: true, updatedAt: now - 10_000, now, staleAfterMs })).toBe(
      false,
    );
  });
  it('distrusts cached data once failed refreshes outlast the server-provided threshold', () => {
    expect(isClientStale({ isError: true, updatedAt: now - 31_000, now, staleAfterMs })).toBe(true);
    expect(
      isClientStale({ isError: true, updatedAt: now - 11_000, now, staleAfterMs: 10_000 }),
    ).toBe(true);
  });
  it('marks every service unknown', () => {
    const data: ServicesResponse = {
      overall: 'operational',
      generatedAt: '2026-11-19T14:10:00.000Z',
      staleAfterMs: 30_000,
      pollIntervalMs: 10_000,
      services: [
        {
          id: 'ai',
          name: 'AI',
          status: 'operational',
          latencyMs: 400,
          message: null,
          lastCheckedAt: null,
        },
      ],
    };
    expect(markAllUnknown(data)).toMatchObject({
      overall: 'unknown',
      services: [{ id: 'ai', status: 'unknown', latencyMs: null, message: 'Data is stale' }],
    });
  });
});
