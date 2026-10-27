export interface Seat {
  id: number;
  rowLabel: string;
  number: number;
  gridRow: number;
  gridColumn: number;
}

export interface SeatMap {
  showtimeId: number;
  startsAt: string;
  serverNow: string;
  selectionOpen: boolean;
  movie: { id: number; title: string; durationMinutes: number; genres: string[] };
  auditorium: { id: number; name: string };
  seats: Seat[];
}
