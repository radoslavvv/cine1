import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../providers/AuthProvider';
import { RequireAccount } from './RequireAccount';

afterEach(() => vi.unstubAllGlobals());

it('a signed-in customer cannot render administrator screens', async () => {
  // jsdom has no viewport observers; navigation behavior does not depend on animations.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
    })),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json({
        customer: {
          id: 'customer',
          email: 'customer@example.test',
          isAdministrator: false,
        },
        csrfToken: 'token',
      }),
    ),
  );

  const client = new QueryClient();
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin/bookings']}>
        <AuthProvider>
          <RequireAccount administrator>
            <p>Private administration contents</p>
          </RequireAccount>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  expect(
    await screen.findByRole('heading', {
      name: 'Administrator access required.',
    }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText('Private administration contents'),
  ).not.toBeInTheDocument();

  for (const link of screen.getAllByRole('link', { name: 'My bookings' })) {
    expect(link).toHaveAttribute('href', '/account/bookings');
  }

  view.unmount();
  client.clear();
});
