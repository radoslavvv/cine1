import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { showtimesQueries } from '../api/showtimesQueries';
import { getShowtimesDates } from '../model/showtimesDates';
import {
  readShowtimesFilters,
  SHOWTIME_FORMATS,
} from '../model/showtimesFilters';
import {
  getShowtimesGenres,
  getShowtimesMovies,
} from '../model/showtimesPresentation';

export function useShowtimes({
  searchParams,
  onSearchParamsChange,
}: {
  searchParams: URLSearchParams;
  onSearchParamsChange: (
    update: (previous: URLSearchParams) => URLSearchParams,
  ) => void;
}) {
  const [dates] = useState(() => getShowtimesDates());
  const { selectedIndex, genre, format } = readShowtimesFilters(
    searchParams,
    dates,
  );
  const selectedDate = dates[selectedIndex];
  const queryClient = useQueryClient();
  const query = useQuery(
    showtimesQueries.forFilters(selectedDate.key, genre, format),
  );
  const movies = getShowtimesMovies(query.data, Date.now());

  // Warm the other format choices after the visible request has completed.
  useEffect(() => {
    if (!query.isSuccess || query.isPlaceholderData) {
      return;
    }

    for (const candidate of SHOWTIME_FORMATS) {
      if (candidate !== format) {
        void queryClient.prefetchQuery(
          showtimesQueries.forFilters(selectedDate.key, genre, candidate),
        );
      }
    }
  }, [
    queryClient,
    selectedDate.key,
    genre,
    format,
    query.isSuccess,
    query.isPlaceholderData,
  ]);

  function updateFilters(values: Record<string, string>) {
    onSearchParamsChange((previous) => {
      const next = new URLSearchParams(previous);

      next.set('date', selectedDate.key);
      next.set('format', format);

      for (const [key, value] of Object.entries(values)) {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      }

      return next;
    });
  }

  return {
    dates,
    selectedIndex,
    selectedDate,
    genre,
    format,
    genres: getShowtimesGenres(query.data, genre),
    movies,
    isPending: query.isPending,
    isPaused: query.isPaused,
    isError: query.isError,
    isFetching: query.isFetching,
    isUpdating: query.isPlaceholderData,
    onDateSelect: (index: number) => updateFilters({ date: dates[index].key }),
    onFilterChange: (name: string, value: string) =>
      updateFilters({ [name]: value }),
    onRetry: () => {
      void query.refetch();
    },
  };
}
