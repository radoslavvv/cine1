import { Link } from 'react-router-dom';
import { notFoundPageTheme as theme } from './NotFoundPage.theme';

export function NotFoundPage() {
  return (
    <div className={theme.page}>
      <h1 className={theme.heading}>Page not found</h1>

      <Link className={theme.link} to="/schedule">
        View schedule
      </Link>
    </div>
  );
}
