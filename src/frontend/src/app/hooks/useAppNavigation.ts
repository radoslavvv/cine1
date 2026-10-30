import { useCallback, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useAppNavigation() {
  const location = useLocation();
  const searchRef = useRef(location.search);
  searchRef.current = location.search;
  const mainRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const completeEntrance = useCallback(() => {
    navigate(`/schedule${searchRef.current}`);
  }, [navigate]);

  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  const arrive = useCallback((pathname: string) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    mainRef.current?.focus({ preventScroll: true });
    document.title =
      pathname === '/schedule'
        ? 'Movie schedule · cinemaR'
        : pathname.startsWith('/admin')
          ? 'Administration · cinemaR'
        : pathname.startsWith('/booking/confirmation/')
          ? 'Booking confirmed · cinemaR'
          : pathname.startsWith('/booking/')
            ? 'Choose seats · cinemaR'
            : 'cinemaR';
  }, []);

  return {
    mainRef,
    completeEntrance,
    arrive,
  };
}
