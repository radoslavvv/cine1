import { useEffect, useState } from 'react';
import type { Showtime } from '../types';

// Wake at the next start/end boundary rather than polling every row.
export function useShowtimeClock(showtimes: Showtime[] | undefined) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => setNow(Date.now()), [showtimes]);
  useEffect(() => {
    const current = Date.now();
    const boundaries = (showtimes ?? []).flatMap(showtime => {
      const start = Date.parse(showtime.startsAt);
      return [start, start + showtime.movie.durationMinutes * 60_000];
    }).filter(time => time > now);
    const delay = Math.max(1, Math.min(60_000, ...boundaries.map(time => time - current)));
    const timer = window.setTimeout(() => setNow(Date.now()), delay);
    const sync = () => setNow(Date.now());
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, [showtimes, now]);
  return now;
}
