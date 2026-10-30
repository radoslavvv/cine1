import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/shared/components/ui/native-select';
import type { FormEvent } from 'react';
import type { AdminAuditorium, AdminMovie, ShowtimeDraft } from '../types';
import { adminTheme as t } from '../admin.theme';

export function ShowtimeForm({
  draft,
  editing,
  pending,
  movies,
  rooms,
  formats,
  additionalDate,
  onAdditionalDate,
  onAddDate,
  onRoom,
  onChange,
  onSave,
  onClear,
}: {
  draft: ShowtimeDraft;
  editing: boolean;
  pending: boolean;
  movies: AdminMovie[];
  rooms: AdminAuditorium[];
  formats: string[];
  additionalDate: string;
  onAdditionalDate: (date: string) => void;
  onAddDate: () => void;
  onRoom: (id: string) => void;
  onChange: (draft: ShowtimeDraft) => void;
  onSave: (event: FormEvent) => void;
  onClear: () => void;
}) {
  return (
    <section
      className={`${t.panel} lg:order-last lg:sticky lg:top-6`}
      aria-labelledby="showtime-form-title"
    >
      <h2 id="showtime-form-title" tabIndex={-1} className={t.heading}>
        {editing ? 'Edit screening' : 'Schedule screenings'}
      </h2>
      <form className={t.form} onSubmit={onSave}>
        <fieldset disabled={pending} className="contents">
          <label className={t.field}>
            Movie
            <NativeSelect
              required
              value={draft.movieId}
              onChange={(e) => onChange({ ...draft, movieId: e.target.value })}
            >
              <NativeSelectOption value="">Choose a movie</NativeSelectOption>
              {movies.map((movie) => (
                <NativeSelectOption key={movie.id} value={movie.id}>
                  {movie.title} · {movie.durationMinutes} min
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className={t.field}>
            Auditorium
            <NativeSelect
              required
              value={draft.auditoriumId}
              onChange={(e) => onRoom(e.target.value)}
            >
              <NativeSelectOption value="">
                Choose an auditorium
              </NativeSelectOption>
              {rooms.map((room) => (
                <NativeSelectOption key={room.id} value={room.id}>
                  {room.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <div className={t.row}>
            <label className={t.field}>
              Format
              <NativeSelect
                required
                disabled={!draft.auditoriumId}
                value={draft.format}
                onChange={(e) => onChange({ ...draft, format: e.target.value })}
              >
                {formats.length === 0 && (
                  <NativeSelectOption value="">
                    Choose a room first
                  </NativeSelectOption>
                )}
                {formats.map((format) => (
                  <NativeSelectOption key={format}>{format}</NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <label className={t.field}>
              Start time · Europe/Kyiv
              <Input
                type="time"
                required
                value={draft.localTime}
                onChange={(e) =>
                  onChange({ ...draft, localTime: e.target.value })
                }
              />
            </label>
          </div>
          {editing ? (
            <label className={t.field}>
              Screening date
              <Input
                type="date"
                required
                value={draft.dates[0]}
                onChange={(e) =>
                  onChange({ ...draft, dates: [e.target.value] })
                }
              />
            </label>
          ) : (
            <>
              <div className={t.row}>
                <label className={t.field}>
                  Add a date
                  <Input
                    type="date"
                    value={additionalDate}
                    onChange={(e) => onAdditionalDate(e.target.value)}
                    onInput={(e) => onAdditionalDate(e.currentTarget.value)}
                  />
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-end"
                  type="button"
                  disabled={!additionalDate || draft.dates.length >= 366}
                  onClick={onAddDate}
                >
                  Add date
                </Button>
              </div>
              <div className={t.actions} aria-label="Selected screening dates">
                {draft.dates.map((date) => (
                  <Button
                    key={date}
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label={`Remove ${date}`}
                    onClick={() =>
                      onChange({
                        ...draft,
                        dates: draft.dates.filter((d) => d !== date),
                      })
                    }
                  >
                    {date} <span aria-hidden="true">×</span>
                  </Button>
                ))}
              </div>
            </>
          )}
          <p className={t.muted}>
            Each screening includes 15 minutes for turnaround. All selected
            dates save together; conflicts save nothing.
          </p>
          <div className={t.actions}>
            <Button
              size="sm"
              type="submit"
              disabled={
                draft.dates.length === 0 ||
                !draft.movieId ||
                !draft.auditoriumId ||
                !formats.includes(draft.format)
              }
            >
              {pending
                ? 'Saving…'
                : editing
                  ? 'Save changes'
                  : `Create ${draft.dates.length} screening(s)`}
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
