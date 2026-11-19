import { describe, expect, it, vi } from 'vitest';
import type { HealthChecker } from '../src/health/types';
import { Poller, type PollerLogger } from '../src/poller';
import { InMemoryStatusRepository } from '../src/repository/inMemoryStatusRepository';
import type { StatusRepository } from '../src/repository/types';

const services = [
  { id: 'payments', name: 'Payments' },
  { id: 'ai', name: 'AI' },
];
const makeLogger = () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });

const makePoller = (
  checker: HealthChecker,
  repository: StatusRepository,
  logger = makeLogger(),
) => ({
  logger,
  poller: new Poller({
    services,
    checker,
    repository,
    logger: logger as unknown as PollerLogger,
    intervalMs: 10_000,
    timeoutMs: 50,
    degradedLatencyMs: 1_000,
  }),
});

describe('Poller', () => {
  it('checks every service and logs status changes as warnings', async () => {
    const repository = new InMemoryStatusRepository({
      services,
      staleAfterMs: 30_000,
      eventHistoryLimit: 100,
    });
    let paymentsUp = true;
    const checker: HealthChecker = {
      check: async (service) =>
        service.id === 'payments' && !paymentsUp
          ? { status: 'down', latencyMs: null, message: 'Health endpoint returned HTTP 503' }
          : { status: 'operational', latencyMs: 30, message: null },
    };
    const { poller, logger } = makePoller(checker, repository);

    await poller.runOnce();
    const first = await repository.listServices(new Date());
    expect(first.map((s) => s.status)).toEqual(['operational', 'operational']);
    expect(poller.lastCompletedAt).toBeInstanceOf(Date);

    paymentsUp = false;
    await poller.runOnce();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ serviceId: 'payments', from: 'operational', to: 'down' }),
      'payments: operational -> down',
    );
    expect((await repository.listEvents(10))[0]).toMatchObject({
      serviceId: 'payments',
      to: 'down',
    });
  });

  it('keeps going when storing one result fails', async () => {
    const recorded: string[] = [];
    const repository = {
      recordResult: async (serviceId: string) => {
        if (serviceId === 'payments') throw new Error('disk full');
        recorded.push(serviceId);
        return null;
      },
    } as unknown as StatusRepository;
    const checker: HealthChecker = {
      check: async () => ({ status: 'operational', latencyMs: 10, message: null }),
    };
    const { poller, logger } = makePoller(checker, repository);

    await poller.runOnce();
    expect(recorded).toEqual(['ai']);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ serviceId: 'payments' }),
      'failed to record check result',
    );
  });
});
