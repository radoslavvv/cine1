import { useState, type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { useShowtimes } from './useShowtimes';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('changing filters preserves the URL and marks previous results as updating until the matching response arrives', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));

  let complete!: (response: Response) => void;
  const fetch = vi.fn(async (url: string) => {
    if (
      new URL(url, 'https://cinema.example').searchParams.get('genre') ===
      'Comedy'
    ) {
      return new Promise<Response>((resolve) => {
        complete = resolve;
      });
    }

    return Response.json([
      {
        id: 1,
        startsAt: '2026-11-01T18:00:00Z',
        format: '2D',
        movie: {
          id: 3,
          title: 'Drama film',
          genres: ['Drama'],
          durationMinutes: 100,
          synopsis: '',
        },
        auditorium: { id: 7, name: 'Room' },
      },
    ]);
  });

  vi.stubGlobal('fetch', fetch);

  const client = new QueryClient();
  const { result, unmount } = renderHook(
    () => {
      const [params, setParams] = useState(
        new URLSearchParams('date=2026-11-01&format=2D&source=shared'),
      );

      return {
        ...useShowtimes({
          searchParams: params,
          onSearchParamsChange: setParams,
        }),
        params,
      };
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );

  await waitFor(() =>
    expect(result.current.movies?.[0].title).toBe('Drama film'),
  );
  act(() => result.current.onFilterChange('genre', 'Comedy'));
  await waitFor(() => expect(result.current.isUpdating).toBe(true));
  expect(result.current.params.get('source')).toBe('shared');
  expect(result.current.genre).toBe('Comedy');
  await act(async () => {
    complete(Response.json([]));
  });
  await waitFor(() => expect(result.current.isUpdating).toBe(false));
  expect(result.current.movies).toEqual([]);
  expect(fetch.mock.calls.some(([url]) => url.includes('genre=Comedy'))).toBe(
    true,
  );
  unmount();
  client.clear();
});
