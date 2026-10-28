import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { bookingQueries, SeatMapError } from '../../api/bookingQueries';
import { Wordmark } from '../../../../shared/components/Wordmark/Wordmark';
import { StatusMessage } from '../../../../shared/components/StatusMessage/StatusMessage';
import { Button } from '../../../../shared/components/Button/Button';
import { bookingPageTheme as page } from '../BookingPage/BookingPage.theme';
import { checkoutTheme as theme } from './Checkout.theme';
import { ConfirmationSkeleton } from '../BookingSkeleton/BookingSkeleton';
import { CarpetFooter } from '../../../../shared/components/CarpetFooter/CarpetFooter';
import { ProjectorAtmosphere } from '../../../../shared/components/ProjectorAtmosphere/ProjectorAtmosphere';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Kyiv',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function ConfirmationPage() {
  const { token = '' } = useParams();
  const valid = /^[a-f0-9]{64}$/.test(token);
  const query = useQuery({
    ...bookingQueries.confirmation(token),
    enabled: valid,
  });
  const [copied, setCopied] = useState(false);
  const missing =
    !valid ||
    (query.error instanceof SeatMapError && query.error.status === 404);
  const booking = query.data;
  const url = `${window.location.origin}/booking/confirmation/${token}`;

  return (
    <div className={page.page} id="confirmation-top">
      <ProjectorAtmosphere />
      <div className={page.container}>
        <header className={page.header}>
          <nav className={page.navigation}>
            <Link to="/schedule" className={page.link}>
              ← Schedule
            </Link>
          </nav>
          <Link to="/" className={page.brand} aria-label="cinemaR — home">
            <Wordmark />
          </Link>
        </header>
        {missing ? (
          <StatusMessage title="Booking not found">
            <p>Check your private confirmation link.</p>
          </StatusMessage>
        ) : booking ? (
          <section
            className={theme.panel}
            aria-labelledby="confirmation-heading"
          >
            <p className={theme.eyebrow}>YOU’RE ALL SET</p>
            <h1 id="confirmation-heading" className={theme.title}>
              Booking confirmed
            </h1>
            <p className={theme.subtitle}>
              {booking.movieTitle}
              <br />
              {dateFormat.format(new Date(booking.startsAt))} · Kyiv time
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
                Save this link to reopen your tickets. Anyone with the link can
                view this booking. No email has been sent.
              </p>
              <Button
                onClick={() => {
                  void navigator.clipboard
                    .writeText(url)
                    .then(() => setCopied(true))
                    .catch(() => setCopied(false));
                }}
              >
                Copy link
              </Button>
            </div>
          </section>
        ) : query.isError ? (
          <StatusMessage title="Couldn’t load your booking" isError>
            <Button onClick={() => void query.refetch()}>Try again</Button>
          </StatusMessage>
        ) : query.isPaused ? (
          <StatusMessage title="You’re offline.">
            <p role="status">Reconnect to view your booking.</p>
          </StatusMessage>
        ) : (
          <ConfirmationSkeleton />
        )}
      </div>
      <CarpetFooter topId="confirmation-top" />
    </div>
  );
}
