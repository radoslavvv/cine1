export interface Movie {
  id: number;
  title: string;
  durationMinutes: number;
  genres: string[];
  synopsis: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
}
