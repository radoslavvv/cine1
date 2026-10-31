export interface AdminBooking {
  id: string;
  email: string;
  confirmedAt: string;
  showtimeId: number;
  movieTitle: string;
  auditoriumName: string;
  startsAt: string;
  isCancelled: boolean;
  seats: string[];
}
