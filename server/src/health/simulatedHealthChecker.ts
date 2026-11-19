import type { ServiceDefinition } from '../services';
import { sleep } from './sleep';
import type { CheckResult, HealthChecker } from './types';

/** Per-service behavior of the simulator. Chances are probabilities between 0 and 1 per check. */
export interface SimulationProfile {
  baseLatencyMs: number;
  jitterMs: number;
  /** Adds a latency spike large enough to be classified as "degraded". */
  spikeChance: number;
  spikeMs: number;
  /** Returns an error response ("down"). */
  downChance: number;
  /** Never answers, so the caller's timeout records it as "down". */
  hangChance: number;
}

const DEFAULT_PROFILE: SimulationProfile = {
  baseLatencyMs: 40,
  jitterMs: 60,
  spikeChance: 0.03,
  spikeMs: 1_200,
  downChance: 0.02,
  hangChance: 0.01,
};

/** Realistic-looking differences between services (e.g. the AI service is slow and spiky). */
const PROFILES: Record<string, Partial<SimulationProfile>> = {
  payments: { baseLatencyMs: 90, jitterMs: 80, hangChance: 0.03 },
  search: { baseLatencyMs: 60, jitterMs: 90 },
  ai: { baseLatencyMs: 350, jitterMs: 400, spikeChance: 0.08 },
};

export interface SimulatedHealthCheckerOptions {
  /** Random source in [0, 1). Inject a deterministic one in tests. */
  random?: () => number;
  profiles?: Record<string, Partial<SimulationProfile>>;
}

/** Stand-in for real health checks: random latency, occasional spikes, errors and hangs. */
export class SimulatedHealthChecker implements HealthChecker {
  private readonly random: () => number;
  private readonly profiles: Record<string, Partial<SimulationProfile>>;

  constructor(options: SimulatedHealthCheckerOptions = {}) {
    this.random = options.random ?? Math.random;
    this.profiles = options.profiles ?? PROFILES;
  }

  async check(service: ServiceDefinition, signal: AbortSignal): Promise<CheckResult> {
    const p: SimulationProfile = { ...DEFAULT_PROFILE, ...this.profiles[service.id] };
    const roll = this.random();

    if (roll < p.hangChance) {
      await sleep(60_000, signal); // aborted by the caller's timeout
    }

    let latencyMs = Math.round(p.baseLatencyMs + this.random() * p.jitterMs);
    if (this.random() < p.spikeChance) latencyMs += p.spikeMs;
    await sleep(latencyMs, signal);

    if (roll < p.hangChance + p.downChance) {
      return { status: 'down', latencyMs, message: 'Health endpoint returned HTTP 503' };
    }
    return { status: 'operational', latencyMs, message: null };
  }
}
