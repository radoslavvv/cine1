import type { Movie } from '../types';
import { MovieArtwork } from './MovieArtwork';

export function FeaturedMovie({ movie }: { movie?: Movie }) {
  return (
    <section className="relative isolate min-h-125 overflow-hidden rounded-2xl border border-edge/80 bg-surface shadow-screen sm:min-h-130 lg:min-h-135" aria-labelledby="page-title">
      {movie ? <MovieArtwork title={movie.title} variant="backdrop" /> : <div className="ceiling-lights absolute inset-0 bg-surface" aria-hidden="true" />}
      <div className="screen-vignette absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-amber/50 to-transparent" aria-hidden="true" />
      <div className="relative flex min-h-125 flex-col justify-between p-7 sm:min-h-130 sm:p-11 lg:min-h-135 lg:p-14">
        <p className="flex items-center gap-3 font-label text-[9px] tracking-[0.22em] text-amber-light"><span className="h-px w-6 bg-amber/60" aria-hidden="true" /> THE FRAME EXPERIENCE</p>
        <div className="mt-12 max-w-xl">
          <h1 id="page-title" className="font-display text-[clamp(2.8rem,5.5vw,5rem)] leading-[1.06] tracking-[-0.04em] text-ivory">Leave ordinary<br />at the <em className="font-normal text-amber-light">door.</em></h1>
          <p className="mt-5 max-w-75 text-sm leading-7 text-ivory/70 sm:max-w-88">Dim lights. Ridiculous carpets. That first handful of popcorn. You know the feeling.</p>
          <a className="mt-7 inline-flex min-h-11 items-center gap-8 rounded-lg border border-amber/80 bg-amber px-5 py-3 text-xs font-semibold text-lobby shadow-marquee transition-colors hover:bg-amber-light" href="#movies">Find your next escape <span aria-hidden="true">↗</span></a>
        </div>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
          <span className="font-label text-[8px] tracking-[0.16em] text-muted">A LITTLE FURTHER FROM EVERYDAY.</span>
          {movie && <div className="border-l border-amber/40 pl-4 text-right"><p className="mb-1 font-label text-[8px] tracking-[0.2em] text-amber">IN THE SPOTLIGHT</p><p className="font-display text-xl text-ivory">{movie.title}</p></div>}
        </div>
      </div>
    </section>
  );
}
