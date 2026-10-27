import { queryOptions } from '@tanstack/react-query';
import type { Showtime } from '../types';
import type { ShowtimeFormat } from '../model/scheduleFilters';

export const scheduleQueries = {
  forFilters: (date: string, genre: string, format: ShowtimeFormat) =>
    queryOptions({
      queryKey: ['showtimes', date, genre, format],
      queryFn: async ({ signal }): Promise<Showtime[]> => {
        const params = new URLSearchParams({ date, format });
        if (genre) params.set('genre', genre);
        const response = await fetch(`/api/showtimes?${params}`, { signal });
        if (!response.ok)
          throw new Error(`Schedule request failed (${response.status}).`);
        return response.json() as Promise<Showtime[]>;
      },
      staleTime: 0,
      retry: 1,
      retryDelay: 1_000,
    }),
};
