import { cinemaHeaderTheme as theme } from './CinemaHeader.theme';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Wordmark } from '../Wordmark/Wordmark';

export function CinemaHeader({
  accountLinks,
  status,
}: {
  accountLinks: ReactNode;
  status?: ReactNode;
}) {
  return (
    <header role="banner" className={theme.header}>
      <div className={theme.layout}>
        <nav aria-label="Main navigation" className={theme.navigation}>
          <Link to="/schedule" className={theme.link}>
            Schedule
          </Link>
        </nav>
        <Link to="/" aria-label="cinemaR — home" className={theme.brand}>
          <Wordmark />
        </Link>
        <div className={theme.account}>{accountLinks}</div>
      </div>
      {status}
    </header>
  );
}
