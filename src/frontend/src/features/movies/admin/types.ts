export interface AdminMovie {
  id: number;
  title: string;
  durationMinutes: number;
  genres: string[];
  synopsis: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  isArchived: boolean;
  isUsed: boolean;
}
export interface MovieDraft {
  title: string;
  durationMinutes: number;
  genres: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
}
