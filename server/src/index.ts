import { buildApp } from './app';
import { loadConfig } from './config';
import { SimulatedHealthChecker } from './health/simulatedHealthChecker';
import { Poller } from './poller';
import { InMemoryStatusRepository } from './repository/inMemoryStatusRepository';
import { SERVICES } from './services';

const config = loadConfig();

const repository = new InMemoryStatusRepository({
  services: SERVICES,
  staleAfterMs: config.staleAfterMs,
  eventHistoryLimit: config.eventHistoryLimit,
});

const app = buildApp({
  repository,
  staleAfterMs: config.staleAfterMs,
  // Called per request, after `poller` below is initialized.
  getLastPollAt: () => poller.lastCompletedAt,
  logger: {
    level: config.logLevel,
    // Readable logs locally; raw JSON (for log tooling) everywhere else.
    ...(config.nodeEnv === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
          },
        }
      : {}),
  },
});

const poller = new Poller({
  services: SERVICES,
  checker: new SimulatedHealthChecker(),
  repository,
  logger: app.log.child({ component: 'poller' }),
  intervalMs: config.pollIntervalMs,
  timeoutMs: config.checkTimeoutMs,
  degradedLatencyMs: config.degradedLatencyMs,
});

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'shutting down');
  poller.stop();
  await app.close();
  process.exit(0);
};
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

try {
  await app.listen({ host: config.host, port: config.port });
  poller.start();
  app.log.info(
    {
      services: SERVICES.length,
      pollIntervalMs: config.pollIntervalMs,
      checkTimeoutMs: config.checkTimeoutMs,
      staleAfterMs: config.staleAfterMs,
    },
    'status poller started',
  );
} catch (error) {
  app.log.fatal({ err: error }, 'failed to start');
  process.exit(1);
}
