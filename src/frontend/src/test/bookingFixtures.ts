import type { SeatMap } from '../features/booking/types';

export function seatMap(): SeatMap {
  return {
    showtimeId: 1,
    startsAt: '2026-10-30T12:01:00Z',
    serverNow: '2026-10-30T12:00:00Z',
    selectionOpen: true,
    movie: { id: 1, title: 'Example', durationMinutes: 100, genres: ['Drama'] },
    auditorium: { id: 1, name: 'Screen 1' },
    seats: Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      rowLabel: 'A',
      number: index + 1,
      gridRow: 0,
      gridColumn: index,
      taken: index === 9,
    })),
  };
}
