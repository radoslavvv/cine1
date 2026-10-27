import { queryOptions } from '@tanstack/react-query';
import type { SeatMap } from '../types';

export class SeatMapError extends Error {
  constructor(public readonly status: number) {
    super(`Seat map request failed (${status}).`);
  }
}

export const bookingQueries = {
  seats: (showtimeId: string) => queryOptions({
    queryKey: ['seat-map', showtimeId],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/showtimes/${encodeURIComponent(showtimeId)}/seats`, {
        signal,
        cache: 'no-store',
      });
      if (!response.ok) throw new SeatMapError(response.status);
      const map = await response.json() as SeatMap;
      return { ...map, clockOffsetMs: Date.parse(map.serverNow) - Date.now() };
    },
    staleTime: 0,
    retry: (failureCount, error) => failureCount < 1 && !(error instanceof SeatMapError && error.status < 500),
    retryDelay: 1_000,
  }),
};
