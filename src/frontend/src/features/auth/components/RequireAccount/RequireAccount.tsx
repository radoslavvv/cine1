import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AccountLayout } from '../AccountLayout/AccountLayout';
import { accountTheme } from '../../auth.theme';

export function RequireAccount({
  children,
  administrator = false,
}: {
  children: ReactNode;
  administrator?: boolean;
}) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) {
    return (
      <p className="p-8" role="status">
        Checking sign-in…
      </p>
    );
  }

  if (auth.error) {
    return (
      <AccountLayout title="Couldn’t check sign-in.">
        <p role="alert">{auth.error}</p>
        <button
          className={`${accountTheme.button} mt-5`}
          onClick={() => void auth.refresh()}
        >
          Try again
        </button>
      </AccountLayout>
    );
  }

  if (!auth.customer) {
    return (
      <Navigate
        replace
        to={`/account/sign-in?${new URLSearchParams({ returnTo: location.pathname + location.search })}`}
      />
    );
  }

  if (administrator && !auth.customer.isAdministrator) {
    return (
      <AccountLayout title="Administrator access required.">
        <p>This area is available to the cinema administrator.</p>
        <Link className={accountTheme.link} to="/account/bookings">
          My bookings
        </Link>
      </AccountLayout>
    );
  }

  return children;
}
