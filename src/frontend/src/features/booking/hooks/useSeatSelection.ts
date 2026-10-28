import { useEffect, useState } from 'react';
import type { SeatMap } from '../types';

import { MAX_SEATS } from '../model/bookingPresentation';

export { MAX_SEATS } from '../model/bookingPresentation';

export function useSeatSelection(
  map: SeatMap | undefined,
  clockOffsetMs: number,
) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [now, setNow] = useState(Date.now);
  const startsAt = map ? Date.parse(map.startsAt) : NaN;
  const isOpen = !!map?.selectionOpen && now + clockOffsetMs < startsAt;

  useEffect(() => {
    if (!Number.isFinite(startsAt)) return;
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1_000);
    const timeout = window.setTimeout(
      update,
      Math.max(
        0,
        Math.min(2_147_483_647, startsAt - Date.now() - clockOffsetMs),
      ),
    );
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
  const selectedSeats = isOpen
    ? map!.seats.filter((seat) => !seat.taken && selectedIds.includes(seat.id))
    : [];

  const toggle = (id: number) => {
    const currentTime = Date.now();
    setNow(currentTime);
    if (!map || !map.selectionOpen || currentTime + clockOffsetMs >= startsAt)
      return;
    if (!map.seats.some((seat) => seat.id === id && !seat.taken)) return;
    setSelectedIds((previous) => {
      const available = previous.filter((selected) =>
        map.seats.some((seat) => seat.id === selected && !seat.taken),
      );
      return available.includes(id)
        ? available.filter((selected) => selected !== id)
        : available.length < MAX_SEATS
          ? [...available, id]
          : available;
    });
  };

  return { selectedSeats, isOpen, toggle, clear: () => setSelectedIds([]) };
}
