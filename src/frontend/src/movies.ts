export interface Movie {
  id: number;
  title: string;
  durationMinutes: number;
}

export async function getMovies(signal: AbortSignal): Promise<Movie[]> {
  const response = await fetch('/api/movies', { signal });
  if (!response.ok) throw new Error(`Movie request failed (${response.status}).`);
  return response.json() as Promise<Movie[]>;
}
