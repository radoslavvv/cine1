import { useQuery } from '@tanstack/react-query';
import { moviesQueries } from '@/features/movies/api/moviesQueries';
import { Button } from '@/shared/components/ui/button';

import { useMovieEditor } from '../hooks/useMovieEditor';
import { MovieForm } from '../components/MovieForm';
import { AdminNotice } from '../../../admin/components/AdminNotice';
import { adminTheme as t } from '../../../admin/admin.theme';

export function MoviesPanel() {
  const moviesQuery = useQuery(moviesQueries.adminList());
  const movies = moviesQuery.data ?? [];

  const editor = useMovieEditor();
  if (moviesQuery.isPending && !moviesQuery.data)
    return <p role="status">Loading movies…</p>;
  if (moviesQuery.isError && !moviesQuery.data)
    return (
      <AdminNotice
        error={moviesQuery.error?.message}
        retry={() => {
          void moviesQuery.refetch();
        }}
      />
    );
  return (
    <>
      <AdminNotice
        error={editor.action.error}
        success={editor.action.success}
      />
      <div className={t.layout}>
        <MovieForm
          draft={editor.draft}
          editing={editor.editing !== null}
          pending={editor.action.pending}
          onChange={editor.setDraft}
          onSave={editor.save}
          onClear={editor.clear}
        />
        <section aria-label="Movies">
          <div className={t.toolbar}>
            <h2 className={t.heading}>Movies</h2>
            <span className={t.badge}>{movies.length} movies</span>
          </div>
          <div className={t.cards}>
            {movies.map((movie) => (
              <article className={t.card} key={movie.id}>
                <div>
                  <h3 className={t.cardTitle}>{movie.title}</h3>
                  <p className={t.muted}>
                    {movie.durationMinutes} min · {movie.genres.join(' / ')}
                  </p>
                  {movie.isArchived && (
                    <span className={t.badge}>Archived</span>
                  )}
                </div>
                <div className={t.actions}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={editor.action.pending}
                    onClick={() => editor.edit(movie)}
                  >
                    Edit
                  </Button>
                  {!movie.isArchived && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={editor.action.pending}
                      onClick={() =>
                        void editor.action.execute({
                          path: `movies/${movie.id}/archive`,
                          message: 'Movie archived.',
                          confirm: `Archive “${movie.title}”? It will no longer be available for new screenings.`,
                        })
                      }
                    >
                      Archive
                    </Button>
                  )}
                  {!movie.isUsed && (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={editor.action.pending}
                      onClick={() =>
                        void editor.action
                          .execute({
                            path: `movies/${movie.id}`,
                            method: 'DELETE',
                            message: 'Unused movie deleted.',
                            confirm: `Permanently delete “${movie.title}”?`,
                          })
                          .then((saved) => {
                            if (saved && editor.editing === movie.id)
                              editor.clear();
                          })
                      }
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </article>
            ))}
            {movies.length === 0 && (
              <p className={t.muted}>No movies yet. Add your first movie.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
