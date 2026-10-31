import type { Seat } from './Seat';

export interface SeatMap {
  showtimeId: number;
  startsAt: string;
  serverNow: string;
  selectionOpen: boolean;
  movie: {
    id: number;
    title: string;
    durationMinutes: number;
    genres: string[];
    posterUrl?: string | null;
    backdropUrl?: string | null;
  };
  auditorium: { id: number; name: string };
  seats: Seat[];
}
