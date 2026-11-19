import { useQuery } from '@tanstack/react-query';
import { REFRESH_INTERVAL_MS } from '../config';
import { fetchEvents, fetchServices } from './client';

export const EVENTS_LIMIT = 50;

/**
 * Polls the services endpoint. TanStack Query keeps the last good data when a refresh fails,
 * pauses polling while the tab is hidden, and refreshes when the window regains focus.
 */
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: ({ signal }) => fetchServices(signal),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ['events', EVENTS_LIMIT],
    queryFn: ({ signal }) => fetchEvents(EVENTS_LIMIT, signal),
    refetchInterval: REFRESH_INTERVAL_MS,
  });
}
