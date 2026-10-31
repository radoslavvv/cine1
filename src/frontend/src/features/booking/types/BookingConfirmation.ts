export interface BookingConfirmation {
  isCancelled?: boolean;
  confirmationToken: string;
  confirmedAt: string;
  email: string;
  showtimeId: number;
  startsAt: string;
  movieTitle: string;
  auditoriumName: string;
  tickets: {
    seatId: number;
    rowLabel: string;
    number: number;
    ticketCode: string;
  }[];
}
