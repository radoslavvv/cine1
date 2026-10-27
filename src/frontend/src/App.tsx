import { useEffect, useState } from 'react';
import { getMovies, type Movie } from './movies';

type CatalogState =
  | { status: 'loading' }
  | { status: 'success'; movies: Movie[] }
  | { status: 'error' };

export default function App() {
  const [state, setState] = useState<CatalogState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    getMovies(controller.signal)
      .then((movies) => {
        if (!controller.signal.aborted) setState({ status: 'success', movies });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <div className="page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Frame Cinema home">
          <span className="brand-mark" aria-hidden="true">f.</span> FRAME<span className="brand-subtitle">CINEMA</span>
        </a>
        <span className="header-note">A little escape. A bigger screen.</span>
      </header>
      <main>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">THE MOVIE CATALOG</p>
          <h1 id="page-title">Make room<br />for a good story<span className="accent">.</span></h1>
          <p className="intro-copy">Faraway worlds. Familiar feelings. Discover your next reason to go to the cinema.</p>
        </section>
        <section className="catalog" aria-labelledby="catalog-title" aria-busy={state.status === 'loading'}>
          <div className="section-heading">
            <h2 id="catalog-title">On our screen</h2>
            <span className="section-detail">THE COLLECTION / 01</span>
          </div>
          {state.status === 'loading' && <p className="state-message" role="status">Loading the movie catalog…</p>}
          {state.status === 'error' && (
            <div className="state-message" role="alert">
              <h3>The movie catalog is unavailable.</h3>
              <p>Please try again in a moment.</p>
              <button onClick={() => setAttempt((value) => value + 1)}>Try again <span aria-hidden="true">↗</span></button>
            </div>
          )}
          {state.status === 'success' && state.movies.length === 0 && (
            <p className="state-message" role="status">No movies yet. Check back soon for the next story.</p>
          )}
          {state.status === 'success' && state.movies.length > 0 && (
            <ul className="movie-grid">
              {state.movies.map((movie, index) => (
                <li className="movie-card" key={movie.id}>
                  <div className={`movie-art artwork-${index % 3}`} aria-hidden="true">
                    <span className="art-index">FRAME / {String(index + 1).padStart(2, '0')}</span>
                    <span className="art-orbit" /><span className="art-shape" />
                    <span className="art-title">{movie.title}</span>
                    <span className="art-caption">A STORY WORTH YOUR TIME</span>
                  </div>
                  <div className="movie-details"><h3>{movie.title}</h3><span>{movie.durationMinutes} min</span></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <footer><span>FRAME CINEMA</span><p>Good stories start here.</p><span>THE FIRST CHAPTER</span></footer>
    </div>
  );
}
