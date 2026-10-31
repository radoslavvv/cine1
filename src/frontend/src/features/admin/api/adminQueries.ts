import { queryOptions } from '@tanstack/react-query';
import { securityFetch } from '../../auth/api/authApi';
import type {
  AdminBooking,
  AdminCatalog,
  AdminShowtime,
  BookingFilters,
  BookingPage,
} from '../types';

export async function adminRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await securityFetch(`/api/admin/${path}`, {
    ...init,
    cache: 'no-store',
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as {
      title?: string;
      errors?: Record<string, string[]>;
    };
    const details = Object.values(problem.errors ?? {})
      .flat()
      .join(' ');
    throw new Error(
      details || problem.title || `Request failed (${response.status}).`,
    );
  }
  return response.json() as Promise<T>;
}

export const adminQueries = {
  catalog: () =>
    queryOptions({
      queryKey: ['admin', 'catalog'],
      queryFn: ({ signal }) =>
        adminRequest<AdminCatalog>('catalog', { signal }),
      retry: false,
    }),
  showtimes: (date: string) =>
    queryOptions({
      queryKey: ['admin', 'showtimes', date],
      queryFn: ({ signal }) =>
        adminRequest<AdminShowtime[]>(`showtimes?date=${date}`, { signal }),
      retry: false,
    }),
  bookings: (filters: BookingFilters) =>
    queryOptions({
      queryKey: ['admin', 'bookings', filters],
      queryFn: ({ signal }) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(filters))
          if (value !== '') params.set(key, String(value));
        return adminRequest<BookingPage>(`bookings?${params}`, { signal });
      },
      retry: false,
    }),
  booking: (id: string) =>
    queryOptions({
      queryKey: ['admin', 'booking', id],
      queryFn: ({ signal }) =>
        adminRequest<AdminBooking>(`bookings/${id}`, { signal }),
      retry: false,
    }),
};
