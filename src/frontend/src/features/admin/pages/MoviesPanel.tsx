import type { AdminCatalog } from '../types';
import { useMovieEditor } from '../hooks/useMovieEditor';
import { MovieForm } from '../components/MovieForm';
import { AdminNotice } from '../components/AdminNotice';
import { adminTheme as t } from '../admin.theme';

export function MoviesPanel({ catalog }: { catalog: AdminCatalog }) {
  const editor = useMovieEditor();
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
        <section aria-label="Movie catalog">
          <div className={t.toolbar}>
            <h2 className={t.heading}>Movie catalog</h2>
            <span className={t.badge}>{catalog.movies.length} movies</span>
          </div>
          <div className={t.cards}>
            {catalog.movies.map((movie) => (
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
                  <button
                    className={t.button}
                    disabled={editor.action.pending}
                    onClick={() => editor.edit(movie)}
                  >
                    Edit
                  </button>
                  {!movie.isArchived && (
                    <button
                      className={t.button}
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
                    </button>
                  )}
                  {!movie.isUsed && (
                    <button
                      className={t.danger}
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
                    </button>
                  )}
                </div>
              </article>
            ))}
            {catalog.movies.length === 0 && (
              <p className={t.muted}>
                Your catalog is empty. Add your first movie.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
