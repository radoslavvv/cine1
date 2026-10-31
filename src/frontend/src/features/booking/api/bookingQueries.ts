import { queryOptions } from '@tanstack/react-query';
import type { BookingConfirmation, SeatMap } from '../types';
import { securityFetch } from '../../auth/api/authApi';

export class SeatMapError extends Error {
  constructor(public readonly status: number) {
    super(`Seat map request failed (${status}).`);
  }
}

export const bookingQueries = {
  confirmation: (token: string) =>
    queryOptions({
      queryKey: ['booking-confirmation', token],
      queryFn: async ({ signal }) => {
        const response = await fetch(
          `/api/bookings/${encodeURIComponent(token)}`,
          { signal, cache: 'no-store' },
        );

        if (!response.ok) {
          throw new SeatMapError(response.status);
        }

        return (await response.json()) as BookingConfirmation;
      },
      retry: (count, error) =>
        count < 1 && !(error instanceof SeatMapError && error.status < 500),
    }),
  seats: (showtimeId: string) =>
    queryOptions({
      queryKey: ['seat-map', showtimeId],
      queryFn: async ({ signal }) => {
        const response = await fetch(
          `/api/showtimes/${encodeURIComponent(showtimeId)}/seats`,
          {
            signal,
            cache: 'no-store',
          },
        );

        if (!response.ok) {
          throw new SeatMapError(response.status);
        }

        const map = (await response.json()) as SeatMap;

        return {
          ...map,
          clockOffsetMs: Date.parse(map.serverNow) - Date.now(),
        };
      },
      staleTime: 0,
      retry: (failureCount, error) =>
        failureCount < 1 &&
        !(error instanceof SeatMapError && error.status < 500),
      retryDelay: 1_000,
    }),
};

export class BookingError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function confirmBooking(
  showtimeId: number,
  request: {
    requestId: string;
    email: string;
    seatIds: number[];
    expectedCustomerId?: string | null;
  },
) {
  const response = await securityFetch(
    `/api/showtimes/${showtimeId}/bookings`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as {
      code?: string;
      title?: string;
    };

    throw new BookingError(
      response.status,
      problem.code ?? '',
      problem.title ?? 'Couldn’t confirm your booking.',
    );
  }

  return (await response.json()) as BookingConfirmation;
}
