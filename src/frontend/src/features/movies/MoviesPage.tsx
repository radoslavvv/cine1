import { useQuery } from '@tanstack/react-query';
import { Button } from '../../shared/ui/Button';
import { movieQueries } from './api/movieQueries';
import { CatalogMessage } from './components/CatalogMessage';
import { MovieCard } from './components/MovieCard';
import { FeaturedMovie } from './components/FeaturedMovie';

export function MoviesPage() {
  const moviesQuery = useQuery(movieQueries.list());
  const movies = moviesQuery.data;

  return (
    <>
      <div className="flex items-center justify-between gap-4 py-6 sm:py-8">
        <p className="font-label text-[9px] tracking-[0.15em] text-muted">WELCOME TO YOUR HAPPY DARK PLACE.</p>
        <span className="hidden font-label text-[9px] tracking-wider text-amber/80 sm:block">TAKE A BREATH. TAKE IT ALL IN.</span>
      </div>
      <FeaturedMovie movie={movies?.[0]} />
      <div className="my-8 flex items-center gap-4 sm:my-10" aria-hidden="true"><div className="aisle-glow h-px flex-1 opacity-40" /><span className="text-[11px] text-amber/60">✧</span><div className="aisle-glow h-px flex-1 opacity-40" /></div>

      <section id="movies" aria-labelledby="catalog-title">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="mb-2 font-label text-[9px] tracking-[0.2em] text-amber">THE COLLECTION</p><h2 id="catalog-title" className="font-display text-3xl tracking-tight sm:text-4xl">Big screen. Bigger feelings.</h2></div>
          <Button onClick={() => void moviesQuery.refetch()} disabled={moviesQuery.isFetching || moviesQuery.isPaused}>
            {moviesQuery.isPaused ? 'Offline' : moviesQuery.isFetching ? 'Refreshing…' : 'Refresh movies'}
            <span aria-hidden="true">↻</span>
          </Button>
        </div>

        <div className="mt-6 sm:mt-7">
        {movies === undefined && moviesQuery.isPending && (
          <CatalogMessage title={moviesQuery.isPaused ? 'You’re offline.' : 'Warming up the projector…'}>
            <p>{moviesQuery.isPaused ? 'The catalog will load when you’re connected again.' : 'Loading the movie catalog. We’ll save you some popcorn.'}</p>
          </CatalogMessage>
        )}
        {movies === undefined && moviesQuery.isError && (
          <CatalogMessage title="A small plot complication." isError>
            <p>We couldn’t load the movies. Give the catalog another take.</p>
            <Button onClick={() => void moviesQuery.refetch()} disabled={moviesQuery.isFetching}>Try again <span aria-hidden="true">↗</span></Button>
          </CatalogMessage>
        )}

        {movies !== undefined && (
          <>
            <div className="mb-5 min-h-4 font-label text-[10px] leading-relaxed text-muted" role="status">
              {moviesQuery.isPaused
                ? 'You’re offline. Here’s the last catalog we loaded.'
                : moviesQuery.isFetching
                  ? 'Checking the collection for updates…'
                  : moviesQuery.isError
                    ? 'The refresh didn’t work. Your last catalog is still here; try refreshing again.'
                    : `${movies.length} ${movies.length === 1 ? 'film' : 'films'} to get wonderfully lost in.`}
            </div>
            {movies.length === 0 ? (
              <CatalogMessage title="An unexpected intermission.">
                <p>The collection is empty for now. Check back soon for the next good story.</p>
              </CatalogMessage>
            ) : (
              <ul className="grid grid-cols-1 gap-x-6 gap-y-10 min-[420px]:grid-cols-2 sm:gap-x-7 md:grid-cols-3 lg:max-w-250 lg:gap-x-9">{movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}</ul>
            )}
          </>
        )}
        </div>
      </section>

      <aside className="relative mt-14 overflow-hidden rounded-xl border border-edge/80 bg-carpet sm:mt-18" aria-label="The cinema feeling">
        <div className="absolute inset-0 bg-linear-to-r from-surface via-surface/95 to-surface/70" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-5 px-6 py-7 sm:px-9">
          <div className="flex items-center gap-5"><span className="text-3xl text-amber/85" aria-hidden="true">✳</span><div><h2 className="font-display text-xl">Some things deserve the whole room.</h2><p className="mt-1.5 text-xs leading-relaxed text-muted">The hush before the film. The shared laugh. The popcorn you said you’d share.</p></div></div>
          <span className="font-label text-[8px] tracking-[0.2em] text-amber">STAY A LITTLE LONGER.</span>
        </div>
      </aside>
    </>
  );
}
