export interface AdminShowtime {
  id: number;
  movieId: number;
  movieTitle: string;
  auditoriumId: number;
  auditoriumName: string;
  startsAt: string;
  occupiedUntil: string;
  durationMinutes: number;
  format: string;
  isCancelled: boolean;
  bookingCount: number;
}
export interface ShowtimeDraft {
  movieId: string;
  auditoriumId: string;
  format: string;
  localTime: string;
  dates: string[];
}
