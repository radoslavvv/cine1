import { queryOptions } from '@tanstack/react-query';
import { getMovies } from './getMovies';

export const movieQueries = {
  all: ['movies'] as const,
  list: () => queryOptions({
    queryKey: [...movieQueries.all, 'list'],
    queryFn: ({ signal }) => getMovies(signal),
    // Catalog data changes slowly. Seat availability will need its own policy.
    staleTime: 60_000,
    retry: 1,
    retryDelay: 1_000,
  }),
};
