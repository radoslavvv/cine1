import { queryOptions } from '@tanstack/react-query';
import { securityFetch } from '../../auth/api/authApi';
import type { BookingHistory } from '../types';

export class MyBookingsQueryError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const myBookingsQueries = {
  bookings: (customerId: string | undefined, page: number) =>
    queryOptions({
      queryKey: ['my-bookings', customerId, page],
      queryFn: async ({ signal }) => {
        const response = await securityFetch(
          '/api/account/bookings?page=' + page,
          { signal },
        );

        if (!response.ok) {
          throw new MyBookingsQueryError(
            response.status,
            response.status === 401
              ? 'Your session expired. Please sign in again.'
              : 'Couldn’t load your bookings. Please try again.',
          );
        }

        return (await response.json()) as BookingHistory;
      },
      retry: false,
    }),
};
