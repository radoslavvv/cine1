import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountAction, loadSession } from '../api/authApi';
import type { AuthState } from '../types';

const sessionQueryKey = ['account', 'session'] as const;

export function useAuthSession(): AuthState {
  const previousId = useRef<string | null>(null);
  const [retryError, setRetryError] = useState('');
  const queryClient = useQueryClient();
  const channel = useRef<BroadcastChannel | null>(null);
  const session = useQuery({
    queryKey: sessionQueryKey,
    queryFn: async ({ signal }) => {
      const result = await loadSession(signal);

      signal.throwIfAborted();

      if (previousId.current !== (result.customer?.id ?? null)) {
        const privateQueries = {
          predicate: (query: { queryKey: readonly unknown[] }) =>
            query.queryKey[1] === 'admin' ||
            ['admin', 'my-bookings', 'booking-confirmation'].includes(
              String(query.queryKey[0]),
            ),
        };

        await queryClient.cancelQueries(privateQueries);
        queryClient.removeQueries(privateQueries);
      }

      signal.throwIfAborted();
      previousId.current = result.customer?.id ?? null;

      return result;
    },
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    // Keep the existing window-focus behavior, including browser tab switches.
    refetchOnWindowFocus: false,
  });
  const { refetch } = session;
  const refresh = useCallback(async () => {
    // TanStack clears an initial query error on refetch; keep its retry notice visible.
    setRetryError(
      queryClient.getQueryState(sessionQueryKey)?.error?.message ?? '',
    );
    // Even an initial read must not finish with the identity from before sign-in/out.
    await queryClient.cancelQueries({ queryKey: sessionQueryKey, exact: true });
    try {
      await refetch();
    } finally {
      setRetryError('');
    }
  }, [queryClient, refetch]);

  useEffect(() => {
    const focus = () => {
      void refresh();
    };

    window.addEventListener('focus', focus);

    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel('cinemar-account');
      channel.current.onmessage = focus;
    }

    return () => {
      window.removeEventListener('focus', focus);
      channel.current?.close();
    };
  }, [refresh]);

  const signOut = useMutation({
    mutationFn: () => accountAction('sign-out'),
    retry: false,
    gcTime: 0,
    onSuccess: async () => {
      await refresh();
      channel.current?.postMessage('changed');
    },
  });

  return {
    customer: session.data?.customer ?? null,
    loading: session.isPending && !retryError,
    refreshing: session.isFetching,
    error: session.error?.message ?? retryError,
    refresh,
    signOut: async () => {
      await signOut.mutateAsync();
    },
  };
}
