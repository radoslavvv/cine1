import { useQuery } from '@tanstack/react-query';
import { moviesQueries } from '@/features/movies/api/moviesQueries';
import { auditoriumsQueries } from '@/features/auditoriums/api/auditoriumsQueries';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/shared/components/ui/native-select';

import { useShowtimeEditor } from '../hooks/useShowtimeEditor';
import { ShowtimeForm } from '../components/ShowtimeForm';
import { AdminNotice } from '../../../admin/components/AdminNotice';
import { cinemaDateTime } from '@/shared/model/cinemaDates';
import { adminTheme as t } from '../../../admin/admin.theme';

export function ShowtimesPanel() {
  const moviesQuery = useQuery(moviesQueries.adminList());
  const movies = moviesQuery.data ?? [];
  const auditoriumsQuery = useQuery(auditoriumsQueries.adminList());
  const auditoriums = auditoriumsQuery.data ?? [];

  const editor = useShowtimeEditor(movies, auditoriums);

  if (
    (moviesQuery.isPending && !moviesQuery.data) ||
    (auditoriumsQuery.isPending && !auditoriumsQuery.data)
  ) {
    return <p role="status">Loading movies and auditoriums…</p>;
  }

  if (
    (moviesQuery.isError && !moviesQuery.data) ||
    (auditoriumsQuery.isError && !auditoriumsQuery.data)
  ) {
    return (
      <AdminNotice
        error={moviesQuery.error?.message ?? auditoriumsQuery.error?.message}
        retry={() => {
          void moviesQuery.refetch();
          void auditoriumsQuery.refetch();
        }}
      />
    );
  }

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
              <Input
                type="date"
                value={editor.date}
                required
                onChange={(e) => {
                  if (e.target.value) {
                    editor.setDate(e.target.value);
                  }
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
              <NativeSelect
                value={editor.filterMovie}
                onChange={(e) => editor.setFilterMovie(e.target.value)}
              >
                <NativeSelectOption value="">All movies</NativeSelectOption>
                {movies.map((m) => (
                  <NativeSelectOption key={m.id} value={m.id}>
                    {m.title}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <label className={t.field}>
              Filter auditorium
              <NativeSelect
                value={editor.filterRoom}
                onChange={(e) => editor.setFilterRoom(e.target.value)}
              >
                <NativeSelectOption value="">
                  All auditoriums
                </NativeSelectOption>
                {auditoriums.map((a) => (
                  <NativeSelectOption key={a.id} value={a.id}>
                    {a.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
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
                      <Button
                        variant="outline"
                        size="sm"
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
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={editor.action.pending}
                        onClick={() => void editor.cancel(screening)}
                      >
                        Cancel screening
                      </Button>
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
