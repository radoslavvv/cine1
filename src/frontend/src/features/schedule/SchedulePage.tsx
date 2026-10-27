import { schedulePageTheme as theme } from './SchedulePage.theme';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { movieQueries, MovieArtwork, getMoviePresentation } from '../movies';
import { Button } from '../../shared/ui/Button';
import { StatusMessage } from '../../shared/ui/StatusMessage';
import { DatePicker } from './components/DatePicker';
import { getDemoShowtimes, getScheduleDates } from './model/demoSchedule';
import type { ScheduleMotionSession } from './model/scheduleMotion';
import { useScheduleMotion } from './useScheduleMotion';

export function SchedulePage({ preview = false, motion }: { preview?: boolean; motion: ScheduleMotionSession }) {
  const [dates] = useState(() => getScheduleDates());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const moviesQuery = useQuery(movieQueries.list());
  const movies = moviesQuery.data;
  const selectedDate = dates[selectedIndex];
  const rootRef = useScheduleMotion(motion, preview, selectedDate.key);

  return (
    <div ref={rootRef} className={theme.page}>
      <div className={theme.container}>
        <header className={theme.header} data-schedule-enter="header">
          <Link to="/" className={theme.brand} aria-label="Back to the auditorium">cinema<span className={theme.accent}>R</span></Link>
          <span className={theme.demoBadge}>DEMO SCHEDULE</span>
        </header>

        <div className={theme.intro}>
          <div data-schedule-enter="title">
            <p className={theme.eyebrow}>MOVIES & SHOWTIMES</p>
            {preview ? <h2 className={theme.heading}>Movie schedule</h2> : <h1 className={theme.heading}>Movie schedule</h1>}
            <p className={theme.description}>Choose a date to see the movies and sample showtimes.</p>
          </div>
          <div data-schedule-enter="action"><Button onClick={() => void moviesQuery.refetch()} disabled={moviesQuery.isFetching || moviesQuery.isPaused}>
            {moviesQuery.isPaused ? 'Offline' : moviesQuery.isFetching ? 'Refreshing…' : 'Refresh movies'} <span aria-hidden="true">↻</span>
          </Button></div>
        </div>

        <DatePicker dates={dates} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        <p className={theme.dateNote} data-schedule-enter="note">Sample showtimes only · All times are local to Kyiv · Booking is coming later.</p>
        <p className={theme.selectedDate} data-schedule-enter="selectedDate" aria-live="polite">Showing demo times for {selectedDate.fullLabel}</p>

        <div className={theme.results}>
          {movies === undefined && moviesQuery.isPending && (
            <StatusMessage title={moviesQuery.isPaused ? 'You’re offline.' : 'Loading movies…'}>
              <p>{moviesQuery.isPaused ? 'The catalog will load when you’re connected again.' : 'Loading the movie catalog.'}</p>
            </StatusMessage>
          )}
          {movies === undefined && moviesQuery.isError && (
            <StatusMessage title="Couldn’t load movies" isError>
              <p>The movie catalog could not be loaded. Please try again.</p>
              <Button onClick={() => void moviesQuery.refetch()}>Try again <span aria-hidden="true">↗</span></Button>
            </StatusMessage>
          )}
          {movies !== undefined && (
            <>
              <p className={theme.catalogStatus} role="status">
                {moviesQuery.isPaused ? 'You’re offline. Here’s the last catalog we loaded.'
                  : moviesQuery.isFetching ? 'Updating movies…'
                    : moviesQuery.isError ? 'The refresh didn’t work. Your last catalog is still here; try refreshing again.'
                      : `${movies.length} ${movies.length === 1 ? 'film' : 'films'} available.`}
              </p>
              {movies.length === 0 ? (
                <StatusMessage title="No movies available"><p>No movies are listed yet. Please check again later.</p></StatusMessage>
              ) : (
                <ul className={theme.movieList}>
                  {movies.map((movie, index) => {
                    const presentation = getMoviePresentation(movie.title);
                    const showtimes = getDemoShowtimes(index, selectedIndex);
                    return (
                      <li key={movie.id} className={theme.movieRow} data-schedule-enter="row" data-schedule-key={`row:${movie.id}`} data-schedule-order={index}>
                        <div className={theme.poster} data-schedule-enter="poster" data-schedule-key={`poster:${movie.id}`} data-schedule-order={index}><MovieArtwork title={movie.title} showTitle={false} /></div>
                        <div data-schedule-enter="details" data-schedule-key={`details:${movie.id}`} data-schedule-order={index}>
                          <p className={theme.category}>{presentation.category}</p>
                          <h3 className={theme.movieTitle}>{movie.title}</h3>
                          <p className={theme.metadata}>{movie.durationMinutes} min <span className={theme.separator}>/</span> {showtimes.auditorium}</p>
                          <p className={theme.synopsis}>{presentation.note}</p>
                        </div>
                        <div data-schedule-enter="times" data-schedule-key={`times:${movie.id}`} data-schedule-order={index}>
                          <p className={theme.timesLabel}>SAMPLE SHOWTIMES</p>
                          <ul className={theme.times} data-showtimes aria-label={`Demo showtimes for ${movie.title}`}>
                            {showtimes.times.map((time) => <li key={time}><time className={theme.time} dateTime={`${selectedDate.key}T${time}`}>{time}</time></li>)}
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
