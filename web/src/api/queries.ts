import { useQuery } from '@tanstack/react-query';
import { fetchEvents, fetchServices } from './client';

export const POLL_INTERVAL_MS = 15_000;
export const EVENTS_LIMIT = 50;

/**
 * Polls the services endpoint. TanStack Query keeps the last good data when a refresh fails,
 * pauses polling while the tab is hidden, and refreshes when the window regains focus.
 */
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: ({ signal }) => fetchServices(signal),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ['events', EVENTS_LIMIT],
    queryFn: ({ signal }) => fetchEvents(EVENTS_LIMIT, signal),
    refetchInterval: POLL_INTERVAL_MS,
  });
}
