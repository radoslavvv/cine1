import { useState, type FormEvent } from 'react';
import type { AdminMovie } from '../types';
import { emptyMovie } from '@/features/movies/admin/model/moviesEditor';
import { useAdminMutation } from '../../../admin/hooks/useAdminMutation';

export function useMovieEditor() {
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState({ ...emptyMovie });
  const action = useAdminMutation();

  function edit(movie: AdminMovie) {
    setEditing(movie.id);
    setDraft({
      ...movie,
      genres: movie.genres.join(', '),
      posterUrl: movie.posterUrl ?? '',
      backdropUrl: movie.backdropUrl ?? '',
    });
    action.reset();
    document.getElementById('movie-form-title')?.focus();
  }

  function clear() {
    setEditing(null);
    setDraft({ ...emptyMovie });
  }

  async function save(event: FormEvent) {
    event.preventDefault();

    const saved = await action.execute({
      path: editing === null ? 'movies' : `movies/${editing}`,
      method: editing === null ? 'POST' : 'PUT',
      body: {
        ...draft,
        genres: draft.genres
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean),
      },
      message: editing === null ? 'Movie created.' : 'Movie updated.',
    });

    if (saved) {
      clear();
    }
  }

  return { editing, draft, setDraft, edit, clear, save, action };
}
