import type { BookingConfirmation } from './BookingConfirmation';

export interface BookingHistory {
  items: BookingConfirmation[];
  hasMore: boolean;
}
