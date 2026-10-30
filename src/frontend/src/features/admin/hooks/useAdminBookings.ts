import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminQueries } from '../api/adminQueries';
import type { BookingFilters } from '../types';

const initial: BookingFilters = {
  search: '',
  date: '',
  movieId: '',
  auditoriumId: '',
  status: '',
  page: 1,
};
export function useAdminBookings() {
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(initial);
  const [selected, setSelected] = useState('');
  const query = useQuery(adminQueries.bookings(filters));
  const detail = useQuery({
    ...adminQueries.booking(selected),
    enabled: selected !== '',
  });
  function search(event: FormEvent) {
    event.preventDefault();
    setFilters({ ...draft, page: 1 });
    setSelected('');
  }
  function reset() {
    setDraft(initial);
    setFilters(initial);
    setSelected('');
  }
  function page(value: number) {
    setFilters({ ...filters, page: value });
    setSelected('');
  }
  return {
    draft,
    setDraft,
    query,
    detail,
    selected,
    setSelected,
    filters,
    search,
    reset,
    page,
  };
}
