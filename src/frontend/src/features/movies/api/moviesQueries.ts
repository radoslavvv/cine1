import { queryOptions } from '@tanstack/react-query';
import { adminRequest } from '@/features/auth/api/adminRequest';
import type { AdminMovie } from '../admin/types';

export const moviesQueries = {
  adminList: () =>
    queryOptions({
      queryKey: ['movies', 'admin'],
      queryFn: ({ signal }) => adminRequest<AdminMovie[]>('movies', { signal }),
      retry: false,
    }),
};
