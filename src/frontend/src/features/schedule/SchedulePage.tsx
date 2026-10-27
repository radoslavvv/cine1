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

export function SchedulePage({ preview = false, motion }: { preview?: boolean; motion: ScheduleMotionSession }) {
  const [dates] = useState(() => getScheduleDates());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedDate = dates[selectedIndex];
  const scheduleQuery = useQuery(scheduleQueries.forDate(selectedDate.key));
  const showtimes = scheduleQuery.data;
  const movies = showtimes === undefined ? undefined : [...new Map(showtimes.map(showtime => [showtime.movie.id, showtime.movie])).values()];
  const rootRef = useScheduleMotion(motion, preview, selectedDate.key);

  return (
    <div ref={rootRef} className={theme.page}>
      <div className={theme.container}>
        <header className={theme.header} data-schedule-enter="header">
          <Link to="/" className={theme.brand} aria-label="Back to the auditorium">cinema<span className={theme.accent}>R</span></Link>
          <span className={theme.demoBadge}>CINEMA SCHEDULE</span>
        </header>

        <div className={theme.intro}>
          <div data-schedule-enter="title">
            <p className={theme.eyebrow}>MOVIES & SHOWTIMES</p>
            {preview ? <h2 className={theme.heading}>Movie schedule</h2> : <h1 className={theme.heading}>Movie schedule</h1>}
            <p className={theme.description}>Choose a date to see the movies and showtimes.</p>
          </div>
          <div data-schedule-enter="action"><Button onClick={() => void scheduleQuery.refetch()} disabled={scheduleQuery.isFetching || scheduleQuery.isPaused}>
            {scheduleQuery.isPaused ? 'Offline' : scheduleQuery.isFetching ? 'Refreshing…' : 'Refresh schedule'} <span aria-hidden="true">↻</span>
          </Button></div>
        </div>

        <DatePicker dates={dates} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        <p className={theme.dateNote} data-schedule-enter="note">All times are local to Kyiv · Booking is coming later.</p>
        <p className={theme.selectedDate} data-schedule-enter="selectedDate" aria-live="polite">Showtimes for {selectedDate.fullLabel}</p>

        <div className={theme.results}>
          {movies === undefined && scheduleQuery.isPending && (
            <StatusMessage title={scheduleQuery.isPaused ? 'You’re offline.' : 'Loading schedule…'}>
              <p>{scheduleQuery.isPaused ? 'The schedule will load when you’re connected again.' : 'Loading movies and showtimes.'}</p>
            </StatusMessage>
          )}
          {movies === undefined && scheduleQuery.isError && (
            <StatusMessage title="Couldn’t load schedule" isError>
              <p>The schedule could not be loaded. Please try again.</p>
              <Button onClick={() => void scheduleQuery.refetch()}>Try again <span aria-hidden="true">↗</span></Button>
            </StatusMessage>
          )}
          {movies !== undefined && (
            <>
              <p className={theme.catalogStatus} role="status">
                {scheduleQuery.isPaused ? 'You’re offline. Here’s the last schedule we loaded for this date.'
                  : scheduleQuery.isFetching ? 'Updating schedule…'
                    : scheduleQuery.isError ? 'The refresh didn’t work. Your last schedule for this date is still here; try refreshing again.'
                      : `${movies.length} ${movies.length === 1 ? 'film' : 'films'} available.`}
              </p>
              {movies.length === 0 ? (
                <StatusMessage title="No screenings scheduled"><p>No screenings are listed for this date. Try another day.</p></StatusMessage>
              ) : (
                <ul className={theme.movieList}>
                  {movies.map((movie, index) => {
                    const movieShowtimes = showtimes!.filter(showtime => showtime.movie.id === movie.id);
                    return (
                      <li key={movie.id} className={theme.movieRow} data-schedule-enter="row" data-schedule-key={`row:${movie.id}`} data-schedule-order={index}>
                        <div className={theme.poster} data-schedule-enter="poster" data-schedule-key={`poster:${movie.id}`} data-schedule-order={index}><MovieArtwork title={movie.title} showTitle={false} /></div>
                        <div data-schedule-enter="details" data-schedule-key={`details:${movie.id}`} data-schedule-order={index}>
                          <p className={theme.category}>{movie.genres.join(' / ').toUpperCase()}</p>
                          <h3 className={theme.movieTitle}>{movie.title}</h3>
                          <p className={theme.metadata}>{movie.durationMinutes} min <span className={theme.separator}>/</span> {[...new Set(movieShowtimes.map(showtime => showtime.auditorium.name))].join(', ')}</p>
                          <p className={theme.synopsis}>{movie.synopsis}</p>
                        </div>
                        <div data-schedule-enter="times" data-schedule-key={`times:${movie.id}`} data-schedule-order={index}>
                          <p className={theme.timesLabel}>SHOWTIMES</p>
                          <ul className={theme.times} data-showtimes aria-label={`Showtimes for ${movie.title}`}>
                            {movieShowtimes.map(showtime => <li key={showtime.id}><time className={theme.time} dateTime={showtime.startsAt} title={showtime.auditorium.name}>
                              {formatShowtime(showtime.startsAt)}
                              <span className={theme.timeAuditorium}>{showtime.auditorium.name}</span>
                            </time></li>)}
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
      <footer className={theme.footer}>
        <div className={theme.footerDetails} data-schedule-enter="footer"><span className={theme.footerBrand}>cinemaR</span><span className={theme.footerLabel}>MOVIES & SHOWTIMES</span></div>
      </footer>
    </div>
  );
}
