import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scheduleQueries } from '../api/scheduleQueries';
import { getScheduleDates } from '../model/scheduleDates';
import { readScheduleFilters } from '../model/scheduleFilters';
import {
  getScheduleGenres,
  getScheduleMovies,
} from '../model/schedulePresentation';

export function useSchedule({
  searchParams,
  onSearchParamsChange,
}: {
  searchParams: URLSearchParams;
  onSearchParamsChange: (
    update: (previous: URLSearchParams) => URLSearchParams,
  ) => void;
}) {
  const [dates] = useState(() => getScheduleDates());
  const { selectedIndex, genre, format } = readScheduleFilters(
    searchParams,
    dates,
  );
  const selectedDate = dates[selectedIndex];
  const query = useQuery(
    scheduleQueries.forFilters(selectedDate.key, genre, format),
  );
  const movies = getScheduleMovies(query.data, Date.now());

  function updateFilters(values: Record<string, string>) {
    onSearchParamsChange((previous) => {
      const next = new URLSearchParams(previous);
      next.set('date', selectedDate.key);
      next.set('format', format);
      for (const [key, value] of Object.entries(values)) {
        if (value) next.set(key, value);
        else next.delete(key);
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
    genres: getScheduleGenres(query.data, genre),
    movies,
    isPending: query.isPending,
    isPaused: query.isPaused,
    isError: query.isError,
    isFetching: query.isFetching,
    onDateSelect: (index: number) => updateFilters({ date: dates[index].key }),
    onFilterChange: (name: string, value: string) =>
      updateFilters({ [name]: value }),
    onRetry: () => {
      void query.refetch();
    },
  };
}
