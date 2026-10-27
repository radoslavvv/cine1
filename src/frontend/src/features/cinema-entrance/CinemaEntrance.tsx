import type { CSSProperties, ReactNode } from 'react';
import { Auditorium } from './components/Auditorium';
import { useCinemaJourney } from './useCinemaJourney';

export function CinemaEntrance({ children }: { children: ReactNode }) {
  const { rootRef, journeyRef, stageRef, scheduleRef, skipToSchedule } = useCinemaJourney();

  return (
    <div ref={rootRef} id="entrance" style={{ '--travel': 0, '--schedule-opacity': 0, '--entrance-hint': 1 } as CSSProperties}>
      <a className="fixed top-5 right-5 z-50 rounded-full border border-ivory/20 bg-lobby/80 px-4 py-2.5 text-xs text-ivory backdrop-blur-md hover:border-amber/60 hover:text-amber sm:top-7 sm:right-9" href="#schedule" onClick={(event) => { event.preventDefault(); skipToSchedule(); }}>Skip to schedule <span aria-hidden="true">↗</span></a>

      <div ref={journeyRef} data-cinema-journey className="relative h-[300svh] motion-reduce:h-svh">
        <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden">
          <Auditorium />
          <div className="absolute top-7 left-6 z-40 text-ivory sm:left-10" style={{ opacity: 'var(--entrance-hint)' }}>
            <p className="text-lg font-medium tracking-[0.16em]">frame<span className="text-amber">.</span></p>
            <p className="mt-1.5 font-label text-[8px] tracking-[0.24em] text-muted">A CINEMA ESCAPE</p>
          </div>
          <div className="absolute inset-x-5 bottom-9 z-40 text-center" style={{ opacity: 'var(--entrance-hint)' }}>
            <h1 className="font-display text-3xl text-ivory drop-shadow-lg sm:text-4xl">The outside can wait.</h1>
            <p className="mt-3 font-label text-[9px] tracking-[0.2em] text-amber-light motion-reduce:hidden">SCROLL INTO ANOTHER WORLD <span className="ml-2" aria-hidden="true">↓</span></p>
            <p className="mt-3 hidden text-xs text-muted motion-reduce:block">Your next escape is just below.</p>
          </div>
        </div>
      </div>

      <section ref={scheduleRef} id="schedule" tabIndex={-1} inert aria-hidden="true" aria-label="Movie schedule" className="relative z-40 -mt-[100svh] min-h-svh bg-lobby outline-none motion-reduce:mt-0" style={{ opacity: 'var(--schedule-opacity)' }}>
        {children}
      </section>
    </div>
  );
}
