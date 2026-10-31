import { queryOptions } from '@tanstack/react-query';
import { adminRequest } from '@/features/auth/api/adminRequest';
import type { AdminAuditorium } from '../admin/types';

export const auditoriumsQueries = {
  adminList: () =>
    queryOptions({
      queryKey: ['auditoriums', 'admin'],
      queryFn: ({ signal }) =>
        adminRequest<AdminAuditorium[]>('auditoriums', { signal }),
      retry: false,
    }),
};
