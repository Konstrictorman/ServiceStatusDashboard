import { randomUUID } from 'node:crypto';
import type { ServiceStatus, StatusEvent } from '@ssd/shared';
import type { CheckResult } from '../health/types';
import type { ServiceDefinition } from '../services';
import type { StatusRepository } from './types';

interface StoredResult extends CheckResult {
  checkedAt: Date;
}

export interface InMemoryStatusRepositoryOptions {
  services: readonly ServiceDefinition[];
  staleAfterMs: number;
  eventHistoryLimit: number;
}

/**
 * Keeps only the latest result per service plus a capped list of status changes.
 * Current status is short-lived data that refreshes every poll, so nothing valuable is lost on restart.
 */
export class InMemoryStatusRepository implements StatusRepository {
  private readonly services: readonly ServiceDefinition[];
  private readonly staleAfterMs: number;
  private readonly eventHistoryLimit: number;
  private readonly latest = new Map<string, StoredResult>();
  private events: StatusEvent[] = [];

  constructor(options: InMemoryStatusRepositoryOptions) {
    this.services = options.services;
    this.staleAfterMs = options.staleAfterMs;
    this.eventHistoryLimit = options.eventHistoryLimit;
  }

  async listServices(now: Date): Promise<ServiceStatus[]> {
    return this.services.map((service) => this.toServiceStatus(service, now));
  }

  async getService(id: string, now: Date): Promise<ServiceStatus | undefined> {
    const service = this.services.find((s) => s.id === id);
    return service ? this.toServiceStatus(service, now) : undefined;
  }

  async recordResult(
    serviceId: string,
    result: CheckResult,
    checkedAt: Date,
  ): Promise<StatusEvent | null> {
    const service = this.services.find((s) => s.id === serviceId);
    if (!service) throw new Error(`Unknown service "${serviceId}"`);

    const previous = this.latest.get(serviceId);
    this.latest.set(serviceId, { ...result, checkedAt });

    // The first result after startup is a baseline, not a change worth reporting.
    if (!previous || previous.status === result.status) return null;

    const event: StatusEvent = {
      id: randomUUID(),
      serviceId,
      serviceName: service.name,
      from: previous.status,
      to: result.status,
      message: result.message ?? (result.status === 'operational' ? 'Recovered' : null),
      occurredAt: checkedAt.toISOString(),
    };
    this.events = [event, ...this.events].slice(0, this.eventHistoryLimit);
    return event;
  }

  async listEvents(limit: number): Promise<StatusEvent[]> {
    return this.events.slice(0, limit);
  }

  private toServiceStatus(service: ServiceDefinition, now: Date): ServiceStatus {
    const stored = this.latest.get(service.id);
    if (!stored) {
      return {
        ...service,
        status: 'unknown',
        latencyMs: null,
        message: 'Waiting for first check',
        lastCheckedAt: null,
      };
    }
    if (now.getTime() - stored.checkedAt.getTime() > this.staleAfterMs) {
      // Never show a stale result as healthy: if the poller stops, the dashboard turns grey, not green.
      return {
        ...service,
        status: 'unknown',
        latencyMs: null,
        message: `No check in the last ${Math.round(this.staleAfterMs / 1000)} s`,
        lastCheckedAt: stored.checkedAt.toISOString(),
      };
    }
    return {
      ...service,
      status: stored.status,
      latencyMs: stored.latencyMs,
      message: stored.message,
      lastCheckedAt: stored.checkedAt.toISOString(),
    };
  }
}
