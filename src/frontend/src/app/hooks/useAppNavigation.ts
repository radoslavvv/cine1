import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createScheduleMotionSession } from '../../features/schedule';
import { usePageScrollLock } from '../../shared/hooks/usePageScrollLock';

export function useAppNavigation() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const [scheduleMotion] = useState(createScheduleMotionSession);
  const handoffOffset = useRef<number | null>(null);
  const arrival = useRef(false);
  const [arrivalLocked, setArrivalLocked] = useState(false);

  usePageScrollLock(arrivalLocked);

  const beginArrival = useCallback(() => {
    arrival.current = true;
    setArrivalLocked(true);
  }, []);

  const releaseArrival = useCallback(() => setArrivalLocked(false), []);

  const completeEntrance = useCallback((offset: number) => {
    handoffOffset.current = arrival.current ? 0 : offset;
    navigate('/schedule');
  }, [navigate]);

  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    if (location.pathname !== '/schedule') {
      arrival.current = false;
      setArrivalLocked(false);
    }

    if (location.pathname === '/') {
      scheduleMotion.reset();
    }

    // Scroll arrivals hold at the top until data and entrance effects are ready.
    window.scrollTo({ top: handoffOffset.current ?? 0, behavior: 'instant' });
    handoffOffset.current = null;
    mainRef.current?.focus({ preventScroll: true });
    document.title = location.pathname === '/schedule' ? 'Movie schedule · cinemaR' : 'cinemaR';
  }, [location.key, location.pathname, scheduleMotion]);


  return { mainRef, scheduleMotion, beginArrival, releaseArrival, completeEntrance };
}
