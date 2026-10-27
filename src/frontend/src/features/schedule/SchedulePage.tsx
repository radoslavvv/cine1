import { schedulePageTheme as theme } from './SchedulePage.theme';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MovieArtwork } from './artwork/MovieArtwork';
import { Button } from '../../shared/ui/Button';
import { StatusMessage } from '../../shared/ui/StatusMessage';
import { DatePicker } from './components/DatePicker';
import { formatShowtime, getScheduleDates } from './model/scheduleDates';
import { scheduleQueries } from './api/scheduleQueries';
import type { ScheduleMotionSession } from './model/scheduleMotion';
import { useScheduleMotion } from './useScheduleMotion';
import { Wordmark } from '../../shared/ui/Wordmark';
import { getShowtimeStatus } from './model/showtimeStatus';
import { useShowtimeClock } from './useShowtimeClock';
import { useResultsSpace } from './useResultsSpace';

export function SchedulePage({ preview = false, motion }: { preview?: boolean; motion: ScheduleMotionSession }) {
  const [dates] = useState(() => getScheduleDates());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedDate = dates[selectedIndex];
  const scheduleQuery = useQuery(scheduleQueries.forDate(selectedDate.key));
  const showtimes = scheduleQuery.data;
  const movies = showtimes === undefined ? undefined : [...new Map(showtimes.map(showtime => [showtime.movie.id, showtime.movie])).values()];
  const rootRef = useScheduleMotion(motion, preview, selectedDate.key);
  const now = useShowtimeClock(showtimes);
  const { contentRef, height } = useResultsSpace();

  return (
    <div ref={rootRef} id={preview ? undefined : 'schedule-top'} className={theme.page}>
      <div className={theme.container}>
        <header className={theme.header} data-schedule-enter="header">
          <Link to="/" className={theme.brand} aria-label="cinemaR — back to the auditorium"><Wordmark /></Link>
        </header>

        {preview ? <h2 className="sr-only">Movie schedule</h2> : <h1 className="sr-only">Movie schedule</h1>}

        <DatePicker dates={dates} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        <p className="sr-only" role="status">{selectedDate.fullLabel}{scheduleQuery.isPending ? ' — loading schedule' : movies?.length === 0 ? ' — no screenings' : ''}</p>

        <div className={theme.results} style={{ minHeight: height || undefined }} aria-busy={scheduleQuery.isPending && !scheduleQuery.isPaused}>
          <div ref={contentRef}>
          {movies === undefined && scheduleQuery.isPending && (
            scheduleQuery.isPaused ? <StatusMessage title="You’re offline."><p>The schedule will load when you reconnect.</p></StatusMessage> :
            <ul className={theme.movieList} aria-hidden="true">
              {[0, 1, 2].map(row => <li key={row} className={theme.movieRow}>
                <div className={`${theme.poster} ${theme.skeleton}`} />
                <div className="space-y-4 py-2">
                  <div className={`${theme.skeleton} h-2 w-20`} />
                  <div className={`${theme.skeleton} h-7 w-3/4 max-w-72`} />
                  <div className={`${theme.skeleton} h-3 w-24`} />
                  <div className={`${theme.skeleton} hidden h-3 w-5/6 sm:block`} />
                </div>
                <div className={theme.times}>{[0, 1, 2].map(time => <div key={time} className={`${theme.skeleton} h-[78px] w-[84px]`} />)}</div>
              </li>)}
            </ul>
          )}
          {movies === undefined && scheduleQuery.isError && (
            <StatusMessage title="Couldn’t load schedule" isError>
              <p>The schedule could not be loaded. Please try again.</p>
              <Button onClick={() => void scheduleQuery.refetch()}>Try again <span aria-hidden="true">↗</span></Button>
            </StatusMessage>
          )}
          {movies !== undefined && (
            <>
              {(scheduleQuery.isPaused || scheduleQuery.isError) && <p className={theme.catalogStatus} role="status">
                {scheduleQuery.isPaused ? 'You’re offline. Here’s the last schedule we loaded for this date.'
                  : <>Couldn’t update this schedule. <button type="button" className="underline underline-offset-4 disabled:opacity-50" disabled={scheduleQuery.isFetching} onClick={() => void scheduleQuery.refetch()}>Try again</button></>}
              </p>}
              {movies.length === 0 ? (
                <div className={theme.emptyState}><p className={theme.emptyTitle}>No screenings on this date.</p><p className={theme.emptyHint}>Try another day.</p></div>
              ) : (
                <ul className={theme.movieList}>
                  {movies.map((movie, index) => {
                    const movieShowtimes = showtimes!.filter(showtime => showtime.movie.id === movie.id);
                    return (
                      <li key={movie.id} className={theme.movieRow} data-schedule-enter="row" data-schedule-key={`row:${movie.id}`} data-schedule-order={index}>
                        <div className={theme.poster} data-schedule-enter="poster" data-schedule-key={`poster:${movie.id}`} data-schedule-order={index}><MovieArtwork title={movie.title} showTitle={false} /></div>
                        <div data-schedule-enter="details" data-schedule-key={`details:${movie.id}`} data-schedule-order={index}>
                          <p className={theme.category}>{movie.genres.join(' / ').toUpperCase()}</p>
                          <h2 className={theme.movieTitle}>{movie.title}</h2>
                          <p className={theme.metadata}>{movie.durationMinutes} min</p>
                          <p className={theme.synopsis}>{movie.synopsis}</p>
                        </div>
                        <div data-schedule-enter="times" data-schedule-key={`times:${movie.id}`} data-schedule-order={index}>
                          <ul className={theme.times} data-showtimes aria-label={`Showtimes for ${movie.title}`}>
                            {movieShowtimes.map(showtime => {
                              const status = getShowtimeStatus(showtime.startsAt, movie.durationMinutes, now);
                              return <li key={showtime.id}><div className={`${theme.time} ${status === 'Upcoming' ? theme.timeUpcoming : theme.timePast}`}>
                              <time dateTime={showtime.startsAt}>
                              {formatShowtime(showtime.startsAt)}
                              </time>
                              <span className={theme.timeAuditorium}>{showtime.auditorium.name}</span>
                              <span className={theme.timeStatus}>{status === 'Upcoming' ? <span className="sr-only">Upcoming</span> : status}</span>
                            </div></li>;
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
        <div className={theme.footerDetails} data-schedule-enter="footer"><span className={theme.footerBrand}>cinema<span className="italic text-amber">R</span></span><a className={theme.footerLink} href="#schedule-top">Back to top <span aria-hidden="true">↑</span></a></div>
      </footer>
    </div>
  );
}
