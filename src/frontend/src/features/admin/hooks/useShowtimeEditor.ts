import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminCatalog, AdminShowtime } from '../types';
import { adminQueries } from '../api/adminQueries';
import {
  dateInKyiv,
  emptyShowtime,
  timeInKyiv,
} from '../model/adminPresentation';
import { useAdminMutation } from './useAdminMutation';

export function useShowtimeEditor(catalog: AdminCatalog) {
  const [date, setDate] = useState(dateInKyiv());
  const [editing, setEditing] = useState<number | null>(null);
  const [filterMovie, setFilterMovie] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [draft, setDraft] = useState(emptyShowtime);
  const [additionalDate, setAdditionalDate] = useState(dateInKyiv());
  const query = useQuery(adminQueries.showtimes(date));
  const action = useAdminMutation();
  const movies = catalog.movies.filter((m) => !m.isArchived);
  const rooms = catalog.auditoriums.filter((a) => !a.isRetired);
  const formats =
    rooms.find((a) => String(a.id) === draft.auditoriumId)?.supportedFormats ??
    [];
  function edit(screening: AdminShowtime) {
    setEditing(screening.id);
    setDraft({
      movieId: String(screening.movieId),
      auditoriumId: String(screening.auditoriumId),
      format: screening.format,
      localTime: timeInKyiv(screening.startsAt),
      dates: [dateInKyiv(screening.startsAt)],
    });
    action.reset();
    document.getElementById('showtime-form-title')?.focus();
  }
  function clear() {
    setEditing(null);
    setDraft(emptyShowtime());
  }
  function chooseRoom(value: string) {
    const supported =
      rooms.find((a) => String(a.id) === value)?.supportedFormats ?? [];
    setDraft({
      ...draft,
      auditoriumId: value,
      format: supported.includes(draft.format)
        ? draft.format
        : (supported[0] ?? '2D'),
    });
  }
  function addDate() {
    if (additionalDate)
      setDraft({
        ...draft,
        dates: [...new Set([...draft.dates, additionalDate])].sort(),
      });
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (
      await action.execute({
        path: editing === null ? 'showtimes' : `showtimes/${editing}`,
        method: editing === null ? 'POST' : 'PUT',
        body: {
          ...draft,
          movieId: Number(draft.movieId),
          auditoriumId: Number(draft.auditoriumId),
        },
        message:
          editing === null
            ? `${draft.dates.length} screening(s) created.`
            : 'Screening updated.',
      })
    ) {
      setDate(draft.dates[0]);
      setFilterMovie(draft.movieId);
      setFilterRoom(draft.auditoriumId);
      clear();
    }
  }
  async function cancel(screening: AdminShowtime) {
    if (
      (await action.execute({
        path: `showtimes/${screening.id}/cancel`,
        message: 'Screening cancelled. Its tickets are now invalid.',
        confirm: `Cancel “${screening.movieTitle}” at ${timeInKyiv(screening.startsAt)}? All ${screening.bookingCount} booking(s) will be invalidated. No email will be sent.`,
      })) &&
      editing === screening.id
    )
      clear();
  }
  const screenings = query.data?.filter(
    (s) =>
      (!filterMovie || String(s.movieId) === filterMovie) &&
      (!filterRoom || String(s.auditoriumId) === filterRoom),
  );
  return {
    date,
    setDate,
    filterMovie,
    setFilterMovie,
    filterRoom,
    setFilterRoom,
    screenings,
    editing,
    draft,
    setDraft,
    additionalDate,
    setAdditionalDate,
    query,
    action,
    movies,
    rooms,
    formats,
    edit,
    clear,
    chooseRoom,
    addDate,
    save,
    cancel,
  };
}
