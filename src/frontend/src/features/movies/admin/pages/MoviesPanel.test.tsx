import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { MoviesPanel } from './MoviesPanel';

afterEach(() => vi.unstubAllGlobals());

it('loads movies without requiring auditorium or combined administration data', async () => {
  const request = vi.fn(async (url: string) => {
    if (url !== '/api/admin/movies') {
      throw new Error('Unrelated resource is unavailable');
    }

    return new Response(
      JSON.stringify([
        {
          id: 1,
          title: 'Example film',
          durationMinutes: 100,
          genres: ['Drama'],
          synopsis: '',
          posterUrl: null,
          backdropUrl: null,
          isArchived: false,
          isUsed: false,
        },
      ]),
    );
  });

  vi.stubGlobal('fetch', request);
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MoviesPanel />
    </QueryClientProvider>,
  );
  expect(await screen.findByText('Example film')).toBeInTheDocument();
  expect(request.mock.calls.every(([url]) => url === '/api/admin/movies')).toBe(
    true,
  );
});
