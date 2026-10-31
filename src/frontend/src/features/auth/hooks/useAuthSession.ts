import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { accountAction, loadSession } from '../api/authApi';
import type { AuthState, Customer } from '../types';

export function useAuthSession(): AuthState {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const previousId = useRef<string | null>(null);
  const generation = useRef(0);
  const queryClient = useQueryClient();
  const channel = useRef<BroadcastChannel | null>(null);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    setRefreshing(true);
    try {
      const session = await loadSession();
      if (request !== generation.current) return;
      if (previousId.current !== (session.customer?.id ?? null)) {
        const privateQueries = {
          predicate: (query: { queryKey: readonly unknown[] }) =>
            ['admin', 'my-bookings', 'booking-confirmation'].includes(
              String(query.queryKey[0]),
            ),
        };
        await queryClient.cancelQueries(privateQueries);
        queryClient.removeQueries(privateQueries);
      }
      if (request !== generation.current) return;
      previousId.current = session.customer?.id ?? null;
      setCustomer(session.customer);
      setError('');
    } catch (failure) {
      if (request === generation.current)
        setError(
          failure instanceof Error
            ? failure.message
            : 'Couldn’t check your sign-in.',
        );
    } finally {
      if (request === generation.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [queryClient]);

  useEffect(() => {
    void refresh();
    const focus = () => {
      void refresh();
    };
    window.addEventListener('focus', focus);
    const timer = window.setInterval(focus, 60_000);
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('cinemar-account');
      channel.current.onmessage = focus;
    }
    return () => {
      window.removeEventListener('focus', focus);
      window.clearInterval(timer);
      channel.current?.close();
    };
  }, [refresh]);

  async function signOut() {
    await accountAction('sign-out');
    await refresh();
    channel.current?.postMessage('changed');
  }

  return { customer, loading, refreshing, error, refresh, signOut };
}
