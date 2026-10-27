import type { Movie } from '../types';
import { getMoviePresentation } from '../presentation';
import { MovieArtwork } from './MovieArtwork';

interface MovieCardProps { movie: Movie; }

export function MovieCard({ movie }: MovieCardProps) {
  const presentation = getMoviePresentation(movie.title);

  return (
    <li className="min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-edge bg-surface shadow-screen">
        <MovieArtwork title={movie.title} />
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5" aria-hidden="true" />
        <span className="absolute top-3 left-3 rounded border border-white/10 bg-lobby/70 px-2.5 py-1.5 font-label text-[9px] tracking-wider text-ivory backdrop-blur-sm">FRAME SELECTS</span>
      </div>
      <div className="mt-5 flex items-start justify-between gap-3">
        <h3 className="text-base leading-snug font-medium text-ivory sm:text-lg">{movie.title}</h3>
        <span className="shrink-0 pt-1 font-label text-[10px] text-muted">{movie.durationMinutes} min</span>
      </div>
      <p className="mt-2 font-label text-[8px] tracking-[0.12em] text-amber/90 sm:text-[9px]">{presentation.category}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{presentation.note}</p>
    </li>
  );
}
