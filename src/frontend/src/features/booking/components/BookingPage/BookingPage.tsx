import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { bookingQueries, SeatMapError } from '../../api/bookingQueries';
import type { Seat, SeatMap as SeatMapData } from '../../types';
import { Checkout } from '../Checkout/Checkout';
import { MAX_SEATS, useSeatSelection } from '../../hooks/useSeatSelection';
import { SeatMap } from '../SeatMap/SeatMap';
import { Wordmark } from '../../../../shared/components/Wordmark/Wordmark';
import { MovieArtwork } from '../../../../shared/components/MovieArtwork/MovieArtwork';
import { StatusMessage } from '../../../../shared/components/StatusMessage/StatusMessage';
import { Button } from '../../../../shared/components/Button/Button';
import { bookingPageTheme as theme } from './BookingPage.theme';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Kyiv', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

export function BookingPage() {
  const { showtimeId = '' } = useParams();
  return <BookingPageForShowtime key={showtimeId} showtimeId={showtimeId} />;
}

function BookingPageForShowtime({ showtimeId }: { showtimeId: string }) {
  const validId = /^[1-9]\d*$/.test(showtimeId) && Number(showtimeId) <= 2_147_483_647;
  const query = useQuery({ ...bookingQueries.seats(showtimeId), enabled: validId });
  const notFound = !validId || (query.error instanceof SeatMapError && query.error.status === 404);

  return (
    <div className={theme.page}>
      <div className={theme.container}>
        <header className={theme.header}>
          <nav className={theme.navigation} aria-label="Booking navigation">
            <Link to="/schedule" className={theme.link} aria-label="Back to schedule">
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
            {(query.isError || query.isPaused) && (
              <p role="status" className={theme.error}>
                {query.isPaused ? 'You’re offline. Showing the last loaded layout.' : 'Couldn’t refresh the layout.'}{' '}
                <button type="button" className="underline underline-offset-4" disabled={query.isFetching}
                  onClick={() => void query.refetch()}>Try again</button>
              </p>
            )}
            <SeatSelection map={query.data} clockOffsetMs={query.data.clockOffsetMs} />
          </>
        ) : query.isError ? (
          <StatusMessage title="Couldn’t load seats" isError>
            <p>Please try again.</p>
            <Button onClick={() => void query.refetch()}>Try again</Button>
          </StatusMessage>
        ) : (
          <StatusMessage title={query.isPaused ? 'You’re offline.' : 'Loading seats…'}>
            <p role="status">{query.isPaused ? 'The layout will load when you reconnect.' : 'Getting the auditorium ready.'}</p>
          </StatusMessage>
        )}
      </div>
    </div>
  );
}

function SeatSelection({ map, clockOffsetMs }: { map: SeatMapData; clockOffsetMs: number }) {
  const queryClient = useQueryClient();
  const { selectedSeats, isOpen, toggle, clear } = useSeatSelection(map, clockOffsetMs);
  const [checkoutSeats, setCheckoutSeats] = useState<Seat[] | null>(null);
  const [notice, setNotice] = useState('');

  async function handleConflict(message: string) {
    setNotice(message);
    clear();
    await queryClient.invalidateQueries({ queryKey: ['seat-map', String(map.showtimeId)] });
    setCheckoutSeats(null);
  }

  return (
    <>
      <div className={theme.intro}>
        <div className={theme.poster}>
          <MovieArtwork title={map.movie.title} showTitle={false} />
        </div>

        <div className={theme.details}>
          <p className={theme.eyebrow}>{checkoutSeats ? 'REVIEW YOUR BOOKING' : 'CHOOSE YOUR SEATS'}</p>
          <h1 className={theme.title}>{map.movie.title}</h1>
          <p className={theme.genres}>{map.movie.genres.join(' / ')}</p>
          <div className={theme.metadata}>
            <time dateTime={map.startsAt}>
              {dateFormat.format(new Date(map.startsAt))} · Kyiv time
            </time>
            <span>{map.auditorium.name}</span>
            <span>{map.movie.durationMinutes} min</span>
          </div>
        </div>
      </div>

      {!isOpen && <p role="status" className={theme.status}>This showtime has started. Seat selection is closed.</p>}

      {notice && <p role="alert" className={theme.status}>{notice}</p>}

      {checkoutSeats ? <Checkout map={map} seats={checkoutSeats} isOpen={isOpen}
        onBack={() => setCheckoutSeats(null)} onConflict={handleConflict} /> : map.seats.length === 0 ? (
        <StatusMessage title="Seat layout unavailable"><p>Please choose another showtime.</p></StatusMessage>
      ) : (
        <div className={theme.layout}>
          <div className={theme.seatMap}>
            <SeatMap
              seats={map.seats}
              selectedSeats={selectedSeats}
              isOpen={isOpen}
              onToggle={toggle}
            />
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

            <div aria-live="polite" aria-atomic="true">
              <p className={theme.count}>{selectedSeats.length} / {MAX_SEATS} selected</p>
              {selectedSeats.length > 0 ? (
                <ul className={theme.selected} aria-label="Selected seats">
                  {selectedSeats.map(seat => <li key={seat.id} className={theme.chip}>{seat.rowLabel}{seat.number}</li>)}
                </ul>
              ) : <p className={theme.empty}>{isOpen ? 'Select a seat on the map to get started.' : 'Choose an upcoming showtime to select seats.'}</p>}
              {selectedSeats.length === MAX_SEATS && <p className={theme.empty}>Eight-seat limit reached. Deselect a seat to choose another.</p>}
            </div>
            <div className={theme.checkoutAction}>
              <button type="button" className={theme.checkoutButton} disabled={!isOpen || selectedSeats.length === 0}
                onClick={() => { setNotice(''); setCheckoutSeats(selectedSeats); }}>
                Continue to checkout <span aria-hidden="true">→</span>
              </button>
              <p className={theme.note}>Your seats are reserved once you confirm your booking.</p>
              <p className={theme.refreshNote}>Leaving or refreshing clears your selection.</p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
