import type { AdminCatalog } from '../types';
import { useShowtimeEditor } from '../hooks/useShowtimeEditor';
import { ShowtimeForm } from '../components/ShowtimeForm';
import { AdminNotice } from '../components/AdminNotice';
import { cinemaDateTime } from '../model/adminPresentation';
import { adminTheme as t } from '../admin.theme';

export function ShowtimesPanel({ catalog }: { catalog: AdminCatalog }) {
  const editor = useShowtimeEditor(catalog);
  return (
    <>
      <AdminNotice
        error={editor.action.error}
        success={editor.action.success}
      />
      <div className={t.layout}>
        <ShowtimeForm
          draft={editor.draft}
          editing={editor.editing !== null}
          pending={editor.action.pending}
          movies={editor.movies}
          rooms={editor.rooms}
          formats={editor.formats}
          additionalDate={editor.additionalDate}
          onAdditionalDate={editor.setAdditionalDate}
          onAddDate={editor.addDate}
          onRoom={editor.chooseRoom}
          onChange={editor.setDraft}
          onSave={editor.save}
          onClear={editor.clear}
        />
        <section aria-label="Screenings">
          <div className={t.toolbar}>
            <h2 className={t.heading}>Screenings</h2>
            <label className={t.field}>
              Date · Kyiv
              <input
                className={t.input}
                type="date"
                value={editor.date}
                required
                onChange={(e) => {
                  if (e.target.value) editor.setDate(e.target.value);
                }}
              />
            </label>
          </div>
          <AdminNotice
            error={editor.query.error?.message}
            retry={() => void editor.query.refetch()}
          />
          <div className={`${t.row} mb-5`}>
            <label className={t.field}>
              Filter movie
              <select
                className={t.input}
                value={editor.filterMovie}
                onChange={(e) => editor.setFilterMovie(e.target.value)}
              >
                <option value="">All movies</option>
                {catalog.movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={t.field}>
              Filter auditorium
              <select
                className={t.input}
                value={editor.filterRoom}
                onChange={(e) => editor.setFilterRoom(e.target.value)}
              >
                <option value="">All auditoriums</option>
                {catalog.auditoriums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {editor.query.isPending && (
            <p className={t.muted} role="status">
              Loading screenings…
            </p>
          )}
          <div className={t.cards}>
            {editor.screenings?.map((screening) => (
              <article className={t.card} key={screening.id}>
                <div>
                  <h3 className={t.cardTitle}>{screening.movieTitle}</h3>
                  <p className={t.muted}>
                    {cinemaDateTime(screening.startsAt)} ·{' '}
                    {screening.auditoriumName}
                  </p>
                  <p className={t.muted}>
                    {screening.format} · {screening.durationMinutes} min ·{' '}
                    {screening.bookingCount} booking(s)
                  </p>
                  {screening.isCancelled && (
                    <span className={t.badge}>Cancelled</span>
                  )}
                </div>
                {!screening.isCancelled &&
                  Date.parse(screening.startsAt) > Date.now() && (
                    <div className={t.actions}>
                      <button
                        className={t.button}
                        disabled={
                          editor.action.pending || screening.bookingCount > 0
                        }
                        title={
                          screening.bookingCount > 0
                            ? 'Details locked after confirmed bookings'
                            : undefined
                        }
                        onClick={() => editor.edit(screening)}
                      >
                        Edit
                      </button>
                      <button
                        className={t.danger}
                        disabled={editor.action.pending}
                        onClick={() => void editor.cancel(screening)}
                      >
                        Cancel screening
                      </button>
                    </div>
                  )}
              </article>
            ))}
            {editor.screenings?.length === 0 && (
              <p className={t.muted}>
                No screenings match this date and filters.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
