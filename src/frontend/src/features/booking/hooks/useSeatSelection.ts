import { useEffect, useState } from 'react';
import type { SeatMap } from '../types';

export const MAX_SEATS = 8;

export function useSeatSelection(map: SeatMap, clockOffsetMs: number) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [now, setNow] = useState(Date.now);
  const startsAt = Date.parse(map.startsAt);
  const isOpen = map.selectionOpen && now + clockOffsetMs < startsAt;

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1_000);
    const timeout = window.setTimeout(update, Math.max(0, Math.min(2_147_483_647, startsAt - Date.now() - clockOffsetMs)));
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [startsAt, clockOffsetMs]);

  // A closed showtime has no active selection, even if it was selected before start.
  const selectedSeats = isOpen ? map.seats.filter(seat => selectedIds.includes(seat.id)) : [];

  const toggle = (id: number) => {
    const currentTime = Date.now();
    setNow(currentTime);
    if (!map.selectionOpen || currentTime + clockOffsetMs >= startsAt) return;
    if (!map.seats.some(seat => seat.id === id)) return;
    setSelectedIds(previous => previous.includes(id)
      ? previous.filter(selected => selected !== id)
      : previous.length < MAX_SEATS ? [...previous, id] : previous);
  };

  return { selectedSeats, isOpen, toggle, clear: () => setSelectedIds([]) };
}
