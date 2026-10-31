import type { FormEvent, RefObject } from 'react';
import type { Seat } from '../../types';
import { Button } from '../../../../shared/components/Button/Button';
import { checkoutTheme as theme } from './Checkout.theme';
import { AnimatePresence } from 'motion/react';
import { MotionSurface } from '../../../../shared/components/MotionSurface/MotionSurface';
import { MotionItem } from '../../../../shared/components/MotionItem/MotionItem';
import { useCheckoutArrival } from '../../hooks/useCheckoutArrival';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../auth/hooks/useAuth';

export interface CheckoutProps {
  auditoriumName: string;
  seats: Seat[];
  isOpen: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  email: string;
  pending: boolean;
  error: string;
  inputsDisabled: boolean;
  submitDisabled: boolean;
  submitLabel: string;
  onEmailChange: (email: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  emailReadOnly?: boolean;
  sessionChanged?: boolean;
  canUseCurrentAccount?: boolean;
  canContinueAsGuest?: boolean;
  onUseCurrentAccount?: () => void;
  onContinueAsGuest?: () => Promise<void>;
}

export function Checkout({
  auditoriumName,
  seats,
  isOpen,
  heading,
  email,
  pending,
  error,
  inputsDisabled,
  submitDisabled,
  submitLabel,
  onEmailChange,
  onSubmit,
  onBack,
  emailReadOnly,
  sessionChanged,
  canUseCurrentAccount,
  canContinueAsGuest,
  onUseCurrentAccount,
  onContinueAsGuest,
}: CheckoutProps) {
  useCheckoutArrival(heading);
  const auth = useAuth();
  const location = useLocation();
  const signInUrl = `/account/sign-in?${new URLSearchParams({ returnTo: location.pathname })}`;
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
        {auditoriumName}
      </p>
      <ul className={theme.seats} aria-label="Seats to book">
        {seats.map((seat, index) => (
          <MotionItem
            key={seat.id}
            delay={index * 0.025}
            className={theme.chip}
          >
            Row {seat.rowLabel} · Seat {seat.number}
          </MotionItem>
        ))}
      </ul>
      <form onSubmit={onSubmit} className={theme.form}>
        {auth.error && (
          <p role="alert" className={theme.error}>
            {auth.error}{' '}
            <button
              type="button"
              className="underline"
              onClick={() => void auth.refresh()}
            >
              Try again
            </button>
          </p>
        )}
        {sessionChanged ? (
          <div
            className="grid gap-3 rounded-xl border border-amber/40 p-4 text-sm"
            role="alert"
          >
            <p>Your sign-in changed. Choose how to continue.</p>
            <Link to={signInUrl} className="text-amber underline">
              Sign in again
            </Link>
            {auth.customer && canUseCurrentAccount && (
              <button
                type="button"
                className="text-left text-amber underline"
                onClick={onUseCurrentAccount}
              >
                Continue as {auth.customer.email}
              </button>
            )}
            {canContinueAsGuest ? (
              <button
                type="button"
                className="text-left text-amber underline"
                onClick={() => {
                  void onContinueAsGuest?.();
                }}
              >
                Continue as guest
              </button>
            ) : (
              <p>
                Sign in with the original account to safely recover your pending
                confirmation.
              </p>
            )}
          </div>
        ) : (
          !auth.customer &&
          !inputsDisabled && (
            <p className={theme.note}>
              Checking out as a guest.{' '}
              <Link to={signInUrl} className="text-amber underline">
                Sign in
              </Link>{' '}
              to save this booking to your account.
            </p>
          )
        )}
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
            readOnly={emailReadOnly}
            onChange={(event) => onEmailChange(event.target.value)}
            disabled={inputsDisabled}
            aria-describedby="checkout-email-help"
          />
        </label>
        <p id="checkout-email-help" className={theme.note}>
          Your tickets appear here after confirmation. Save the private booking
          link; ticket emails aren’t sent yet.
        </p>
        <p className={theme.note}>
          No payment is required. Seats are only secured when your booking is
          confirmed.
        </p>
        <AnimatePresence initial={false} propagate>
          {!isOpen && (
            <MotionSurface key="closed" distance={4}>
              <p role="status" className={theme.error}>
                This showtime has started. New bookings are closed.
              </p>
            </MotionSurface>
          )}
          {error && (
            <MotionSurface key="error" distance={4}>
              <p role="alert" className={theme.error}>
                {error}
              </p>
            </MotionSurface>
          )}
        </AnimatePresence>
        <div className={theme.actions}>
          <button
            type="button"
            onClick={onBack}
            disabled={inputsDisabled}
            className={theme.back}
          >
            ← Change seats
          </button>
          <Button type="submit" disabled={submitDisabled}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </section>
  );
}
