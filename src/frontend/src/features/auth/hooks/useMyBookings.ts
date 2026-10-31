import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { accountQueries, AccountQueryError } from '../api/accountQueries';

export function useMyBookings() {
  const { customer, refresh } = useAuth();
  const [page, setPage] = useState(1);
  const query = useQuery(accountQueries.bookings(customer?.id, page));
  useEffect(() => {
    if (query.error instanceof AccountQueryError && query.error.status === 401)
      void refresh();
  }, [query.error, refresh]);
  return { query, page, setPage };
}
