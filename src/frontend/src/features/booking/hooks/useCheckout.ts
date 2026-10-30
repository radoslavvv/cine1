import { useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookingError, confirmBooking } from '../api/bookingQueries';
import type { Seat } from '../types';

export function useCheckout({
  showtimeId,
  seats,
  isOpen,
  onConflict,
  active = true,
}: {
  active?: boolean;
  showtimeId: number;
  seats: Seat[];
  isOpen: boolean;
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // An uncertain submission may be replayed after start to recover its existing confirmation.
    if (!active || busy.current || (!isOpen && !uncertain)) return;
    busy.current = true;
    setPending(true);
    setError('');
    attempt.current ??= {
      requestId: crypto.randomUUID(),
      email: email.trim(),
      seatIds: seats.map((seat) => seat.id),
    };
    try {
      const confirmation = await confirmBooking(showtimeId, attempt.current);
      queryClient.setQueryData(
        ['booking-confirmation', confirmation.confirmationToken],
        confirmation,
      );
      void queryClient.invalidateQueries({
        queryKey: ['seat-map', String(showtimeId)],
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

  function reset() {
    attempt.current = null;
    busy.current = false;
    setEmail('');
    setPending(false);
    setUncertain(false);
    setError('');
  }

  return {
    reset,
    heading,
    email,
    pending,
    error,
    isOpen,
    inputsDisabled: pending || uncertain,
    submitDisabled: pending || (!isOpen && !uncertain),
    submitLabel: pending
      ? 'Confirming…'
      : uncertain
        ? 'Retry confirmation'
        : 'Confirm booking',
    onEmailChange: setEmail,
    onSubmit: submit,
  };
}
