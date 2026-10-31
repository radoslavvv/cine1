import { myBookingsTheme as theme } from './MyBookingsPage.theme';
import { Link } from 'react-router-dom';
import { AccountLayout } from '../../auth/components/AccountLayout/AccountLayout';
import { accountTheme } from '../../auth/auth.theme';
import { useMyBookings } from '../hooks/useMyBookings';
import { formatBookingDate } from '../model/bookingPresentation';

export function MyBookingsPage() {
  const { query, page, setPage } = useMyBookings();
  return (
    <AccountLayout title="My bookings.">
      {query.isPending && (
        <p role="status" className="text-muted">
          Finding your tickets…
        </p>
      )}
      {query.isError && (
        <>
          <p role="alert" className="text-rose">
            {query.error.message}
          </p>
          <button
            className={`${accountTheme.button} mt-4`}
            onClick={() => void query.refetch()}
          >
            Try again
          </button>
        </>
      )}
      {query.data && (
        <>
          {query.data.items.length === 0 ? (
            <p className="text-muted">
              No bookings here yet. Book while signed in to see your tickets
              here. Guest bookings remain available through their private links.
            </p>
          ) : (
            <ul className={theme.list}>
              {query.data.items.map((booking) => (
                <li key={booking.confirmationToken} className={theme.booking}>
                  <h2 className={theme.title}>{booking.movieTitle}</h2>
                  <p className={theme.date}>
                    {formatBookingDate(booking.startsAt)} · Kyiv time
                  </p>
                  <p className={theme.details}>
                    {booking.auditoriumName} · {booking.tickets.length}{' '}
                    {booking.tickets.length === 1 ? 'ticket' : 'tickets'}
                  </p>
                  {booking.isCancelled && (
                    <p className={theme.cancelled}>
                      Screening cancelled · tickets no longer valid
                    </p>
                  )}
                  <Link
                    className={`${accountTheme.link} mt-3 inline-block text-sm`}
                    to={`/booking/confirmation/${booking.confirmationToken}`}
                  >
                    View booking and tickets →
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {(page > 1 || query.data.hasMore) && (
            <nav
              className={theme.pagination}
              aria-label="Booking history pages"
            >
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className={theme.pageLink}
              >
                ← Previous
              </button>
              <span>Page {page}</span>
              <button
                disabled={!query.data.hasMore}
                onClick={() => setPage(page + 1)}
                className={theme.pageLink}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </AccountLayout>
  );
}
