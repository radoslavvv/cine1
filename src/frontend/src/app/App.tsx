import { MoviesPage } from '../features/movies';

export function App() {
  return (
    <div className="relative isolate min-h-screen overflow-clip">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-carpet opacity-50" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-full max-w-355 -translate-x-1/2 bg-lobby shadow-[0_0_120px_90px_#0e0b15]" aria-hidden="true" />
      <a className="fixed top-3 left-3 z-50 -translate-y-24 rounded-md bg-amber px-5 py-3 text-sm font-bold text-lobby focus:translate-y-0" href="#main">Skip to movies</a>
      <div className="mx-auto max-w-7xl px-5 sm:px-9 lg:px-14">
        <header className="flex min-h-24 items-center justify-between gap-5 border-b border-edge/70 sm:min-h-28">
          <a className="flex shrink-0 items-center gap-3 no-underline" href="/" aria-label="Frame Cinema home">
            <span className="grid size-9 place-items-center rounded-t-full border border-amber/65 text-xl text-amber shadow-marquee" aria-hidden="true">f.</span>
            <span className="text-xl font-semibold tracking-[0.13em]">frame<span className="text-amber">.</span><small className="mt-1 block font-label text-[8px] font-normal tracking-[0.32em] text-muted">A CINEMA ESCAPE</small></span>
          </a>
          <nav aria-label="Main navigation" className="flex items-center gap-6 text-xs sm:gap-9">
            <a className="relative py-3 text-ivory after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-amber" href="#main">The lobby</a>
            <a className="py-3 text-muted transition-colors hover:text-amber" href="#movies">The films</a>
          </nav>
          <span className="hidden items-center gap-2 font-label text-[9px] tracking-widest text-muted lg:flex"><span className="size-1.5 rounded-full bg-amber shadow-[0_0_9px_#e9b67570]" aria-hidden="true" /> THE OUTSIDE CAN WAIT</span>
        </header>
        <main id="main" tabIndex={-1}><MoviesPage /></main>
        <footer className="mt-14 border-t border-edge/80 py-8 sm:mt-20">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
            <a className="font-display text-2xl text-ivory" href="/" aria-label="Frame Cinema home">frame<span className="text-amber">.</span></a>
            <p className="text-xs text-muted">For the love of the big screen.</p>
            <span className="font-label text-[9px] tracking-[0.12em] text-muted">GOOD FILMS. QUESTIONABLE CARPET.</span>
          </div>
          <div className="mt-7 h-1.5 rounded-full bg-carpet opacity-70" aria-hidden="true" />
        </footer>
      </div>
    </div>
  );
}
