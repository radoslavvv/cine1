import { queryOptions } from '@tanstack/react-query';
import type { Showtime } from '../types';

export const scheduleQueries = {
  forDate: (date: string) => queryOptions({
    queryKey: ['showtimes', date],
    queryFn: async ({ signal }): Promise<Showtime[]> => {
      const response = await fetch(`/api/showtimes?date=${encodeURIComponent(date)}`, { signal });
      if (!response.ok) throw new Error(`Schedule request failed (${response.status}).`);
      return response.json() as Promise<Showtime[]>;
    },
    staleTime: 60_000,
    retry: 1,
    retryDelay: 1_000,
  }),
};
