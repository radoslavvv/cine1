import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { Showtime } from '../types';
import type { ShowtimeFormat } from '../model/showtimesFilters';

export const showtimesQueries = {
  forFilters: (date: string, genre: string, format: ShowtimeFormat) =>
    queryOptions({
      queryKey: ['showtimes', date, genre, format],
      queryFn: async ({ signal }): Promise<Showtime[]> => {
        const params = new URLSearchParams({ date, format });
        if (genre) params.set('genre', genre);
        const response = await fetch(`/api/showtimes?${params}`, { signal });
        if (!response.ok)
          throw new Error(`Showtimes request failed (${response.status}).`);
        return response.json() as Promise<Showtime[]>;
      },
      staleTime: 30_000,
      placeholderData: keepPreviousData,
      retry: 1,
      retryDelay: 1_000,
    }),
};
