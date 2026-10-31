import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { saveBookingDraft } from '../model/bookingDraft';
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
  const auth = useAuth();
  const [identity, setIdentity] = useState(auth.customer);
  const initialized = useRef(!auth.loading);
  const [forcedChoice, setForcedChoice] = useState(false);
  useEffect(() => {
    if (!initialized.current && !auth.loading) {
      initialized.current = true;
      setIdentity(auth.customer);
    }
  }, [auth.customer, auth.loading]);
  const sessionChanged =
    forcedChoice || (identity?.id ?? null) !== (auth.customer?.id ?? null);
  const heading = useRef<HTMLHeadingElement>(null);
  const busy = useRef(false);
  const attempt = useRef<{
    requestId: string;
    email: string;
    seatIds: number[];
    expectedCustomerId?: string;
  } | null>(null);
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // An uncertain submission may be replayed after start to recover its existing confirmation.
    if (
      !active ||
      busy.current ||
      auth.loading ||
      auth.error ||
      sessionChanged ||
      (!isOpen && !uncertain)
    )
      return;
    busy.current = true;
    setPending(true);
    setError('');
    attempt.current ??= {
      requestId: crypto.randomUUID(),
      email: identity?.email ?? email.trim(),
      seatIds: seats.map((seat) => seat.id),
      ...(identity ? { expectedCustomerId: identity.id } : {}),
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
      void queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      saveBookingDraft(String(showtimeId), [], false);
      navigate(`/booking/confirmation/${confirmation.confirmationToken}`, {
        replace: true,
      });
    } catch (failure) {
      if (failure instanceof BookingError && failure.status < 500) {
        if (failure.code === 'session_changed' || failure.status === 401) {
          if (!uncertain) attempt.current = null;
          setForcedChoice(true);
          setError(failure.message);
          await auth.refresh();
          return;
        }
        attempt.current = null;
        setUncertain(false);
        if (
          failure.code === 'seats_taken' ||
          failure.code === 'showtime_started' ||
          failure.code === 'showtime_cancelled' ||
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
    setIdentity(auth.customer);
    setForcedChoice(false);
  }

  return {
    reset,
    heading,
    email: identity?.email ?? email,
    emailReadOnly: !!identity,
    sessionChanged,
    canUseCurrentAccount:
      !uncertain || auth.customer?.id === attempt.current?.expectedCustomerId,
    canContinueAsGuest: !uncertain || !attempt.current?.expectedCustomerId,
    onUseCurrentAccount: () => {
      if (
        uncertain &&
        auth.customer?.id !== attempt.current?.expectedCustomerId
      )
        return;
      setIdentity(auth.customer);
      setForcedChoice(false);
      setError('');
    },
    onContinueAsGuest: async () => {
      if (uncertain && attempt.current?.expectedCustomerId) return;
      try {
        if (auth.customer) await auth.signOut();
        setIdentity(null);
        setForcedChoice(false);
        setEmail('');
        setError('');
      } catch {
        setError(
          'Couldn’t sign out. Please try again before continuing as a guest.',
        );
      }
    },
    pending,
    error,
    isOpen,
    inputsDisabled: pending || uncertain,
    submitDisabled:
      pending ||
      auth.loading ||
      !!auth.error ||
      sessionChanged ||
      (!isOpen && !uncertain),
    submitLabel: pending
      ? 'Confirming…'
      : uncertain
        ? 'Retry confirmation'
        : 'Confirm booking',
    onEmailChange: setEmail,
    onSubmit: submit,
  };
}
