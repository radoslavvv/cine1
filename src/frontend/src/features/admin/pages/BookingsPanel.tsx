import type { AdminCatalog } from '../types';
import { useAdminBookings } from '../hooks/useAdminBookings';
import { AdminNotice } from '../components/AdminNotice';
import { cinemaDateTime } from '../model/adminPresentation';
import { adminTheme as t } from '../admin.theme';

export function BookingsPanel({ catalog }: { catalog: AdminCatalog }) {
  const view = useAdminBookings();
  const booking = view.detail.data;
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
            <input
              className={t.input}
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
            <input
              className={t.input}
              type="date"
              value={view.draft.date}
              onChange={(e) =>
                view.setDraft({ ...view.draft, date: e.target.value })
              }
            />
          </label>
          <label className={t.field}>
            Movie
            <select
              className={t.input}
              value={view.draft.movieId}
              onChange={(e) =>
                view.setDraft({ ...view.draft, movieId: e.target.value })
              }
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
            Auditorium
            <select
              className={t.input}
              value={view.draft.auditoriumId}
              onChange={(e) =>
                view.setDraft({ ...view.draft, auditoriumId: e.target.value })
              }
            >
              <option value="">All auditoriums</option>
              {catalog.auditoriums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className={t.field}>
            Status
            <select
              className={t.input}
              value={view.draft.status}
              onChange={(e) =>
                view.setDraft({ ...view.draft, status: e.target.value })
              }
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>
        <div className={`${t.actions} mb-6`}>
          <button className={t.primary} type="submit">
            Apply filters
          </button>
          <button className={t.button} type="button" onClick={view.reset}>
            Reset
          </button>
          <button
            className={t.button}
            type="button"
            disabled={view.query.isFetching}
            onClick={() => void view.query.refetch()}
          >
            Refresh
          </button>
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
                      <button
                        className={t.button}
                        onClick={() => view.setSelected(item.id)}
                      >
                        View
                      </button>
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
            <button
              className={t.button}
              disabled={view.filters.page <= 1 || view.query.isFetching}
              onClick={() => view.page(view.filters.page - 1)}
            >
              Previous
            </button>
            <p className={t.muted}>
              Page {view.filters.page} of{' '}
              {Math.max(1, Math.ceil(view.query.data.total / 25))}
            </p>
            <button
              className={t.button}
              disabled={
                view.filters.page * 25 >= view.query.data.total ||
                view.query.isFetching
              }
              onClick={() => view.page(view.filters.page + 1)}
            >
              Next
            </button>
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
            <button className={t.button} onClick={() => view.setSelected('')}>
              Close
            </button>
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
