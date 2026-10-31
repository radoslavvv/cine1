export interface Seat {
  id: number;
  rowLabel: string;
  number: number;
  gridRow: number;
  gridColumn: number;
  taken: boolean;
}

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

export interface BookingHistory {
  items: BookingConfirmation[];
  hasMore: boolean;
}
