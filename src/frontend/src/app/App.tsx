import { appTheme as theme } from './App.theme';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { CinemaEntrance } from '../features/cinema-entrance';
import { SchedulePage } from '../features/schedule';

export function App() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const handoffOffset = useRef<number | null>(null);
  const completeEntrance = useCallback((offset: number) => {
    handoffOffset.current = offset;
    navigate('/schedule');
  }, [navigate]);

  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => { history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    // The preview may already have scrolled above the viewport during damping.
    // Consume its offset before paint instead of snapping the schedule to zero.
    window.scrollTo({ top: handoffOffset.current ?? 0, behavior: 'instant' });
    handoffOffset.current = null;
    mainRef.current?.focus({ preventScroll: true });
    document.title = location.pathname === '/schedule' ? 'Movie schedule · cinemaR' : 'cinemaR';
  }, [location.key, location.pathname]);

  return (
    <main ref={mainRef} tabIndex={-1} className={theme.main}>
      <Routes>
        <Route path="/" element={<CinemaEntrance onComplete={completeEntrance}><SchedulePage preview /></CinemaEntrance>} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="*" element={<div className={theme.notFound}><h1 className={theme.heading}>Page not found</h1><Link className={theme.link} to="/schedule">View schedule</Link></div>} />
      </Routes>
    </main>
  );
}
