export const cinemaFormats = ['2D', '3D', 'IMAX 2D', 'IMAX 3D'] as const;
export interface AdminMovie {
  id: number;
  title: string;
  durationMinutes: number;
  genres: string[];
  synopsis: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  isArchived: boolean;
  isUsed: boolean;
}
export interface AdminSeat {
  rowLabel: string;
  number: number;
  gridRow: number;
  gridColumn: number;
}
export interface AdminAuditorium {
  id: number;
  name: string;
  supportedFormats: string[];
  isRetired: boolean;
  layoutLocked: boolean;
  isUsed: boolean;
  seats: AdminSeat[];
}
export interface AdminCatalog {
  movies: AdminMovie[];
  auditoriums: AdminAuditorium[];
}
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
export interface BookingPage {
  page: number;
  pageSize: number;
  total: number;
  items: AdminBooking[];
}
export interface BookingFilters {
  search: string;
  date: string;
  movieId: string;
  auditoriumId: string;
  status: string;
  page: number;
}
export interface MovieDraft {
  title: string;
  durationMinutes: number;
  genres: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
}
export interface AuditoriumDraft {
  name: string;
  rows: number;
  seatsPerRow: number;
  supportedFormats: string[];
}
export interface ShowtimeDraft {
  movieId: string;
  auditoriumId: string;
  format: string;
  localTime: string;
  dates: string[];
}
