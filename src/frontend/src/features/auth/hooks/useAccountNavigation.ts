import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { accountSignInUrl } from '../model/accountNavigation';

export function useAccountNavigation() {
  const { customer, signOut } = useAuth();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');

  async function handleSignOut() {
    if (busy) {
      return;
    }

    setBusy(true);
    setFailure('');

    try {
      await signOut();
    } catch {
      setFailure('Couldn’t sign out. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return {
    customer,
    busy,
    failure,
    hidden: location.pathname === '/',
    signInUrl: accountSignInUrl(location.pathname, location.search),
    signOut: handleSignOut,
  };
}
