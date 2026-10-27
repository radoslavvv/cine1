import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createScheduleMotionSession } from '../../features/schedule';
import { lockPageScroll } from '../../shared/hooks/usePageScrollLock';

export function useAppNavigation() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const [scheduleMotion] = useState(createScheduleMotionSession);
  const handoffOffset = useRef<number | null>(null);
  const arrival = useRef(false);
  const unlockArrival = useRef<(() => void) | null>(null);

  const beginArrival = useCallback(() => {
    arrival.current = true;
    // The native scroll event must acquire the lock synchronously, before paint.
    unlockArrival.current ??= lockPageScroll(document.documentElement, window);
  }, []);

  const releaseArrival = useCallback(() => {
    unlockArrival.current?.();
    unlockArrival.current = null;
  }, []);

  useLayoutEffect(() => releaseArrival, [releaseArrival]);

  const completeEntrance = useCallback(
    (offset: number) => {
      handoffOffset.current = arrival.current ? 0 : offset;
      navigate('/schedule');
    },
    [navigate],
  );

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
      releaseArrival();
    }

    if (location.pathname === '/') {
      scheduleMotion.reset();
    }

    // Scroll arrivals hold at the top until data and entrance effects are ready.
    window.scrollTo({ top: handoffOffset.current ?? 0, behavior: 'instant' });
    handoffOffset.current = null;
    mainRef.current?.focus({ preventScroll: true });
    document.title =
      location.pathname === '/schedule'
        ? 'Movie schedule · cinemaR'
        : location.pathname.startsWith('/booking/')
          ? 'Choose seats · cinemaR'
          : 'cinemaR';
  }, [location.key, location.pathname, scheduleMotion, releaseArrival]);

  return {
    mainRef,
    scheduleMotion,
    beginArrival,
    releaseArrival,
    completeEntrance,
  };
}
