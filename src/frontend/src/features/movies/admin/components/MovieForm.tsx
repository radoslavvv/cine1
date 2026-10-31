import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import type { FormEvent } from 'react';
import type { MovieDraft } from '../types';
import { adminTheme as t } from '../../../admin/admin.theme';

export function MovieForm({
  draft,
  editing,
  pending,
  onChange,
  onSave,
  onClear,
}: {
  draft: MovieDraft;
  editing: boolean;
  pending: boolean;
  onChange: (draft: MovieDraft) => void;
  onSave: (event: FormEvent) => void;
  onClear: () => void;
}) {
  return (
    <section
      className={`${t.panel} lg:order-last lg:sticky lg:top-6`}
      aria-labelledby="movie-form-title"
    >
      <h2 id="movie-form-title" tabIndex={-1} className={t.heading}>
        {editing ? 'Edit movie' : 'Add a movie'}
      </h2>
      <form className={t.form} onSubmit={onSave}>
        <fieldset disabled={pending} className="contents">
          <label className={t.field}>
            Title
            <Input
              value={draft.title}
              onChange={(e) => onChange({ ...draft, title: e.target.value })}
              required
              maxLength={200}
            />
          </label>
          <div className={t.row}>
            <label className={t.field}>
              Runtime · minutes
              <Input
                type="number"
                min={1}
                max={1440}
                required
                value={draft.durationMinutes}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    durationMinutes: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className={t.field}>
              Genres · comma separated
              <Input
                required
                value={draft.genres}
                placeholder="Drama, Sci-Fi"
                onChange={(e) => onChange({ ...draft, genres: e.target.value })}
              />
            </label>
          </div>
          <label className={t.field}>
            Synopsis
            <Textarea
              rows={4}
              maxLength={10000}
              value={draft.synopsis}
              onChange={(e) => onChange({ ...draft, synopsis: e.target.value })}
            />
          </label>
          <label className={t.field}>
            Poster URL · optional
            <Input
              type="url"
              maxLength={2048}
              value={draft.posterUrl}
              placeholder="https://…"
              onChange={(e) =>
                onChange({ ...draft, posterUrl: e.target.value })
              }
            />
          </label>
          <label className={t.field}>
            Backdrop URL · optional
            <Input
              type="url"
              maxLength={2048}
              value={draft.backdropUrl}
              placeholder="https://…"
              onChange={(e) =>
                onChange({ ...draft, backdropUrl: e.target.value })
              }
            />
          </label>
          <p className={t.muted}>
            Runtime changes apply to new screenings. Existing screenings keep
            their scheduled duration.
          </p>
          <div className={t.actions}>
            <Button size="sm" type="submit">
              {pending ? 'Saving…' : editing ? 'Save changes' : 'Create movie'}
            </Button>
            {editing && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onClear}
              >
                Cancel editing
              </Button>
            )}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
