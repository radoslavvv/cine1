import type { FormEvent, Ref } from 'react';
import type { Seat } from '../../types';
import { Button } from '../../../../shared/components/Button/Button';
import { checkoutTheme as theme } from './Checkout.theme';

export interface CheckoutProps {
  auditoriumName: string;
  seats: Seat[];
  isOpen: boolean;
  heading: Ref<HTMLHeadingElement>;
  email: string;
  pending: boolean;
  error: string;
  inputsDisabled: boolean;
  submitDisabled: boolean;
  submitLabel: string;
  onEmailChange: (email: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
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
}: CheckoutProps) {
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
        {seats.map((seat) => (
          <li key={seat.id} className={theme.chip}>
            Row {seat.rowLabel} · Seat {seat.number}
          </li>
        ))}
      </ul>
      <form onSubmit={onSubmit} className={theme.form}>
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
            onChange={(event) => onEmailChange(event.target.value)}
            disabled={inputsDisabled}
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
