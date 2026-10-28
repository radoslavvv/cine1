import { type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { Auditorium } from '../Auditorium/Auditorium';
import { cinemaEntranceTheme as theme } from './CinemaEntrance.theme';
import { Wordmark } from '../../../../shared/components/Wordmark/Wordmark';

export function CinemaEntrance({
  children,
  rootRef,
  journeyRef,
  stageRef,
  scheduleRef,
  scheduleHref,
}: {
  children: ReactNode;
  rootRef: RefObject<HTMLDivElement | null>;
  journeyRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  scheduleRef: RefObject<HTMLElement | null>;
  scheduleHref: string;
}) {
  return (
    <div
      ref={rootRef}
      id="entrance"
      style={
        {
          '--travel': 0,
          '--schedule-opacity': 0,
          '--entrance-hint': 1,
        } as CSSProperties
      }
    >
      <div ref={journeyRef} data-cinema-journey className={theme.journey}>
        <div ref={stageRef} className={theme.stage}>
          <h1 className="sr-only">
            cinemaR — Your next great film experience waits for you.
          </h1>
          <div className={theme.scene}>
            <Auditorium />
          </div>
          <div
            aria-hidden="true"
            className={theme.frame}
            style={{ opacity: 'var(--entrance-hint)' }}
          >
            <span className={theme.cornerTopLeft} />
            <span className={theme.cornerTopRight} />
            <span className={theme.cornerBottomLeft} />
            <span className={theme.cornerBottomRight} />
          </div>
          <header
            className={theme.header}
            data-entrance-controls
            style={{ opacity: 'var(--entrance-hint)' }}
          >
            <Link to="/" aria-label="cinemaR home" className={theme.brand}>
              <svg
                className={theme.emblem}
                viewBox="0 0 40 40"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 3H3v9m25-9h9v9M3 28v9h9m25-9v9h-9"
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <path
                  d="M24 11a11 11 0 1 0 0 18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="m20 13 10 7-10 7V13Z"
                  fill="currentColor"
                  fillOpacity=".8"
                />
              </svg>
              <span aria-hidden="true">
                <Wordmark />
              </span>
            </Link>

            <nav aria-label="Movie schedule" className={theme.rightNav}>
              <Link className={theme.skip} to={scheduleHref}>
                Schedule <span aria-hidden="true">↗</span>
              </Link>
            </nav>
          </header>
          <div
            aria-hidden="true"
            className={theme.hint}
            style={{ opacity: 'var(--entrance-hint)' }}
          >
            <span className={theme.hintContent}>
              <span className={theme.hintLabel} aria-hidden="true">
                Scroll to discover
              </span>
              <svg
                width="16"
                height="32"
                viewBox="0 0 16 32"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8 1v27m-5-5 5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
      <section
        ref={scheduleRef}
        id="schedule"
        inert
        aria-hidden="true"
        aria-label="Movie schedule preview"
        className={theme.schedule}
        style={{ opacity: 'var(--schedule-opacity)' }}
      >
        {children}
      </section>
    </div>
  );
}
