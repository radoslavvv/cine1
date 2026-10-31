import type { Movie } from '../../movies/types';

export interface Showtime {
  id: number;
  startsAt: string;
  format: string;
  movie: Movie;
  auditorium: { id: number; name: string };
}
