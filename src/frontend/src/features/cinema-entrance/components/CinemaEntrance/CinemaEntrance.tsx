import { type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Auditorium } from '../Auditorium/Auditorium';
import { useCinemaJourney } from '../../hooks/useCinemaJourney';
import { cinemaEntranceTheme as theme } from './CinemaEntrance.theme';
import { Wordmark } from '../../../../shared/components/Wordmark/Wordmark';

export function CinemaEntrance({ children, onComplete, onScheduleReveal, onScheduleArrival }: { children: ReactNode; onComplete: (scrollOffset: number) => void; onScheduleReveal: () => void; onScheduleArrival: () => void }) {
  const { rootRef, journeyRef, stageRef, scheduleRef } = useCinemaJourney(onComplete, onScheduleReveal, onScheduleArrival);

  return (
    <div ref={rootRef} id="entrance" style={{ '--travel': 0, '--schedule-opacity': 0, '--entrance-hint': 1 } as CSSProperties}>
      <div ref={journeyRef} data-cinema-journey className={theme.journey}>
        <div ref={stageRef} className={theme.stage}>
          <Auditorium />
          <header className={theme.header} style={{ opacity: 'var(--entrance-hint)' }}>
            <h1 className={theme.brand}><span className="sr-only">cinemaR</span><span aria-hidden="true"><Wordmark /></span></h1>
            <Link className={theme.skip} to="/schedule">Schedule <span aria-hidden="true">↗</span></Link>
          </header>
          <Link to="/schedule" aria-label="View movie schedule" className={theme.hint} style={{ opacity: 'var(--entrance-hint)' }}>
            <span className={theme.hintLabel} aria-hidden="true">Enter</span>
            <svg width="16" height="32" viewBox="0 0 16 32" fill="none" aria-hidden="true">
              <path d="M8 1v27m-5-5 5 5 5-5" stroke="currentColor" strokeWidth="1" />
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
