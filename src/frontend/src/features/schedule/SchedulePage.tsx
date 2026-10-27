import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { movieQueries, MovieArtwork, getMoviePresentation } from '../movies';
import { Button } from '../../shared/ui/Button';
import { StatusMessage } from '../../shared/ui/StatusMessage';
import { DatePicker } from './components/DatePicker';
import { getDemoShowtimes, getScheduleDates } from './model/demoSchedule';

export function SchedulePage() {
  const [dates] = useState(() => getScheduleDates());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const moviesQuery = useQuery(movieQueries.list());
  const movies = moviesQuery.data;
  const selectedDate = dates[selectedIndex];

  return (
    <div className="ceiling-lights min-h-svh">
      <div className="mx-auto max-w-6xl px-5 pt-24 pb-12 sm:px-10 sm:pt-28">
        <header className="flex items-center gap-4 border-b border-edge pb-6">
          <a href="#entrance" className="font-display text-2xl text-ivory" aria-label="Back to the auditorium">frame<span className="text-amber">.</span></a>
          <span className="ml-auto rounded-full border border-amber/25 px-3 py-1.5 font-label text-[9px] tracking-wider text-amber">DEMO SCHEDULE</span>
        </header>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 font-label text-[9px] tracking-[0.25em] text-amber">YOU’VE ARRIVED. GET COMFORTABLE.</p>
            <h2 className="font-display text-4xl tracking-tight text-ivory sm:text-5xl">What’s on the big screen?</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted">Pick a day. Find your kind of escape. We’ll handle the questionable carpet.</p>
          </div>
          <Button onClick={() => void moviesQuery.refetch()} disabled={moviesQuery.isFetching || moviesQuery.isPaused}>
            {moviesQuery.isPaused ? 'Offline' : moviesQuery.isFetching ? 'Refreshing…' : 'Refresh movies'} <span aria-hidden="true">↻</span>
          </Button>
        </div>

        <DatePicker dates={dates} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        <p className="mt-4 text-xs leading-relaxed text-muted">Sample showtimes only · All times are local to Kyiv · Booking is coming later.</p>
        <p className="mt-7 border-t border-edge pt-5 font-label text-[10px] text-ivory" aria-live="polite">Showing demo times for {selectedDate.fullLabel}</p>

        <div className="mt-5">
          {movies === undefined && moviesQuery.isPending && (
            <StatusMessage title={moviesQuery.isPaused ? 'You’re offline.' : 'Warming up the projector…'}>
              <p>{moviesQuery.isPaused ? 'The catalog will load when you’re connected again.' : 'Loading the movie catalog. We’ll save you some popcorn.'}</p>
            </StatusMessage>
          )}
          {movies === undefined && moviesQuery.isError && (
            <StatusMessage title="A small plot complication." isError>
              <p>We couldn’t load the movies. Give the catalog another take.</p>
              <Button onClick={() => void moviesQuery.refetch()}>Try again <span aria-hidden="true">↗</span></Button>
            </StatusMessage>
          )}
          {movies !== undefined && (
            <>
              <p className="mb-5 min-h-4 text-xs leading-relaxed text-muted" role="status">
                {moviesQuery.isPaused ? 'You’re offline. Here’s the last catalog we loaded.'
                  : moviesQuery.isFetching ? 'Checking the collection for updates…'
                    : moviesQuery.isError ? 'The refresh didn’t work. Your last catalog is still here; try refreshing again.'
                      : `${movies.length} ${movies.length === 1 ? 'film' : 'films'} to get wonderfully lost in.`}
              </p>
              {movies.length === 0 ? (
                <StatusMessage title="An unexpected intermission."><p>No movies are available yet. Check back soon for the next good story.</p></StatusMessage>
              ) : (
                <ul className="divide-y divide-edge border-y border-edge">
                  {movies.map((movie, index) => {
                    const presentation = getMoviePresentation(movie.title);
                    const showtimes = getDemoShowtimes(index, selectedIndex);
                    return (
                      <li key={movie.id} className="grid grid-cols-[72px_1fr] gap-x-5 gap-y-4 py-7 sm:grid-cols-[100px_1fr] sm:gap-x-7 lg:grid-cols-[100px_1fr_auto] lg:items-center">
                        <div className="relative row-span-2 aspect-[2/3] overflow-hidden rounded-lg border border-edge bg-surface lg:row-span-1"><MovieArtwork title={movie.title} showTitle={false} /></div>
                        <div>
                          <p className="mb-2 font-label text-[8px] tracking-wider text-amber">{presentation.category}</p>
                          <h3 className="text-lg font-medium text-ivory sm:text-xl">{movie.title}</h3>
                          <p className="mt-2 text-xs text-muted">{movie.durationMinutes} min <span className="mx-2 text-edge">/</span> {showtimes.auditorium}</p>
                          <p className="mt-2 hidden text-xs text-muted sm:block">{presentation.note}</p>
                        </div>
                        <div>
                          <p className="mb-2 font-label text-[8px] tracking-widest text-muted">SAMPLE SHOWTIMES</p>
                          <ul className="flex flex-wrap gap-2" aria-label={`Demo showtimes for ${movie.title}`}>
                            {showtimes.times.map((time) => <li key={time}><time className="block rounded-md border border-amber/25 bg-amber/5 px-3 py-2 font-label text-xs text-amber-light" dateTime={`${selectedDate.key}T${time}`}>{time}</time></li>)}
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

        <footer className="mt-12 border-t border-edge pt-7">
          <div className="flex flex-wrap items-center justify-between gap-5 text-xs text-muted"><span>For the love of the big screen.</span><span className="font-label text-[9px] text-amber/80">GOOD FILMS. QUESTIONABLE CARPET.</span></div>
          <div className="mt-6 h-3 rounded bg-carpet" aria-hidden="true" />
        </footer>
      </div>
    </div>
  );
}
