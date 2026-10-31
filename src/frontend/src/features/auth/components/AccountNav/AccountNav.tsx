import { Link } from 'react-router-dom';
import { useAccountNavigation } from '../../hooks/useAccountNavigation';
import { accountNavTheme as theme } from './AccountNav.theme';

export function AccountNav() {
  const { customer, busy, failure, hidden, signInUrl, signOut } =
    useAccountNavigation();

  if (hidden) {
    return null;
  }

  return (
    <div className="text-sm">
      <nav className={theme.navigation} aria-label="Account navigation">
        {customer ? (
          <>
            <span className={theme.email}>{customer.email}</span>
            <Link className={theme.link} to="/account/bookings">
              My bookings
            </Link>
            {customer.isAdministrator && (
              <Link className={theme.link} to="/admin">
                Administration
              </Link>
            )}
            <button
              className={theme.link}
              disabled={busy}
              onClick={() => void signOut()}
            >
              {busy ? 'Signing out…' : 'Sign out'}
            </button>
          </>
        ) : (
          <Link className={theme.link} to={signInUrl}>
            Sign in
          </Link>
        )}
        {failure && (
          <p role="alert" className="text-rose">
            {failure}
          </p>
        )}
      </nav>
    </div>
  );
}
