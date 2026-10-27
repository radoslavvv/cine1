import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookingError, confirmBooking } from '../../api/bookingQueries';
import type { Seat, SeatMap } from '../../types';
import { Button } from '../../../../shared/components/Button/Button';
import { checkoutTheme as theme } from './Checkout.theme';

export function Checkout({
  map,
  seats,
  isOpen,
  onBack,
  onConflict,
}: {
  map: SeatMap;
  seats: Seat[];
  isOpen: boolean;
  onBack: () => void;
  onConflict: (message: string) => Promise<void>;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const heading = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  const attempt = useRef<{
    requestId: string;
    email: string;
    seatIds: number[];
  } | null>(null);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    heading.current?.focus();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // An uncertain submission may be replayed after start to recover its existing confirmation.
    if (busy.current || (!isOpen && !uncertain)) return;
    busy.current = true;
    setPending(true);
    setError('');
    attempt.current ??= {
      requestId: crypto.randomUUID(),
      email: email.trim(),
      seatIds: seats.map((seat) => seat.id),
    };
    try {
      const confirmation = await confirmBooking(
        map.showtimeId,
        attempt.current,
      );
      queryClient.setQueryData(
        ['booking-confirmation', confirmation.confirmationToken],
        confirmation,
      );
      void queryClient.invalidateQueries({
        queryKey: ['seat-map', String(map.showtimeId)],
      });
      navigate(`/booking/confirmation/${confirmation.confirmationToken}`, {
        replace: true,
      });
    } catch (failure) {
      if (failure instanceof BookingError && failure.status < 500) {
        attempt.current = null;
        setUncertain(false);
        if (
          failure.code === 'seats_taken' ||
          failure.code === 'showtime_started' ||
          failure.status === 404
        ) {
          await onConflict(failure.message);
        } else setError(failure.message);
      } else {
        setUncertain(true);
        setError(
          'We couldn’t retrieve your confirmation. Retry to safely check the same booking without creating a duplicate.',
        );
      }
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <section
      className={theme.panel}
      aria-labelledby="checkout-heading"
      aria-busy={pending}
    >
      <p className={theme.eyebrow}>ONE LAST STEP</p>
      <h2
        id="checkout-heading"
        ref={heading}
        tabIndex={-1}
        className={theme.title}
      >
        Your checkout
      </h2>
      <p className={theme.subtitle}>
        {seats.length} {seats.length === 1 ? 'ticket' : 'tickets'} ·{' '}
        {map.auditorium.name}
      </p>
      <ul className={theme.seats} aria-label="Seats to book">
        {seats.map((seat) => (
          <li key={seat.id} className={theme.chip}>
            Row {seat.rowLabel} · Seat {seat.number}
          </li>
        ))}
      </ul>
      <form onSubmit={(event) => void submit(event)} className={theme.form}>
        <label className={theme.label}>
          Email address
          <input
            className={theme.input}
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending || uncertain}
            aria-describedby="checkout-email-help"
          />
        </label>
        <p id="checkout-email-help" className={theme.note}>
          Your tickets appear here after confirmation. Save the private booking
          link; we aren’t sending emails yet.
        </p>
        <p className={theme.note}>
          No payment is required. Seats are only secured when your booking is
          confirmed.
        </p>
        {!isOpen && (
          <p role="status" className={theme.error}>
            This showtime has started. New bookings are closed.
          </p>
        )}
        {error && (
          <p role="alert" className={theme.error}>
            {error}
          </p>
        )}
        <div className={theme.actions}>
          <button
            type="button"
            onClick={onBack}
            disabled={pending || uncertain}
            className={theme.back}
          >
            ← Change seats
          </button>
          <Button type="submit" disabled={pending || (!isOpen && !uncertain)}>
            {pending
              ? 'Confirming…'
              : uncertain
                ? 'Retry confirmation'
                : 'Confirm booking'}
          </Button>
        </div>
      </form>
    </section>
  );
}
