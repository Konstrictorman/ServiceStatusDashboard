import type { FastifyBaseLogger } from 'fastify';
import { runCheck } from './health/runCheck';
import type { HealthChecker } from './health/types';
import type { StatusRepository } from './repository/types';
import type { ServiceDefinition } from './services';

export type PollerLogger = Pick<FastifyBaseLogger, 'debug' | 'info' | 'warn' | 'error'>;

export interface PollerOptions {
  services: readonly ServiceDefinition[];
  checker: HealthChecker;
  repository: StatusRepository;
  logger: PollerLogger;
  intervalMs: number;
  timeoutMs: number;
  degradedLatencyMs: number;
  now?: () => Date;
}

/**
 * Checks every service on a fixed schedule, independent of how many dashboards are open.
 * The next round is scheduled only after the current one finishes, so rounds never overlap.
 */
export class Poller {
  private readonly options: PollerOptions;
  private readonly now: () => Date;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = true;
  private _lastCompletedAt: Date | null = null;

  constructor(options: PollerOptions) {
    this.options = options;
    this.now = options.now ?? (() => new Date());
  }

  /** When the last full round finished; used by GET /health. */
  get lastCompletedAt(): Date | null {
    return this._lastCompletedAt;
  }

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    void this.tick();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  /** One polling round: all services checked in parallel; one failure never blocks the others. */
  async runOnce(): Promise<void> {
    const { services, checker, repository, logger, timeoutMs, degradedLatencyMs } = this.options;
    const startedAt = Date.now();

    const outcomes = await Promise.allSettled(
      services.map(async (service) => {
        const result = await runCheck(checker, service, { timeoutMs, degradedLatencyMs });
        const event = await repository.recordResult(service.id, result, this.now());
        if (event) {
          const log =
            event.to === 'operational' ? logger.info.bind(logger) : logger.warn.bind(logger);
          log(
            {
              serviceId: service.id,
              from: event.from,
              to: event.to,
              latencyMs: result.latencyMs,
              reason: event.message,
            },
            `${service.id}: ${event.from} -> ${event.to}`,
          );
        }
        return result;
      }),
    );

    outcomes.forEach((outcome, i) => {
      if (outcome.status === 'rejected') {
        logger.error(
          { err: outcome.reason, serviceId: services[i]?.id },
          'failed to record check result',
        );
      }
    });

    this._lastCompletedAt = this.now();
    logger.debug({ durationMs: Date.now() - startedAt }, 'polling round completed');
  }

  private async tick(): Promise<void> {
    try {
      await this.runOnce();
    } catch (error) {
      this.options.logger.error({ err: error }, 'polling round failed');
    } finally {
      if (!this.stopped) {
        this.timer = setTimeout(() => void this.tick(), this.options.intervalMs);
      }
    }
  }
}
