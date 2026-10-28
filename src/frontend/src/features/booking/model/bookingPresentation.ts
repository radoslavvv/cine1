import type { Seat } from '../types';

export const MAX_SEATS = 8;
export interface SeatPresentation extends Seat {
  selected: boolean;
  disabled: boolean;
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Kyiv',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
export function formatBookingDate(startsAt: string) {
  return dateFormat.format(new Date(startsAt));
}

export function prepareSeats(
  seats: Seat[],
  selectedSeats: Seat[],
  isOpen: boolean,
): SeatPresentation[] {
  const selectedIds = new Set(selectedSeats.map((seat) => seat.id));
  return seats.map((seat) => ({
    ...seat,
    selected: selectedIds.has(seat.id),
    disabled:
      seat.taken ||
      !isOpen ||
      (!selectedIds.has(seat.id) && selectedSeats.length >= MAX_SEATS),
  }));
}
