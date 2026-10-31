import { queryOptions } from '@tanstack/react-query';
import { adminRequest } from '@/features/auth/api/adminRequest';
import type { AdminShowtime } from '../types';

export const showtimeManagementQueries = {
  adminForDate: (date: string) =>
    queryOptions({
      queryKey: ['showtimes', 'admin', date],
      queryFn: ({ signal }) =>
        adminRequest<AdminShowtime[]>('showtimes?date=' + date, { signal }),
      retry: false,
    }),
};
