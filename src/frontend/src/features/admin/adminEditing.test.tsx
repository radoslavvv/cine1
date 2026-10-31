import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FormEvent, ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useMovieEditor } from '../movies/admin/hooks/useMovieEditor';
import { useAuditoriumEditor } from '../auditoriums/admin/hooks/useAuditoriumEditor';
import { useShowtimeEditor } from '../showtimes/admin/hooks/useShowtimeEditor';

const event = { preventDefault() {} } as FormEvent;
const requests: { url: string; init?: RequestInit }[] = [];
const room = {
  id: 7,
  name: 'Room',
  supportedFormats: ['2D', '3D'],
  isRetired: false,
  layoutLocked: false,
  isUsed: false,
  seats: [
    { rowLabel: 'A', number: 1, gridRow: 0, gridColumn: 0 },
    { rowLabel: 'A', number: 2, gridRow: 0, gridColumn: 1 },
  ],
};

function renderEditor<T>(hook: () => T) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return renderHook(hook, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

beforeEach(() => {
  requests.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      requests.push({ url, init });

      if (url === '/api/account/session') {
        return Response.json({ customer: null, csrfToken: 'token' });
      }

      return Response.json(init?.method ? { id: 1 } : []);
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

it('movie editing sends normalized genres and clears the editor after the API accepts the update', async () => {
  const { result } = renderEditor(useMovieEditor);

  act(() =>
    result.current.edit({
      id: 3,
      title: 'Film',
      durationMinutes: 100,
      genres: ['Drama'],
      synopsis: 'Synopsis',
      posterUrl: null,
      backdropUrl: null,
      isArchived: false,
      isUsed: false,
    }),
  );
  act(() =>
    result.current.setDraft({
      ...result.current.draft,
      genres: 'Drama, Comedy, ',
    }),
  );
  await act(() => result.current.save(event));

  const update = requests.find((request) => request.init?.method === 'PUT')!;

  expect(update.url).toBe('/api/admin/movies/3');
  expect(JSON.parse(String(update.init!.body))).toMatchObject({
    title: 'Film',
    genres: ['Drama', 'Comedy'],
  });
  expect(result.current.editing).toBeNull();
  expect(result.current.action.success).toBe('Movie updated.');
});

it('auditorium editing retains existing seat positions until dimensions change and explicitly requests layout replacement', async () => {
  const { result } = renderEditor(() => useAuditoriumEditor([room]));

  act(() => result.current.edit(room));
  expect(result.current.preview).toEqual(room.seats);
  act(() =>
    result.current.setDraft({
      ...result.current.draft,
      rows: 2,
      seatsPerRow: 3,
    }),
  );
  expect(result.current.preview).toHaveLength(6);
  await act(() => result.current.save(event));

  const update = requests.find((request) => request.init?.method === 'PUT')!;

  expect(update.url).toBe('/api/admin/auditoriums/7');
  expect(JSON.parse(String(update.init!.body))).toMatchObject({
    rows: 2,
    seatsPerRow: 3,
    replaceLayout: true,
  });
  expect(result.current.editing).toBeNull();
});

it('showtime creation uses the chosen room formats, unique dates and numeric resource IDs', async () => {
  const { result } = renderEditor(() => useShowtimeEditor([], [room]));

  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  act(() =>
    result.current.setDraft({
      movieId: '3',
      auditoriumId: '',
      format: 'IMAX 3D',
      localTime: '18:00',
      dates: ['2026-11-02'],
    }),
  );
  act(() => result.current.chooseRoom('7'));
  expect(result.current.draft.format).toBe('2D');
  act(() => result.current.setAdditionalDate('2026-11-02'));
  act(() => result.current.addDate());
  act(() => result.current.setAdditionalDate('2026-11-03'));
  act(() => result.current.addDate());
  await act(() => result.current.save(event));

  const create = requests.find((request) => request.init?.method === 'POST')!;

  expect(create.url).toBe('/api/admin/showtimes');
  expect(JSON.parse(String(create.init!.body))).toMatchObject({
    movieId: 3,
    auditoriumId: 7,
    format: '2D',
    dates: ['2026-11-02', '2026-11-03'],
  });
  expect(result.current.filterMovie).toBe('3');
  expect(result.current.filterRoom).toBe('7');
});
