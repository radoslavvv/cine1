import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { FormEvent, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { seatMap } from '../../../test/bookingFixtures';
import { useCheckout } from './useCheckout';

// CSRF transport has its own tests; these exercise booking retries and concurrency.
vi.mock('../../auth/api/authApi', () => ({
  securityFetch: (url: string, init: RequestInit) => fetch(url, init),
}));

const event = { preventDefault: () => {} } as FormEvent<HTMLFormElement>;

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onConflict = vi.fn().mockResolvedValue(undefined);
  const hook = renderHook(
    ({ isOpen }) =>
      useCheckout({
        showtimeId: 1,
        seats: seatMap().seats.slice(0, 2),
        isOpen,
        onConflict,
      }),
    {
      initialProps: { isOpen: true },
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>
          <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
      ),
    },
  );

  act(() => hook.result.current.onEmailChange(' customer@example.com '));

  return { ...hook, client, onConflict };
}

afterEach(() => vi.unstubAllGlobals());

describe('checkout requests', () => {
  it.each(['network', 'server'])(
    'replays the original request after a %s failure, even after start',
    async (failure) => {
      const fetch = vi.fn();

      if (failure === 'network') {
        fetch.mockRejectedValueOnce(new TypeError('Connection lost'));
      } else {
        fetch.mockResolvedValueOnce(new Response('{}', { status: 503 }));
      }

      const confirmation = { confirmationToken: 'private-token', tickets: [] };

      fetch.mockResolvedValueOnce(Response.json(confirmation));
      vi.stubGlobal('fetch', fetch);

      const { result, rerender, client } = setup();

      await act(() => result.current.onSubmit(event));
      expect(result.current.inputsDisabled).toBe(true);
      expect(result.current.submitLabel).toBe('Retry confirmation');
      rerender({ isOpen: false });
      expect(result.current.submitDisabled).toBe(false);
      await act(() => result.current.onSubmit(event));

      const first = JSON.parse(fetch.mock.calls[0][1].body);
      const retry = JSON.parse(fetch.mock.calls[1][1].body);

      expect(first).toEqual({
        requestId: expect.any(String),
        email: 'customer@example.com',
        seatIds: [1, 2],
      });
      expect(retry).toEqual(first);
      expect(
        client.getQueryData(['booking-confirmation', 'private-token']),
      ).toEqual(confirmation);
    },
  );

  it('prevents a double submit while a confirmation is pending', async () => {
    let complete!: (response: Response) => void;
    const fetch = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        complete = resolve;
      }),
    );

    vi.stubGlobal('fetch', fetch);

    const { result } = setup();
    let submission!: Promise<void>;

    act(() => {
      submission = result.current.onSubmit(event);
    });
    await act(() => result.current.onSubmit(event));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBe(true);
    await act(async () => {
      complete(Response.json({ confirmationToken: 'private-token' }));
      await submission;
    });
    expect(result.current.pending).toBe(false);
  });

  it.each(['seats_taken', 'showtime_started', 'showtime_cancelled'])(
    'refreshes availability after %s and starts a fresh attempt',
    async (code) => {
      const fetch = vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(
            Response.json({ code, title: 'Choose again' }, { status: 409 }),
          ),
        );

      vi.stubGlobal('fetch', fetch);

      const { result, onConflict } = setup();

      await act(() => result.current.onSubmit(event));
      expect(onConflict).toHaveBeenCalledWith('Choose again');
      expect(result.current.inputsDisabled).toBe(false);
      await act(() => result.current.onSubmit(event));
      expect(JSON.parse(fetch.mock.calls[1][1].body).requestId).not.toBe(
        JSON.parse(fetch.mock.calls[0][1].body).requestId,
      );
    },
  );

  it('does not submit a new booking after the showtime closes', async () => {
    const fetch = vi.fn();

    vi.stubGlobal('fetch', fetch);

    const { result, rerender } = setup();

    rerender({ isOpen: false });
    await act(() => result.current.onSubmit(event));
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.submitDisabled).toBe(true);
  });
});
