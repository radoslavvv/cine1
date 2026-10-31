import { queryOptions } from '@tanstack/react-query';
import { adminRequest } from '@/features/auth/api/adminRequest';
import type { AdminBooking, BookingFilters, BookingPage } from '../types';

export const bookingManagementQueries = {
  adminList: (filters: BookingFilters) =>
    queryOptions({
      queryKey: ['bookings', 'admin', filters],
      queryFn: ({ signal }) => {
        const params = new URLSearchParams();

        for (const [key, value] of Object.entries(filters)) {
          if (value !== '') {
            params.set(key, String(value));
          }
        }

        return adminRequest<BookingPage>('bookings?' + params, { signal });
      },
      retry: false,
    }),
  adminDetail: (id: string) =>
    queryOptions({
      queryKey: ['bookings', 'admin', id],
      queryFn: ({ signal }) =>
        adminRequest<AdminBooking>('bookings/' + id, { signal }),
      retry: false,
    }),
};
