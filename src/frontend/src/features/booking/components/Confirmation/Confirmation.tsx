import type { BookingConfirmation } from '../../types';
import { Button } from '../../../../shared/components/Button/Button';
import { checkoutTheme as theme } from '../Checkout/Checkout.theme';
import { MotionItem } from '../../../../shared/components/MotionItem/MotionItem';
import { MotionSurface } from '../../../../shared/components/MotionSurface/MotionSurface';

export function Confirmation({
  booking,
  dateLabel,
  url,
  onCopy,
}: {
  booking: BookingConfirmation;
  dateLabel: string;
  url: string;
  onCopy: () => void;
}) {
  return (
    <section className={theme.panel} aria-labelledby="confirmation-heading">
      <p className={theme.eyebrow}>
        {booking.isCancelled ? 'SCREENING CANCELLED' : 'YOU’RE ALL SET'}
      </p>
      <h1 id="confirmation-heading" className={theme.title}>
        {booking.isCancelled ? 'Screening cancelled' : 'Booking confirmed'}
      </h1>
      <p className={theme.subtitle}>
        {booking.movieTitle}
        <br />
        {dateLabel} · Kyiv time
        <br />
        {booking.auditoriumName}
      </p>
      <p className={theme.subtitle}>Booked for {booking.email}</p>
      {booking.isCancelled && (
        <p className={theme.note} role="status">
          This screening has been cancelled. These tickets are no longer valid
          for admission.
        </p>
      )}
      <ul
        className={theme.tickets}
        aria-label={booking.isCancelled ? 'Cancelled tickets' : 'Your tickets'}
      >
        {booking.tickets.map((ticket, index) => (
          <MotionItem
            key={ticket.seatId}
            reveal
            delay={index * 0.045}
            className={theme.ticket}
          >
            <p className={theme.eyebrow}>
              {booking.isCancelled ? 'INVALID TICKET' : 'ADMIT ONE'}
            </p>
            <p className={theme.seat}>
              Row {ticket.rowLabel} · {ticket.number}
            </p>
            {!booking.isCancelled && (
              <img
                src={`/api/bookings/${booking.confirmationToken}/tickets/${ticket.seatId}/qr`}
                alt={`Ticket QR code for row ${ticket.rowLabel}, seat ${ticket.number}`}
                className={theme.qr}
                width={196}
                height={196}
                referrerPolicy="no-referrer"
              />
            )}
          </MotionItem>
        ))}
      </ul>
      <MotionSurface reveal className={theme.form}>
        <label className={theme.label}>
          Your private confirmation link
          <input
            className={theme.input}
            readOnly
            value={url}
            onFocus={(event) => event.target.select()}
          />
        </label>
        <p className={theme.note}>
          Save this link to reopen your tickets. Anyone with the link can view
          this booking. No email has been sent.
        </p>
        <Button onClick={onCopy}>Copy link</Button>
      </MotionSurface>
    </section>
  );
}
