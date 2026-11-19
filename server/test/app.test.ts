import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ErrorResponse, EventsResponse, ServiceResponse, ServicesResponse } from '@ssd/shared';
import { buildApp, REQUEST_ID_HEADER } from '../src/app';
import { InMemoryStatusRepository } from '../src/repository/inMemoryStatusRepository';

const services = [
  { id: 'payments', name: 'Payments' },
  { id: 'ai', name: 'AI' },
];
const t0 = new Date('2026-11-19T14:00:00.000Z');
const at = (seconds: number) => new Date(t0.getTime() + seconds * 1_000);
const UUID = /^[0-9a-f-]{36}$/;

let app: ReturnType<typeof buildApp>;
let lastPollAt: Date | null;

beforeEach(async () => {
  const repository = new InMemoryStatusRepository({
    services,
    staleAfterMs: 30_000,
    eventHistoryLimit: 100,
  });
  await repository.recordResult(
    'payments',
    { status: 'operational', latencyMs: 90, message: null },
    at(0),
  );
  await repository.recordResult(
    'ai',
    { status: 'operational', latencyMs: 400, message: null },
    at(0),
  );
  await repository.recordResult(
    'payments',
    { status: 'down', latencyMs: null, message: 'Check timed out after 2000 ms' },
    at(10),
  );
  lastPollAt = at(10);
  app = buildApp({
    repository,
    staleAfterMs: 30_000,
    getLastPollAt: () => lastPollAt,
    now: () => at(15),
  });
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

describe('GET /api/services', () => {
  it('returns every service, the overall status and a request ID', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/services' });
    expect(res.statusCode).toBe(200);
    expect(res.headers[REQUEST_ID_HEADER]).toMatch(UUID);
    const body = ServicesResponse.parse(res.json());
    expect(body.overall).toBe('down');
    expect(body.services.map((s) => [s.id, s.status])).toEqual([
      ['payments', 'down'],
      ['ai', 'operational'],
    ]);
  });

  it('reuses a safe request ID sent by the caller', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/services',
      headers: { [REQUEST_ID_HEADER]: 'trace-123' },
    });
    expect(res.headers[REQUEST_ID_HEADER]).toBe('trace-123');
  });

  it('ignores an unsafe request ID and generates a new one', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/services',
      headers: { [REQUEST_ID_HEADER]: 'bad id\nwith newline' },
    });
    expect(res.headers[REQUEST_ID_HEADER]).toMatch(UUID);
  });
});

describe('GET /api/services/:id', () => {
  it('returns one service', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/services/ai' });
    expect(res.statusCode).toBe(200);
    expect(ServiceResponse.parse(res.json()).service).toMatchObject({
      id: 'ai',
      status: 'operational',
    });
  });

  it('returns 404 with the error shape and the request ID for an unknown service', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/services/nope' });
    expect(res.statusCode).toBe(404);
    const body = ErrorResponse.parse(res.json());
    expect(body.error.code).toBe('SERVICE_NOT_FOUND');
    expect(body.error.requestId).toBe(res.headers[REQUEST_ID_HEADER]);
  });
});

describe('GET /api/events', () => {
  it('returns recent status changes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/events' });
    expect(res.statusCode).toBe(200);
    const { events } = EventsResponse.parse(res.json());
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ serviceId: 'payments', from: 'operational', to: 'down' });
  });

  it.each(['0', '101', 'abc', '2.5'])('rejects limit=%s with 400', async (limit) => {
    const res = await app.inject({ method: 'GET', url: `/api/events?limit=${limit}` });
    expect(res.statusCode).toBe(400);
    expect(ErrorResponse.parse(res.json()).error.code).toBe('VALIDATION_ERROR');
  });
});

describe('other routes', () => {
  it('returns 404 with the error shape for unknown routes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/nothing-here' });
    expect(res.statusCode).toBe(404);
    expect(ErrorResponse.parse(res.json()).error.code).toBe('NOT_FOUND');
  });

  it('reports healthy while the poller is recent', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', lastPollAt: at(10).toISOString() });
  });

  it('reports 503 when the poller has not completed a round recently', async () => {
    lastPollAt = at(-60);
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({ status: 'degraded' });
  });
});
