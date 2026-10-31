import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  myBookingsQueries,
  MyBookingsQueryError,
} from '../api/myBookingsQueries';

export function useMyBookings() {
  const { customer, refresh } = useAuth();
  const [page, setPage] = useState(1);
  const query = useQuery(myBookingsQueries.bookings(customer?.id, page));
  useEffect(() => {
    if (
      query.error instanceof MyBookingsQueryError &&
      query.error.status === 401
    )
      void refresh();
  }, [query.error, refresh]);
  return { query, page, setPage };
}
