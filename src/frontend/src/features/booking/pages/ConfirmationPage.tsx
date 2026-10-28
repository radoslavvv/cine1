import { Link } from 'react-router-dom';
import { Confirmation } from '../components/Confirmation/Confirmation';
import { Wordmark } from '../../../shared/components/Wordmark/Wordmark';
import { StatusMessage } from '../../../shared/components/StatusMessage/StatusMessage';
import { Button } from '../../../shared/components/Button/Button';
import { bookingPageTheme as page } from '../booking.theme';
import { ConfirmationSkeleton } from '../components/BookingSkeleton/ConfirmationSkeleton';
import { CarpetFooter } from '../../../shared/components/CarpetFooter/CarpetFooter';
import { ProjectorAtmosphere } from '../../../shared/components/ProjectorAtmosphere/ProjectorAtmosphere';

import { useConfirmationPage } from '../hooks/useConfirmationPage';

export function ConfirmationPage() {
  const {
    query,
    missing,
    booking,
    url,
    dateLabel,
    copyLink: onCopy,
    retry: onRetry,
  } = useConfirmationPage();
  const { isError, isPaused } = query;
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
          <Confirmation
            booking={booking}
            dateLabel={dateLabel}
            url={url}
            onCopy={onCopy}
          />
        ) : isError ? (
          <StatusMessage title="Couldn’t load your booking" isError>
            <Button onClick={onRetry}>Try again</Button>
          </StatusMessage>
        ) : isPaused ? (
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
