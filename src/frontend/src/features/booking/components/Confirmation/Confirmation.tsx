import type { BookingConfirmation } from '../../types';
import { Button } from '../../../../shared/components/Button/Button';
import { checkoutTheme as theme } from '../Checkout/Checkout.theme';

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
      <p className={theme.eyebrow}>YOU’RE ALL SET</p>
      <h1 id="confirmation-heading" className={theme.title}>
        Booking confirmed
      </h1>
      <p className={theme.subtitle}>
        {booking.movieTitle}
        <br />
        {dateLabel} · Kyiv time
        <br />
        {booking.auditoriumName}
      </p>
      <p className={theme.subtitle}>Booked for {booking.email}</p>
      <ul className={theme.tickets} aria-label="Your tickets">
        {booking.tickets.map((ticket) => (
          <li key={ticket.seatId} className={theme.ticket}>
            <p className={theme.eyebrow}>ADMIT ONE</p>
            <p className={theme.seat}>
              Row {ticket.rowLabel} · {ticket.number}
            </p>
            <img
              src={`/api/bookings/${booking.confirmationToken}/tickets/${ticket.seatId}/qr`}
              alt={`Ticket QR code for row ${ticket.rowLabel}, seat ${ticket.number}`}
              className={theme.qr}
              width={196}
              height={196}
              referrerPolicy="no-referrer"
            />
          </li>
        ))}
      </ul>
      <div className={theme.form}>
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
      </div>
    </section>
  );
}
