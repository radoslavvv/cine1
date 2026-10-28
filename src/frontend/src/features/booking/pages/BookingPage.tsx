import { Link, useParams } from 'react-router-dom';
import { Wordmark } from '../../../shared/components/Wordmark/Wordmark';
import { StatusMessage } from '../../../shared/components/StatusMessage/StatusMessage';
import { Button } from '../../../shared/components/Button/Button';
import { bookingPageTheme as theme } from '../booking.theme';
import { BookingSkeleton } from '../components/BookingSkeleton/BookingSkeleton';
import { CarpetFooter } from '../../../shared/components/CarpetFooter/CarpetFooter';
import { ProjectorAtmosphere } from '../../../shared/components/ProjectorAtmosphere/ProjectorAtmosphere';

import { useBookingPage } from '../hooks/useBookingPage';
import { Checkout } from '../components/Checkout/Checkout';
import { SeatMap } from '../components/SeatMap/SeatMap';
import { MovieArtwork } from '../../../shared/components/MovieArtwork/MovieArtwork';

export function BookingPage() {
  const { showtimeId = '' } = useParams();
  const {
    query,
    notFound,
    retry: onRetry,
    selectedSeats,
    isOpen,
    checkoutSeats,
    notice,
    seats,
    dateLabel,
    maxSeats,
    selectionLimitReached,
    continueDisabled,
    toggle,
    clear,
    beginCheckout,
    backToSelection,
    checkout,
  } = useBookingPage(showtimeId);
  const { isError, isPaused, isFetching } = query;
  return (
    <div className={theme.page} id="booking-top">
      <ProjectorAtmosphere />
      <div className={theme.container}>
        <header className={theme.header}>
          <nav className={theme.navigation} aria-label="Booking navigation">
            <Link
              to="/schedule"
              className={theme.link}
              aria-label="Back to schedule"
            >
              <span aria-hidden="true">←</span>
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Back to schedule</span>
            </Link>
          </nav>

          <Link to="/" className={theme.brand} aria-label="cinemaR — home">
            <Wordmark />
          </Link>
        </header>

        {notFound ? (
          <StatusMessage title="Showtime not found">
            <p>Choose a showtime from the schedule.</p>
          </StatusMessage>
        ) : query.data ? (
          <>
            {(isError || isPaused) && (
              <p role="status" className={theme.error}>
                {isPaused
                  ? 'You’re offline. Showing the last loaded layout.'
                  : 'Couldn’t refresh the layout.'}{' '}
                <button
                  type="button"
                  className="underline underline-offset-4"
                  disabled={isFetching}
                  onClick={onRetry}
                >
                  Try again
                </button>
              </p>
            )}
            <div className={theme.intro}>
              <div className={theme.poster}>
                <MovieArtwork
                  title={query.data.movie.title}
                  showTitle={false}
                />
              </div>

              <div className={theme.details}>
                <p className={theme.eyebrow}>
                  {checkoutSeats ? 'REVIEW YOUR BOOKING' : 'CHOOSE YOUR SEATS'}
                </p>
                <h1 className={theme.title}>{query.data.movie.title}</h1>
                <p className={theme.genres}>
                  {query.data.movie.genres.join(' / ')}
                </p>
                <div className={theme.metadata}>
                  <time dateTime={query.data.startsAt}>
                    {dateLabel} · Kyiv time
                  </time>
                  <span>{query.data.auditorium.name}</span>
                  <span>{query.data.movie.durationMinutes} min</span>
                </div>
              </div>
            </div>

            {!isOpen && (
              <p role="status" className={theme.status}>
                This showtime has started. Seat selection is closed.
              </p>
            )}

            {notice && (
              <p role="alert" className={theme.status}>
                {notice}
              </p>
            )}

            {checkoutSeats ? (
              <Checkout
                auditoriumName={query.data.auditorium.name}
                seats={checkoutSeats}
                onBack={backToSelection}
                {...checkout}
              />
            ) : query.data.seats.length === 0 ? (
              <StatusMessage title="Seat layout unavailable">
                <p>Please choose another showtime.</p>
              </StatusMessage>
            ) : (
              <div className={theme.layout}>
                <div className={theme.seatMap}>
                  <SeatMap seats={seats} onToggle={toggle} />
                </div>

                <aside className={theme.summary} aria-label="Selection summary">
                  <div className={theme.summaryHeader}>
                    <h2 className={theme.summaryTitle}>Your seats</h2>
                    <button
                      type="button"
                      className={theme.clear}
                      disabled={selectedSeats.length === 0}
                      onClick={clear}
                    >
                      Clear selection
                    </button>
                  </div>

                  <div
                    className={theme.selectionDetails}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <p className={theme.count}>
                      {selectedSeats.length} / {maxSeats} selected
                    </p>
                    {selectedSeats.length > 0 ? (
                      <ul
                        className={theme.selected}
                        aria-label="Selected seats"
                      >
                        {selectedSeats.map((seat) => (
                          <li key={seat.id} className={theme.chip}>
                            {seat.rowLabel}
                            {seat.number}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={theme.empty}>
                        {isOpen
                          ? 'Select a seat on the map to get started.'
                          : 'Choose an upcoming showtime to select seats.'}
                      </p>
                    )}
                    {selectionLimitReached && (
                      <p className={theme.empty}>
                        Eight-seat limit reached. Deselect a seat to choose
                        another.
                      </p>
                    )}
                  </div>
                  <div className={theme.checkoutAction}>
                    <button
                      type="button"
                      className={theme.checkoutButton}
                      disabled={continueDisabled}
                      onClick={beginCheckout}
                    >
                      Continue to checkout
                    </button>
                  </div>
                </aside>
              </div>
            )}
          </>
        ) : isError ? (
          <StatusMessage title="Couldn’t load seats" isError>
            <p>Please try again.</p>
            <Button onClick={onRetry}>Try again</Button>
          </StatusMessage>
        ) : isPaused ? (
          <StatusMessage title="You’re offline.">
            <p role="status">The layout will load when you reconnect.</p>
          </StatusMessage>
        ) : (
          <BookingSkeleton />
        )}
      </div>
      <CarpetFooter topId="booking-top" />
    </div>
  );
}
