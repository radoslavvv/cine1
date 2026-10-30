export interface Movie {
  id: number;
  title: string;
  durationMinutes: number;
  genres: string[];
  synopsis: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
}

export interface Showtime {
  id: number;
  startsAt: string;
  format: string;
  movie: Movie;
  auditorium: { id: number; name: string };
}
