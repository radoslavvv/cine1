import { useQuery } from '@tanstack/react-query';
import { moviesQueries } from '@/features/movies/api/moviesQueries';
import { auditoriumsQueries } from '@/features/auditoriums/api/auditoriumsQueries';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/shared/components/ui/native-select';

import { useAdminBookings } from '../hooks/useAdminBookings';
import { AdminNotice } from '../../../admin/components/AdminNotice';
import { cinemaDateTime } from '@/shared/model/cinemaDates';
import { adminTheme as t } from '../../../admin/admin.theme';

export function BookingsPanel() {
  const moviesQuery = useQuery(moviesQueries.adminList());
  const movies = moviesQuery.data ?? [];
  const auditoriumsQuery = useQuery(auditoriumsQueries.adminList());
  const auditoriums = auditoriumsQuery.data ?? [];

  const view = useAdminBookings();
  const booking = view.detail.data;
  if (
    (moviesQuery.isPending && !moviesQuery.data) ||
    (auditoriumsQuery.isPending && !auditoriumsQuery.data)
  )
    return <p role="status">Loading movies and auditoriums…</p>;
  if (
    (moviesQuery.isError && !moviesQuery.data) ||
    (auditoriumsQuery.isError && !auditoriumsQuery.data)
  )
    return (
      <AdminNotice
        error={moviesQuery.error?.message ?? auditoriumsQuery.error?.message}
        retry={() => {
          void moviesQuery.refetch();
          void auditoriumsQuery.refetch();
        }}
      />
    );
  return (
    <section aria-label="Booking records">
      <div className={t.toolbar}>
        <div>
          <h2 className={t.heading}>Bookings</h2>
          <p className={t.muted}>
            Read-only customer records · All screening times are in Kyiv time.
          </p>
        </div>
        <span className={t.badge}>{view.query.data?.total ?? '…'} records</span>
      </div>
      <form onSubmit={view.search}>
        <div className={t.filters}>
          <label className={t.field}>
            Email or booking ID
            <Input
              type="search"
              value={view.draft.search}
              onChange={(e) =>
                view.setDraft({ ...view.draft, search: e.target.value })
              }
              placeholder="Search bookings"
            />
          </label>
          <label className={t.field}>
            Screening date
            <Input
              type="date"
              value={view.draft.date}
              onChange={(e) =>
                view.setDraft({ ...view.draft, date: e.target.value })
              }
            />
          </label>
          <label className={t.field}>
            Movie
            <NativeSelect
              value={view.draft.movieId}
              onChange={(e) =>
                view.setDraft({ ...view.draft, movieId: e.target.value })
              }
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
            Auditorium
            <NativeSelect
              value={view.draft.auditoriumId}
              onChange={(e) =>
                view.setDraft({ ...view.draft, auditoriumId: e.target.value })
              }
            >
              <NativeSelectOption value="">All auditoriums</NativeSelectOption>
              {auditoriums.map((a) => (
                <NativeSelectOption key={a.id} value={a.id}>
                  {a.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className={t.field}>
            Status
            <NativeSelect
              value={view.draft.status}
              onChange={(e) =>
                view.setDraft({ ...view.draft, status: e.target.value })
              }
            >
              <NativeSelectOption value="">All statuses</NativeSelectOption>
              <NativeSelectOption value="active">Active</NativeSelectOption>
              <NativeSelectOption value="cancelled">
                Cancelled
              </NativeSelectOption>
            </NativeSelect>
          </label>
        </div>
        <div className={`${t.actions} mb-6`}>
          <Button size="sm" type="submit">
            Apply filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={view.reset}
          >
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={view.query.isFetching}
            onClick={() => void view.query.refetch()}
          >
            Refresh
          </Button>
        </div>
      </form>
      <AdminNotice
        error={view.query.error?.message}
        retry={() => void view.query.refetch()}
      />
      {view.query.isPending && (
        <p className={t.muted} role="status">
          Loading bookings…
        </p>
      )}
      {view.query.data && (
        <>
          <div className={t.tableWrap}>
            <table className={t.table}>
              <caption className="sr-only">Customer bookings</caption>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Screening</th>
                  <th>Seats</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {view.query.data.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <p>{item.email}</p>
                      <p className={t.muted}>{item.id}</p>
                    </td>
                    <td>
                      <p>{item.movieTitle}</p>
                      <p className={t.muted}>
                        {cinemaDateTime(item.startsAt)} · {item.auditoriumName}
                      </p>
                    </td>
                    <td>{item.seats.join(', ')}</td>
                    <td>{item.isCancelled ? 'Cancelled' : 'Active'}</td>
                    <td>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => view.setSelected(item.id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {view.query.data.total === 0 && (
              <p className="p-6 text-muted">No bookings match these filters.</p>
            )}
          </div>
          <div className={`${t.toolbar} mt-5`}>
            <Button
              variant="outline"
              size="sm"
              disabled={view.filters.page <= 1 || view.query.isFetching}
              onClick={() => view.page(view.filters.page - 1)}
            >
              Previous
            </Button>
            <p className={t.muted}>
              Page {view.filters.page} of{' '}
              {Math.max(1, Math.ceil(view.query.data.total / 25))}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={
                view.filters.page * 25 >= view.query.data.total ||
                view.query.isFetching
              }
              onClick={() => view.page(view.filters.page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
      {view.selected && (
        <section
          className={`${t.panel} mt-6`}
          aria-label="Booking details"
          aria-live="polite"
        >
          <div className={t.toolbar}>
            <h3 className={t.heading}>Booking details</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => view.setSelected('')}
            >
              Close
            </Button>
          </div>
          <AdminNotice
            error={view.detail.error?.message}
            retry={() => void view.detail.refetch()}
          />
          {view.detail.isPending && <p className={t.muted}>Loading details…</p>}
          {booking && (
            <dl className="grid gap-4 break-words sm:grid-cols-2">
              <div>
                <dt className={t.muted}>Booking ID</dt>
                <dd>{booking.id}</dd>
              </div>
              <div>
                <dt className={t.muted}>Customer</dt>
                <dd>{booking.email}</dd>
              </div>
              <div>
                <dt className={t.muted}>Screening #{booking.showtimeId}</dt>
                <dd>
                  {booking.movieTitle}
                  <br />
                  {cinemaDateTime(booking.startsAt)} · {booking.auditoriumName}
                </dd>
              </div>
              <div>
                <dt className={t.muted}>Confirmed</dt>
                <dd>{cinemaDateTime(booking.confirmedAt)}</dd>
              </div>
              <div>
                <dt className={t.muted}>Seats</dt>
                <dd>{booking.seats.join(', ')}</dd>
              </div>
              <div>
                <dt className={t.muted}>Status</dt>
                <dd>
                  {booking.isCancelled
                    ? 'Cancelled — tickets invalid'
                    : 'Active'}
                </dd>
              </div>
            </dl>
          )}
        </section>
      )}
    </section>
  );
}
