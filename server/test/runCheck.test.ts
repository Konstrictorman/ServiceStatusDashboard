import { describe, expect, it } from 'vitest';
import { runCheck } from '../src/health/runCheck';
import type { CheckResult, HealthChecker } from '../src/health/types';

const service = { id: 'payments', name: 'Payments' };
const options = { timeoutMs: 50, degradedLatencyMs: 1_000 };
const checker = (check: HealthChecker['check']): HealthChecker => ({ check });

describe('runCheck', () => {
  it('passes a fast, successful result through unchanged', async () => {
    const ok: CheckResult = { status: 'operational', latencyMs: 42, message: null };
    await expect(
      runCheck(
        checker(async () => ok),
        service,
        options,
      ),
    ).resolves.toEqual(ok);
  });

  it('marks a slow but successful check as degraded', async () => {
    const slow = checker(async () => ({ status: 'operational', latencyMs: 1_340, message: null }));
    await expect(runCheck(slow, service, options)).resolves.toEqual({
      status: 'degraded',
      latencyMs: 1_340,
      message: 'Latency above 1000 ms',
    });
  });

  it('records a check that never answers as down and aborts it', async () => {
    let aborted = false;
    const hanging = checker(
      (_service, signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            aborted = true;
            reject(signal.reason);
          });
        }),
    );
    await expect(runCheck(hanging, service, options)).resolves.toEqual({
      status: 'down',
      latencyMs: null,
      message: 'Check timed out after 50 ms',
    });
    expect(aborted).toBe(true);
  });

  it('turns a thrown error into a down result instead of rejecting', async () => {
    const failing = checker(async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(runCheck(failing, service, options)).resolves.toEqual({
      status: 'down',
      latencyMs: null,
      message: 'Check failed: ECONNREFUSED',
    });
  });
});
