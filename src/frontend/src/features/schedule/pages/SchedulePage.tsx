import { Link, useSearchParams } from 'react-router-dom';
import { scheduleTheme as theme } from './SchedulePage.theme';
import { MovieArtwork } from '../../../shared/components/MovieArtwork/MovieArtwork';
import { Button } from '../../../shared/components/Button/Button';
import { StatusMessage } from '../../../shared/components/StatusMessage/StatusMessage';
import { Wordmark } from '../../../shared/components/Wordmark/Wordmark';
import { CarpetFooter } from '../../../shared/components/CarpetFooter/CarpetFooter';
import { ProjectorAtmosphere } from '../../../shared/components/ProjectorAtmosphere/ProjectorAtmosphere';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { ScheduleFilters } from '../components/ScheduleFilters/ScheduleFilters';

import { useSchedule } from '../hooks/useSchedule';
import type { ScheduleMotionSession } from '../model/scheduleMotion';

export function SchedulePage({
  motion,
  preview = false,
  onReady,
}: {
  motion: ScheduleMotionSession;
  preview?: boolean;
  onReady?: () => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    dates,
    selectedIndex,
    selectedDate,
    genre,
    format,
    genres,
    movies,
    isPending,
    isPaused,
    isError,
    isFetching,
    rootRef,
    contentRef,
    height,
    onDateSelect,
    onFilterChange,
    onRetry,
  } = useSchedule({
    searchParams,
    onSearchParamsChange: setSearchParams,
    motion,
    preview,
    onReady,
  });
  return (
    <div
      ref={rootRef}
      id={preview ? undefined : 'schedule-top'}
      className={theme.page}
    >
      <ProjectorAtmosphere />
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
          onSelect={onDateSelect}
        />
        <ScheduleFilters
          genres={genres}
          genre={genre}
          format={format}
          onChange={onFilterChange}
        />
        <p className="sr-only" role="status">
          {selectedDate.fullLabel}
          {isPending
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
          aria-busy={isPending && !isPaused}
        >
          <div ref={contentRef}>
            {movies === undefined &&
              isPending &&
              (isPaused ? (
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
                      <div className={`${theme.showtimes} ${theme.times}`}>
                        {[0, 1, 2].map((time) => (
                          <div
                            key={time}
                            className={`${theme.skeleton} size-26`}
                          />
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              ))}
            {movies === undefined && isError && (
              <StatusMessage title="Couldn’t load schedule" isError>
                <p>The schedule could not be loaded. Please try again.</p>
                <Button onClick={onRetry}>
                  Try again <span aria-hidden="true">↗</span>
                </Button>
              </StatusMessage>
            )}
            {movies !== undefined && (
              <>
                {(isPaused || isError) && (
                  <p className={theme.catalogStatus} role="status">
                    {isPaused ? (
                      'You’re offline. Here’s the last schedule we loaded for this date.'
                    ) : (
                      <>
                        Couldn’t update this schedule.{' '}
                        <button
                          type="button"
                          className="underline underline-offset-4 disabled:opacity-50"
                          disabled={isFetching}
                          onClick={onRetry}
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
                  </div>
                ) : (
                  <ul className={theme.movieList}>
                    {movies.map((movie, index) => {
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
                            className={theme.showtimes}
                            data-schedule-enter="times"
                            data-schedule-key={`times:${movie.id}`}
                            data-schedule-order={index}
                          >
                            <ul
                              className={theme.times}
                              data-showtimes
                              aria-label={`Showtimes for ${movie.title}`}
                            >
                              {movie.showtimes.map((showtime) => {
                                const { status } = showtime;
                                const details = (
                                  <>
                                    <time dateTime={showtime.startsAt}>
                                      {showtime.timeLabel}
                                    </time>
                                    <span
                                      className={theme.timeAuditorium}
                                      title={showtime.auditorium.name}
                                    >
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
      <CarpetFooter topId={preview ? 'schedule' : 'schedule-top'} animate />
    </div>
  );
}
