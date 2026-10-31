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
