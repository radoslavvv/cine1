import type {
  AdminAuditorium,
  AuditoriumDraft,
  MovieDraft,
  ShowtimeDraft,
} from '../types';

export const emptyMovie: MovieDraft = {
  title: '',
  durationMinutes: 120,
  genres: '',
  synopsis: '',
  posterUrl: '',
  backdropUrl: '',
};
export const emptyAuditorium: AuditoriumDraft = {
  name: '',
  rows: 8,
  seatsPerRow: 12,
  supportedFormats: ['2D'],
};
export const dateInKyiv = (value: string | number = Date.now()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
export const timeInKyiv = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Kyiv',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
export const cinemaDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Kyiv',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
export const emptyShowtime = (): ShowtimeDraft => ({
  movieId: '',
  auditoriumId: '',
  format: '2D',
  localTime: '19:00',
  dates: [dateInKyiv()],
});
export function dimensions(room: AdminAuditorium) {
  return {
    rows: Math.max(0, ...room.seats.map((s) => s.gridRow)) + 1,
    seatsPerRow: Math.max(0, ...room.seats.map((s) => s.gridColumn)) + 1,
  };
}
