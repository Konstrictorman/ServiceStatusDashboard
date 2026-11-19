import type { ServiceDefinition } from '../services';
import type { CheckResult, HealthChecker } from './types';

export interface RunCheckOptions {
  timeoutMs: number;
  degradedLatencyMs: number;
}

/**
 * Runs one check with a hard timeout and normalizes every outcome into a CheckResult:
 * - too slow to answer      -> "down" (timed out), and the check is aborted
 * - throws                  -> "down" (check failed)
 * - answers, but slowly     -> "degraded"
 * Never rejects, so one bad service can't break a polling round.
 */
export async function runCheck(
  checker: HealthChecker,
  service: ServiceDefinition,
  { timeoutMs, degradedLatencyMs }: RunCheckOptions,
): Promise<CheckResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<CheckResult>((resolve) => {
    timer = setTimeout(() => {
      resolve({
        status: 'down',
        latencyMs: null,
        message: `Check timed out after ${timeoutMs} ms`,
      });
      controller.abort(new Error(`Timed out after ${timeoutMs} ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([checker.check(service, controller.signal), timeout]);
    return classifyLatency(result, degradedLatencyMs);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { status: 'down', latencyMs: null, message: `Check failed: ${reason}` };
  } finally {
    clearTimeout(timer);
  }
}

function classifyLatency(result: CheckResult, degradedLatencyMs: number): CheckResult {
  if (
    result.status === 'operational' &&
    result.latencyMs !== null &&
    result.latencyMs > degradedLatencyMs
  ) {
    return { ...result, status: 'degraded', message: `Latency above ${degradedLatencyMs} ms` };
  }
  return result;
}
