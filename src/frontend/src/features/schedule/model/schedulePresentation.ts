import type { Showtime } from '../types';
import { formatShowtime } from './scheduleDates';
import { getShowtimeStatus } from './showtimeStatus';

export function getScheduleGenres(
  showtimes: Showtime[] | undefined,
  genre: string,
) {
  return [
    ...new Set([
      ...(showtimes?.flatMap((showtime) => showtime.movie.genres) ?? []),
      ...(genre ? [genre] : []),
    ]),
  ].sort();
}

export function getScheduleMovies(
  showtimes: Showtime[] | undefined,
  now: number,
) {
  if (showtimes === undefined) return undefined;
  const movies = new Map(
    showtimes.map((showtime) => [showtime.movie.id, showtime.movie]),
  );
  const grouped = new Map<number, Showtime[]>();
  for (const showtime of showtimes) {
    const group = grouped.get(showtime.movie.id) ?? [];
    group.push(showtime);
    grouped.set(showtime.movie.id, group);
  }
  return [...movies.values()].map((movie) => ({
    ...movie,
    showtimes: grouped.get(movie.id)!.map((showtime) => ({
      ...showtime,
      status: getShowtimeStatus(showtime.startsAt, movie.durationMinutes, now),
      timeLabel: formatShowtime(showtime.startsAt),
    })),
  }));
}

export type ScheduleMovie = NonNullable<
  ReturnType<typeof getScheduleMovies>
>[number];
