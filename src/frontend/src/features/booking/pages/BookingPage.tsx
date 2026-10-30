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
import { AnimatePresence, motion } from 'motion/react';
import { MotionSurface } from '../../../shared/components/MotionSurface/MotionSurface';
import { MotionItem } from '../../../shared/components/MotionItem/MotionItem';
import { useCinemaMotion } from '../../../shared/hooks/useCinemaMotion';

export function BookingPage() {
  const animation = useCinemaMotion();
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
        <MotionSurface className={theme.header}>
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
        </MotionSurface>

        <AnimatePresence mode="wait" propagate>
        {notFound ? (
          <MotionSurface key="missing">
          <StatusMessage title="Showtime not found">
            <p>Choose a showtime from the schedule.</p>
          </StatusMessage>
          </MotionSurface>
        ) : query.data ? (
          <MotionSurface key="loaded" distance={0}>
            <AnimatePresence initial={false} propagate>
            {(isError || isPaused) && (
              <MotionSurface key="refresh-status" distance={4}>
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
              </MotionSurface>
            )}
            </AnimatePresence>
            <MotionSurface className={theme.intro} delay={0.04}>
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
            </MotionSurface>

            <AnimatePresence initial={false} propagate>
            {!isOpen && (
              <MotionSurface key="closed" distance={4}>
              <p role="status" className={theme.status}>
                This showtime has started. Seat selection is closed.
              </p>
              </MotionSurface>
            )}

            {notice && (
              <MotionSurface key="notice" distance={4}>
              <p role="alert" className={theme.status}>
                {notice}
              </p>
              </MotionSurface>
            )}
            </AnimatePresence>

            <AnimatePresence mode="wait" propagate>
            {checkoutSeats ? (
              <MotionSurface key="checkout">
              <Checkout
                auditoriumName={query.data.auditorium.name}
                seats={checkoutSeats}
                onBack={backToSelection}
                {...checkout}
              />
              </MotionSurface>
            ) : query.data.seats.length === 0 ? (
              <MotionSurface key="unavailable">
              <StatusMessage title="Seat layout unavailable">
                <p>Please choose another showtime.</p>
              </StatusMessage>
              </MotionSurface>
            ) : (
              <MotionSurface key="selection" className={theme.layout}>
                <MotionSurface className={theme.seatMap} delay={0.04}>
                  <SeatMap seats={seats} onToggle={toggle} />
                </MotionSurface>

                <motion.aside layout transition={animation.transition} className={theme.summary} aria-label="Selection summary">
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

                  <motion.div
                    layout="position"
                    transition={animation.transition}
                    className={theme.selectionDetails}
                  >
                    <p className={theme.count} role="status" aria-atomic="true">
                      {selectedSeats.length} / {maxSeats} selected
                      <span className="sr-only">{selectedSeats.map((seat) => `, ${seat.rowLabel}${seat.number}`).join('')}</span>
                    </p>
                      <motion.ul
                        layout
                        transition={animation.transition}
                        className={theme.selected}
                        aria-label="Selected seats"
                        style={{ position: 'relative' }}
                      >
                        <AnimatePresence mode="popLayout" propagate>
                        {selectedSeats.map((seat) => (
                          <MotionItem key={seat.id} className={theme.chip}>
                            {seat.rowLabel}
                            {seat.number}
                          </MotionItem>
                        ))}
                        </AnimatePresence>
                      </motion.ul>
                    <AnimatePresence initial={false} propagate>
                    {selectedSeats.length === 0 && (
                      <MotionSurface key="empty" distance={4}>
                      <p className={theme.empty}>
                        {isOpen
                          ? 'Select a seat on the map to get started.'
                          : 'Choose an upcoming showtime to select seats.'}
                      </p>
                      </MotionSurface>
                    )}
                    {selectionLimitReached && (
                      <MotionSurface key="limit" distance={4}>
                      <p className={theme.empty}>
                        Eight-seat limit reached. Deselect a seat to choose
                        another.
                      </p>
                      </MotionSurface>
                    )}
                    </AnimatePresence>
                  </motion.div>
                  <motion.div layout="position" transition={animation.transition} className={theme.checkoutAction}>
                    <button
                      type="button"
                      className={theme.checkoutButton}
                      disabled={continueDisabled}
                      onClick={beginCheckout}
                    >
                      Continue to checkout
                    </button>
                  </motion.div>
                </motion.aside>
              </MotionSurface>
            )}
            </AnimatePresence>
          </MotionSurface>
        ) : isError ? (
          <MotionSurface key="error" distance={6}>
          <StatusMessage title="Couldn’t load seats" isError>
            <p>Please try again.</p>
            <Button onClick={onRetry}>Try again</Button>
          </StatusMessage>
          </MotionSurface>
        ) : isPaused ? (
          <MotionSurface key="offline" distance={6}>
          <StatusMessage title="You’re offline.">
            <p role="status">The layout will load when you reconnect.</p>
          </StatusMessage>
          </MotionSurface>
        ) : (
          <MotionSurface key="loading" distance={6}>
          <BookingSkeleton />
          </MotionSurface>
        )}
        </AnimatePresence>
      </div>
      <CarpetFooter topId="booking-top" />
    </div>
  );
}
