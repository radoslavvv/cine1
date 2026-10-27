import { type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Auditorium } from './components/Auditorium';
import { useCinemaJourney } from './useCinemaJourney';
import { cinemaEntranceTheme as theme } from './CinemaEntrance.theme';

export function CinemaEntrance({ children, onComplete, onScheduleReveal }: { children: ReactNode; onComplete: (scrollOffset: number) => void; onScheduleReveal: () => void }) {
  const { rootRef, journeyRef, stageRef, scheduleRef } = useCinemaJourney(onComplete, onScheduleReveal);

  return (
    <div ref={rootRef} id="entrance" style={{ '--travel': 0, '--schedule-opacity': 0, '--entrance-hint': 1 } as CSSProperties}>
      <Link className={theme.skip} to="/schedule">Skip to schedule <span aria-hidden="true">↗</span></Link>
      <div ref={journeyRef} data-cinema-journey className={theme.journey}>
        <div ref={stageRef} className={theme.stage}>
          <Auditorium />
          <div className={theme.brand} style={{ opacity: 'var(--entrance-hint)' }}>
            <h1 className={theme.wordmark}>cinema<span className={theme.accent}>R</span></h1>
          </div>
          <Link to="/schedule" aria-label="View movie schedule" className={theme.hint} style={{ opacity: 'var(--entrance-hint)' }}>
            <svg className={theme.chevrons} width="24" height="34" viewBox="0 0 24 34" fill="none" aria-hidden="true">
              <path d="m5 9 7 7 7-7M5 19l7 7 7-7" stroke="currentColor" strokeWidth="1.25" />
            </svg>
          </Link>
        </div>
      </div>
      <section ref={scheduleRef} id="schedule" inert aria-hidden="true" aria-label="Movie schedule preview" className={theme.schedule} style={{ opacity: 'var(--schedule-opacity)' }}>
        {children}
      </section>
    </div>
  );
}
