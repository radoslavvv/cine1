import type { AdminBooking } from './AdminBooking';

export interface BookingPage {
  page: number;
  pageSize: number;
  total: number;
  items: AdminBooking[];
}
