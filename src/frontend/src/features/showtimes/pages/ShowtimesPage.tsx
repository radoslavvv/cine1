import { Link, useSearchParams } from 'react-router-dom';
import { showtimesTheme as theme } from './ShowtimesPage.theme';
import { MovieArtwork } from '../../../shared/components/MovieArtwork/MovieArtwork';
import { Button } from '../../../shared/components/Button/Button';
import { StatusMessage } from '../../../shared/components/StatusMessage/StatusMessage';
import { AccountHeader } from '../../auth/components/AccountHeader/AccountHeader';
import { CarpetFooter } from '../../../shared/components/CarpetFooter/CarpetFooter';
import { ProjectorAtmosphere } from '../../../shared/components/ProjectorAtmosphere/ProjectorAtmosphere';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { ShowtimesFilters } from '../components/ShowtimesFilters/ShowtimesFilters';

import { useShowtimes } from '../hooks/useShowtimes';
import { AnimatePresence, motion } from 'motion/react';
import { MotionSurface } from '../../../shared/components/MotionSurface/MotionSurface';
import { MotionItem } from '../../../shared/components/MotionItem/MotionItem';
import { useCinemaMotion } from '../../../shared/hooks/useCinemaMotion';

export function ShowtimesPage() {
  const animation = useCinemaMotion();
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
    isUpdating,
    onDateSelect,
    onFilterChange,
    onRetry,
  } = useShowtimes({
    searchParams,
    onSearchParamsChange: setSearchParams,
  });

  return (
    <div id="showtimes-top" className={theme.page}>
      <ProjectorAtmosphere />
      <div className={theme.container}>
        <AccountHeader />

        <h1 className="sr-only">Movie showtimes</h1>

        <MotionSurface delay={0.04}>
          <DatePicker
            dates={dates}
            selectedIndex={selectedIndex}
            onSelect={onDateSelect}
          />
        </MotionSurface>
        <MotionSurface delay={0.08}>
          <ShowtimesFilters
            genres={genres}
            genre={genre}
            format={format}
            onChange={onFilterChange}
          />
        </MotionSurface>
        <p className="sr-only" role="status">
          {selectedDate.fullLabel}
          {isUpdating
            ? ' — updating showtimes'
            : isPending
              ? ' — loading showtimes'
              : movies?.length === 0
                ? ' — no matching screenings'
                : movies
                  ? ` — ${movies.length} matching movies`
                  : ''}
        </p>

        <motion.div
          layout
          className={theme.results}
          transition={animation.transition}
          aria-busy={(isPending || isUpdating) && !isPaused}
        >
          {isUpdating && !isPaused && (
            <p
              className="absolute -top-6 right-0 text-xs text-muted"
              role="status"
            >
              Updating screenings…
            </p>
          )}
          {movies === undefined &&
            isPending &&
            (isPaused ? (
              <MotionSurface key="offline" distance={6}>
                <StatusMessage title="You’re offline.">
                  <p>The showtimes will load when you reconnect.</p>
                </StatusMessage>
              </MotionSurface>
            ) : (
              <div key="loading">
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
              </div>
            ))}
          {movies === undefined && isError && (
            <MotionSurface key="error" distance={6}>
              <StatusMessage title="Couldn’t load showtimes" isError>
                <p>The showtimes could not be loaded. Please try again.</p>
                <Button onClick={onRetry}>
                  Try again <span aria-hidden="true">↗</span>
                </Button>
              </StatusMessage>
            </MotionSurface>
          )}
          {movies !== undefined && (
            <div key="loaded" inert={isUpdating || undefined}>
              <AnimatePresence initial={false} propagate>
                {(isPaused || isError) && (
                  <MotionSurface key="refresh-status" distance={4}>
                    <p className={theme.resultsStatus} role="status">
                      {isPaused ? (
                        'You’re offline. Here’s the last showtimes we loaded for this date.'
                      ) : (
                        <>
                          Couldn’t update this showtimes.{' '}
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
                  </MotionSurface>
                )}
              </AnimatePresence>
              <AnimatePresence initial={false} mode="popLayout" propagate>
                {movies.length === 0 ? (
                  <MotionSurface key="empty" className={theme.emptyState}>
                    <p className={theme.emptyTitle}>
                      No screenings match these filters.
                    </p>
                    <p className={theme.emptyHint}>
                      Try another date, genre, or format.
                    </p>
                  </MotionSurface>
                ) : (
                  <motion.ul
                    key="movies"
                    layout
                    className={theme.movieList}
                    style={{ position: 'relative' }}
                  >
                    <AnimatePresence mode="popLayout" propagate>
                      {movies.map((movie) => {
                        return (
                          <MotionItem
                            key={movie.id}
                            initial={false}
                            className={theme.movieRow}
                          >
                            <div className={theme.poster}>
                              <MovieArtwork
                                title={movie.title}
                                posterUrl={movie.posterUrl}
                                backdropUrl={movie.backdropUrl}
                                showTitle={false}
                              />
                            </div>
                            <div>
                              <p className={theme.category}>
                                {movie.genres.join(' / ').toUpperCase()}
                              </p>
                              <h2 className={theme.movieTitle}>
                                {movie.title}
                              </h2>
                              <p className={theme.metadata}>
                                {movie.durationMinutes} min
                              </p>
                              <p className={theme.synopsis}>{movie.synopsis}</p>
                            </div>
                            <div className={theme.showtimes}>
                              <ul
                                className={theme.times}
                                aria-label={`Showtimes for ${movie.title}`}
                              >
                                <AnimatePresence mode="popLayout" propagate>
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
                                      <MotionItem
                                        key={showtime.id}
                                        initial={false}
                                      >
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
                                      </MotionItem>
                                    );
                                  })}
                                </AnimatePresence>
                              </ul>
                            </div>
                          </MotionItem>
                        );
                      })}
                    </AnimatePresence>
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
      <CarpetFooter topId="showtimes-top" />
    </div>
  );
}
