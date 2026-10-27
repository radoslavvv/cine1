import { schedulePageTheme as theme } from './SchedulePage.theme';
import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MovieArtwork } from '../../../../shared/components/MovieArtwork/MovieArtwork';
import { Button } from '../../../../shared/components/Button/Button';
import { StatusMessage } from '../../../../shared/components/StatusMessage/StatusMessage';
import { DatePicker } from '../DatePicker/DatePicker';
import { formatShowtime, getScheduleDates } from '../../model/scheduleDates';
import { scheduleQueries } from '../../api/scheduleQueries';
import type { ScheduleMotionSession } from '../../model/scheduleMotion';
import { useScheduleMotion } from '../../hooks/useScheduleMotion';
import { Wordmark } from '../../../../shared/components/Wordmark/Wordmark';
import { getShowtimeStatus } from '../../model/showtimeStatus';
import { useShowtimeClock } from '../../hooks/useShowtimeClock';
import { useResultsSpace } from '../../hooks/useResultsSpace';
import { useScheduleReady } from '../../hooks/useScheduleReady';
import {
  DEFAULT_FORMAT,
  readScheduleFilters,
} from '../../model/scheduleFilters';
import { ScheduleFilters } from '../ScheduleFilters/ScheduleFilters';

export function SchedulePage({
  preview = false,
  motion,
  onReady,
}: {
  preview?: boolean;
  motion: ScheduleMotionSession;
  onReady?: () => void;
}) {
  const [dates] = useState(() => getScheduleDates());
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedIndex, genre, format } = readScheduleFilters(
    searchParams,
    dates,
  );
  const selectedDate = dates[selectedIndex];
  const scheduleQuery = useQuery(
    scheduleQueries.forFilters(selectedDate.key, genre, format),
  );
  const showtimes = scheduleQuery.data;
  const genres = [
    ...new Set([
      ...(scheduleQuery.data?.flatMap((showtime) => showtime.movie.genres) ??
        []),
      ...(genre ? [genre] : []),
    ]),
  ].sort();
  function updateFilters(values: Record<string, string>) {
    setSearchParams((previous) => {
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
  const clearFilters = () =>
    updateFilters({ genre: '', format: DEFAULT_FORMAT });
  const movies =
    showtimes === undefined
      ? undefined
      : [
          ...new Map(
            showtimes.map((showtime) => [showtime.movie.id, showtime.movie]),
          ).values(),
        ];
  const rootRef = useScheduleMotion(motion, preview, selectedDate.key);
  const now = useShowtimeClock(scheduleQuery.data);
  const { contentRef, height } = useResultsSpace();
  useScheduleReady(
    rootRef,
    scheduleQuery.isPending && !scheduleQuery.isPaused,
    onReady,
  );

  return (
    <div
      ref={rootRef}
      id={preview ? undefined : 'schedule-top'}
      className={theme.page}
    >
      <div className={theme.container}>
        <header className={theme.header} data-schedule-enter="header">
          <Link
            to="/"
            className={theme.brand}
            aria-label="cinemaR — back to the auditorium"
          >
            <Wordmark />
          </Link>
        </header>

        {preview ? (
          <h2 className="sr-only">Movie schedule</h2>
        ) : (
          <h1 className="sr-only">Movie schedule</h1>
        )}

        <DatePicker
          dates={dates}
          selectedIndex={selectedIndex}
          onSelect={(index) => updateFilters({ date: dates[index].key })}
        />
        <ScheduleFilters
          genres={genres}
          genre={genre}
          format={format}
          onChange={(name, value) => updateFilters({ [name]: value })}
          onClear={clearFilters}
        />
        <p className="sr-only" role="status">
          {selectedDate.fullLabel}
          {scheduleQuery.isPending
            ? ' — loading schedule'
            : movies?.length === 0
              ? ' — no matching screenings'
              : movies
                ? ` — ${movies.length} matching movies`
                : ''}
        </p>

        <div
          className={theme.results}
          style={{ minHeight: height ? `max(32rem, ${height}px)` : undefined }}
          aria-busy={scheduleQuery.isPending && !scheduleQuery.isPaused}
        >
          <div ref={contentRef}>
            {movies === undefined &&
              scheduleQuery.isPending &&
              (scheduleQuery.isPaused ? (
                <StatusMessage title="You’re offline.">
                  <p>The schedule will load when you reconnect.</p>
                </StatusMessage>
              ) : (
                <ul className={theme.movieList} aria-hidden="true">
                  {[0, 1, 2].map((row) => (
                    <li key={row} className={theme.movieRow}>
                      <div className={`${theme.poster} ${theme.skeleton}`} />
                      <div className="space-y-4 py-2">
                        <div className={`${theme.skeleton} h-2 w-20`} />
                        <div
                          className={`${theme.skeleton} h-7 w-3/4 max-w-72`}
                        />
                        <div className={`${theme.skeleton} h-3 w-24`} />
                        <div
                          className={`${theme.skeleton} hidden h-3 w-5/6 sm:block`}
                        />
                      </div>
                      <div className={theme.times}>
                        {[0, 1, 2].map((time) => (
                          <div
                            key={time}
                            className={`${theme.skeleton} h-[78px] w-[84px]`}
                          />
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              ))}
            {movies === undefined && scheduleQuery.isError && (
              <StatusMessage title="Couldn’t load schedule" isError>
                <p>The schedule could not be loaded. Please try again.</p>
                <Button onClick={() => void scheduleQuery.refetch()}>
                  Try again <span aria-hidden="true">↗</span>
                </Button>
              </StatusMessage>
            )}
            {movies !== undefined && (
              <>
                {(scheduleQuery.isPaused || scheduleQuery.isError) && (
                  <p className={theme.catalogStatus} role="status">
                    {scheduleQuery.isPaused ? (
                      'You’re offline. Here’s the last schedule we loaded for this date.'
                    ) : (
                      <>
                        Couldn’t update this schedule.{' '}
                        <button
                          type="button"
                          className="underline underline-offset-4 disabled:opacity-50"
                          disabled={scheduleQuery.isFetching}
                          onClick={() => void scheduleQuery.refetch()}
                        >
                          Try again
                        </button>
                      </>
                    )}
                  </p>
                )}
                {movies.length === 0 ? (
                  <div className={theme.emptyState}>
                    <p className={theme.emptyTitle}>
                      No screenings match these filters.
                    </p>
                    <p className={theme.emptyHint}>
                      Try another date, genre, or format.
                    </p>
                    {(genre || format !== DEFAULT_FORMAT) && (
                      <Button onClick={clearFilters}>Reset filters</Button>
                    )}
                  </div>
                ) : (
                  <ul className={theme.movieList}>
                    {movies.map((movie, index) => {
                      const movieShowtimes = showtimes!.filter(
                        (showtime) => showtime.movie.id === movie.id,
                      );
                      return (
                        <li
                          key={movie.id}
                          className={theme.movieRow}
                          data-schedule-enter="row"
                          data-schedule-key={`row:${movie.id}`}
                          data-schedule-order={index}
                        >
                          <div
                            className={theme.poster}
                            data-schedule-enter="poster"
                            data-schedule-key={`poster:${movie.id}`}
                            data-schedule-order={index}
                          >
                            <MovieArtwork
                              title={movie.title}
                              showTitle={false}
                            />
                          </div>
                          <div
                            data-schedule-enter="details"
                            data-schedule-key={`details:${movie.id}`}
                            data-schedule-order={index}
                          >
                            <p className={theme.category}>
                              {movie.genres.join(' / ').toUpperCase()}
                            </p>
                            {preview ? (
                              <h3 className={theme.movieTitle}>
                                {movie.title}
                              </h3>
                            ) : (
                              <h2 className={theme.movieTitle}>
                                {movie.title}
                              </h2>
                            )}
                            <p className={theme.metadata}>
                              {movie.durationMinutes} min
                            </p>
                            <p className={theme.synopsis}>{movie.synopsis}</p>
                          </div>
                          <div
                            data-schedule-enter="times"
                            data-schedule-key={`times:${movie.id}`}
                            data-schedule-order={index}
                          >
                            <ul
                              className={theme.times}
                              data-showtimes
                              aria-label={`Showtimes for ${movie.title}`}
                            >
                              {movieShowtimes.map((showtime) => {
                                const status = getShowtimeStatus(
                                  showtime.startsAt,
                                  movie.durationMinutes,
                                  now,
                                );
                                const details = (
                                  <>
                                    <time dateTime={showtime.startsAt}>
                                      {formatShowtime(showtime.startsAt)}
                                    </time>
                                    <span className={theme.timeAuditorium}>
                                      {showtime.auditorium.name}
                                    </span>
                                    <span className={theme.timeFormat}>
                                      {showtime.format}
                                    </span>
                                    <span className={theme.timeStatus}>
                                      {status === 'Upcoming' ? (
                                        <span className="sr-only">
                                          Upcoming — choose seats
                                        </span>
                                      ) : (
                                        status
                                      )}
                                    </span>
                                  </>
                                );
                                return (
                                  <li key={showtime.id}>
                                    {status === 'Upcoming' ? (
                                      <Link
                                        to={`/booking/${showtime.id}`}
                                        className={`${theme.time} ${theme.timeUpcoming} ${theme.timeLink}`}
                                      >
                                        {details}
                                      </Link>
                                    ) : (
                                      <div
                                        className={`${theme.time} ${status === 'Started' ? theme.timeStarted : theme.timeFinished}`}
                                      >
                                        {details}
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <footer className={theme.footer}>
        <div className={theme.footerDetails} data-schedule-enter="footer">
          <span className={theme.footerBrand}>
            cinema<span className="italic text-amber">R</span>
          </span>
          <a className={theme.footerLink} href="#schedule-top">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
