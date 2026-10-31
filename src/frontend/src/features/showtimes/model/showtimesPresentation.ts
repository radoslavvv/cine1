import type { Showtime } from '../types';
import { formatShowtime } from './showtimesDates';
import { getShowtimeStatus } from './showtimeStatus';

export function getShowtimesGenres(
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

export function getShowtimesMovies(
  showtimes: Showtime[] | undefined,
  now: number,
) {
  if (showtimes === undefined) {
    return undefined;
  }

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
      status: getShowtimeStatus(
        showtime.startsAt,
        showtime.movie.durationMinutes,
        now,
      ),
      timeLabel: formatShowtime(showtime.startsAt),
    })),
  }));
}

export type ShowtimesMovie = NonNullable<
  ReturnType<typeof getShowtimesMovies>
>[number];
