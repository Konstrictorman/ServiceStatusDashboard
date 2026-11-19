import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { EventsResponse, ServicesResponse } from '@ssd/shared';
import { App } from './App';
import { renderWithProviders } from './test/render';

const services: ServicesResponse = {
  overall: 'down',
  generatedAt: '2026-11-19T14:10:05.000Z',
  staleAfterMs: 30_000,
  pollIntervalMs: 10_000,
  services: [
    {
      id: 'authentication',
      name: 'Authentication',
      status: 'operational',
      latencyMs: 41,
      message: null,
      lastCheckedAt: '2026-11-19T14:10:03.000Z',
    },
    {
      id: 'payments',
      name: 'Payments',
      status: 'down',
      latencyMs: null,
      message: 'Check timed out after 2000 ms',
      lastCheckedAt: '2026-11-19T14:10:03.000Z',
    },
    {
      id: 'ai',
      name: 'AI',
      status: 'degraded',
      latencyMs: 1340,
      message: 'Latency above 1000 ms',
      lastCheckedAt: '2026-11-19T14:10:03.000Z',
    },
  ],
};
const events: EventsResponse = {
  events: [
    {
      id: 'e1',
      serviceId: 'payments',
      serviceName: 'Payments',
      from: 'operational',
      to: 'down',
      message: 'Check timed out after 2000 ms',
      occurredAt: '2026-11-19T14:10:03.000Z',
    },
  ],
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function mockApi(handler: (url: string) => Response | Promise<Response>) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => Promise.resolve(handler(String(input))));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('App', () => {
  it('shows the overall status, problem services first, and recent events', async () => {
    mockApi((url) => (url.startsWith('/api/services') ? json(services) : json(events)));
    renderWithProviders(<App />);

    expect(await screen.findByText('Major outage')).toBeInTheDocument();
    expect(screen.getByText('1 service down, 1 degraded')).toBeInTheDocument();

    const cards = screen.getAllByRole('article');
    expect(cards.map((c) => within(c).getByRole('heading').textContent)).toEqual([
      'Payments',
      'AI',
      'Authentication',
    ]);
    expect(within(cards[0]!).getByText('Check timed out after 2000 ms')).toBeInTheDocument();
    expect(within(cards[1]!).getByText('Latency 1,340 ms')).toBeInTheDocument();

    const table = await screen.findByRole('table');
    expect(within(table).getByText('Payments')).toBeInTheDocument();
  });

  it('shows the empty state when there are no events yet', async () => {
    mockApi((url) => (url.startsWith('/api/services') ? json(services) : json({ events: [] })));
    renderWithProviders(<App />);
    expect(await screen.findByText('No status changes yet')).toBeInTheDocument();
  });

  it('shows an error with the request ID and retries when asked', async () => {
    const fetchMock = mockApi((url) =>
      url.startsWith('/api/services')
        ? json(
            {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error',
                requestId: 'req-123',
              },
            },
            500,
          )
        : json(events),
    );
    renderWithProviders(<App />);

    expect(await screen.findByText("Couldn't load service status")).toBeInTheDocument();
    expect(screen.getByText(/request ID req-123/)).toBeInTheDocument();

    const servicesCalls = () =>
      fetchMock.mock.calls.filter(([u]) => String(u).startsWith('/api/services')).length;
    const before = servicesCalls();
    await userEvent.click(screen.getByRole('button', { name: 'Retry now' }));
    expect(servicesCalls()).toBeGreaterThan(before);
  });

  it('shows a network error when the API is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );
    renderWithProviders(<App />);
    expect(await screen.findByText("Can't reach the status API")).toBeInTheDocument();
  });
});
