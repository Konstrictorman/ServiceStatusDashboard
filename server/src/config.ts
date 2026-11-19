import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  /** How often the poller checks every service. */
  POLL_INTERVAL_MS: z.coerce.number().int().min(1_000).default(10_000),
  /** A check slower than this is cut off and recorded as "down". */
  CHECK_TIMEOUT_MS: z.coerce.number().int().min(100).default(2_000),
  /** A successful check slower than this is recorded as "degraded". */
  DEGRADED_LATENCY_MS: z.coerce.number().int().min(1).default(1_000),
  /** A result older than this is reported as "unknown" (e.g. the poller stopped). */
  STALE_AFTER_MS: z.coerce.number().int().min(1_000).default(30_000),
  /** How many status-change events are kept in memory. */
  EVENT_HISTORY_LIMIT: z.coerce.number().int().min(1).max(10_000).default(100),
});

export interface Config {
  nodeEnv: 'development' | 'production' | 'test';
  host: string;
  port: number;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  pollIntervalMs: number;
  checkTimeoutMs: number;
  degradedLatencyMs: number;
  staleAfterMs: number;
  eventHistoryLimit: number;
}

/** Reads configuration from environment variables, failing fast with a readable message. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid configuration:\n${z.prettifyError(parsed.error)}`);
  }
  const e = parsed.data;
  if (e.CHECK_TIMEOUT_MS >= e.POLL_INTERVAL_MS) {
    throw new Error('Invalid configuration: CHECK_TIMEOUT_MS must be lower than POLL_INTERVAL_MS');
  }
  return {
    nodeEnv: e.NODE_ENV,
    host: e.HOST,
    port: e.PORT,
    logLevel: e.LOG_LEVEL,
    pollIntervalMs: e.POLL_INTERVAL_MS,
    checkTimeoutMs: e.CHECK_TIMEOUT_MS,
    degradedLatencyMs: e.DEGRADED_LATENCY_MS,
    staleAfterMs: e.STALE_AFTER_MS,
    eventHistoryLimit: e.EVENT_HISTORY_LIMIT,
  };
}
