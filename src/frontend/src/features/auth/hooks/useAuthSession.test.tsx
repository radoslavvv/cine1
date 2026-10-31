import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { moviesQueries } from '../../movies/api/moviesQueries';
import { auditoriumsQueries } from '../../auditoriums/api/auditoriumsQueries';
import { showtimeManagementQueries } from '../../showtimes/admin/api/showtimeManagementQueries';
import { bookingManagementQueries } from '../../booking/admin/api/bookingManagementQueries';
import { useAuthSession } from './useAuthSession';

afterEach(() => vi.unstubAllGlobals());

it('sign-out removes private feature caches and cancels in-flight administration reads while preserving public data', async () => {
  let customer: object | null = {
    id: 'administrator',
    email: 'admin@example.test',
    isAdministrator: true,
  };

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url === '/api/account/sign-out') {
        customer = null;

        return Response.json({ message: 'Signed out.' });
      }

      return Response.json({ customer, csrfToken: 'token' });
    }),
  );

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { result } = renderHook(() => useAuthSession(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });

  await waitFor(() =>
    expect(result.current.customer?.id).toBe('administrator'),
  );

  const privateKeys = [
    moviesQueries.adminList().queryKey,
    auditoriumsQueries.adminList().queryKey,
    showtimeManagementQueries.adminForDate('2026-11-01').queryKey,
    bookingManagementQueries.adminDetail('booking-id').queryKey,
    ['my-bookings', 'administrator', 1],
    ['booking-confirmation', 'private-token'],
  ];

  for (const queryKey of privateKeys) {
    client.setQueryData(queryKey, { private: true });
  }

  const publicKey = ['showtimes', '2026-11-01', '', '2D'];

  client.setQueryData(publicKey, ['public screening']);

  let pendingSignal: AbortSignal | undefined;
  const pending = client
    .fetchQuery({
      queryKey: ['bookings', 'admin', { page: 2 }],
      queryFn: ({ signal }) => {
        pendingSignal = signal;

        return new Promise(() => {});
      },
    })
    .catch(() => undefined);

  await act(() => result.current.signOut());

  expect(result.current.customer).toBeNull();

  for (const queryKey of privateKeys) {
    expect(client.getQueryData(queryKey)).toBeUndefined();
  }

  expect(pendingSignal?.aborted).toBe(true);
  await pending;
  expect(client.getQueryData(publicKey)).toEqual(['public screening']);
  client.clear();
});
