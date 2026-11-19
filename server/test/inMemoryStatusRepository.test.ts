import { describe, expect, it } from 'vitest';
import type { CheckResult } from '../src/health/types';
import { InMemoryStatusRepository } from '../src/repository/inMemoryStatusRepository';

const services = [
  { id: 'payments', name: 'Payments' },
  { id: 'ai', name: 'AI' },
];
const t0 = new Date('2026-11-19T14:00:00.000Z');
const at = (seconds: number) => new Date(t0.getTime() + seconds * 1_000);
const ok: CheckResult = { status: 'operational', latencyMs: 50, message: null };
const down: CheckResult = {
  status: 'down',
  latencyMs: null,
  message: 'Check timed out after 2000 ms',
};

const makeRepo = (eventHistoryLimit = 100) =>
  new InMemoryStatusRepository({ services, staleAfterMs: 30_000, eventHistoryLimit });

describe('InMemoryStatusRepository', () => {
  it('reports every service as unknown before the first check', async () => {
    const [payments] = await makeRepo().listServices(t0);
    expect(payments).toMatchObject({
      id: 'payments',
      status: 'unknown',
      message: 'Waiting for first check',
      lastCheckedAt: null,
    });
  });

  it('returns the latest result while it is fresh', async () => {
    const repo = makeRepo();
    await repo.recordResult('payments', ok, t0);
    expect(await repo.getService('payments', at(10))).toMatchObject({
      status: 'operational',
      latencyMs: 50,
      lastCheckedAt: t0.toISOString(),
    });
  });

  it('reports a stale result as unknown, never as its last known status', async () => {
    const repo = makeRepo();
    await repo.recordResult('payments', ok, t0);
    expect(await repo.getService('payments', at(31))).toMatchObject({
      status: 'unknown',
      latencyMs: null,
      message: 'No check in the last 30 s',
      lastCheckedAt: t0.toISOString(),
    });
  });

  it('records an event only when the status changes', async () => {
    const repo = makeRepo();
    expect(await repo.recordResult('payments', ok, at(0))).toBeNull(); // baseline
    expect(await repo.recordResult('payments', ok, at(10))).toBeNull(); // unchanged
    const event = await repo.recordResult('payments', down, at(20));
    expect(event).toMatchObject({
      serviceId: 'payments',
      serviceName: 'Payments',
      from: 'operational',
      to: 'down',
      message: 'Check timed out after 2000 ms',
      occurredAt: at(20).toISOString(),
    });
    const recovery = await repo.recordResult('payments', ok, at(30));
    expect(recovery).toMatchObject({ from: 'down', to: 'operational', message: 'Recovered' });
  });

  it('lists events newest first and keeps only the configured number', async () => {
    const repo = makeRepo(3);
    await repo.recordResult('payments', ok, at(0));
    for (let i = 1; i <= 5; i++) {
      await repo.recordResult('payments', i % 2 ? down : ok, at(i * 10));
    }
    const events = await repo.listEvents(10);
    expect(events).toHaveLength(3);
    expect(events.map((e) => e.occurredAt)).toEqual(
      [at(50), at(40), at(30)].map((d) => d.toISOString()),
    );
    expect(await repo.listEvents(1)).toHaveLength(1);
  });

  it('rejects results for services it does not know', async () => {
    await expect(makeRepo().recordResult('nope', ok, t0)).rejects.toThrow('Unknown service "nope"');
  });
});
