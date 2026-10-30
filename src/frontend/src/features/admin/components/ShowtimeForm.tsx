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
            <select
              className={t.input}
              required
              value={draft.movieId}
              onChange={(e) => onChange({ ...draft, movieId: e.target.value })}
            >
              <option value="">Choose a movie</option>
              {movies.map((movie) => (
                <option key={movie.id} value={movie.id}>
                  {movie.title} · {movie.durationMinutes} min
                </option>
              ))}
            </select>
          </label>
          <label className={t.field}>
            Auditorium
            <select
              className={t.input}
              required
              value={draft.auditoriumId}
              onChange={(e) => onRoom(e.target.value)}
            >
              <option value="">Choose an auditorium</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
          <div className={t.row}>
            <label className={t.field}>
              Format
              <select
                className={t.input}
                required
                disabled={!draft.auditoriumId}
                value={draft.format}
                onChange={(e) => onChange({ ...draft, format: e.target.value })}
              >
                {formats.length === 0 && (
                  <option value="">Choose a room first</option>
                )}
                {formats.map((format) => (
                  <option key={format}>{format}</option>
                ))}
              </select>
            </label>
            <label className={t.field}>
              Start time · Europe/Kyiv
              <input
                className={t.input}
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
              <input
                className={t.input}
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
                  <input
                    className={t.input}
                    type="date"
                    value={additionalDate}
                    onChange={(e) => onAdditionalDate(e.target.value)}
                    onInput={(e) => onAdditionalDate(e.currentTarget.value)}
                  />
                </label>
                <button
                  className={`${t.button} self-end`}
                  type="button"
                  disabled={!additionalDate || draft.dates.length >= 366}
                  onClick={onAddDate}
                >
                  Add date
                </button>
              </div>
              <div className={t.actions} aria-label="Selected screening dates">
                {draft.dates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    className={t.button}
                    aria-label={`Remove ${date}`}
                    onClick={() =>
                      onChange({
                        ...draft,
                        dates: draft.dates.filter((d) => d !== date),
                      })
                    }
                  >
                    {date} <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            </>
          )}
          <p className={t.muted}>
            Each screening includes 15 minutes for turnaround. All selected
            dates save together; conflicts save nothing.
          </p>
          <div className={t.actions}>
            <button
              className={t.primary}
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
            </button>
            {editing && (
              <button className={t.button} type="button" onClick={onClear}>
                Cancel editing
              </button>
            )}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
