import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountPage } from '@/features/auth/pages/AccountPage';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';

const api = vi.hoisted(() => ({
  loadSession: vi.fn(),
  accountAction: vi.fn(),
}));

vi.mock('@/features/auth/api/authApi', () => api);
vi.mock('@/shared/components/MotionSurface/MotionSurface', () => ({
  MotionSurface: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock('@/shared/hooks/useCinemaMotion', () => ({
  useCinemaMotion: () => ({ transition: {} }),
}));
vi.mock('@/shared/components/ProjectorAtmosphere/ProjectorAtmosphere', () => ({
  ProjectorAtmosphere: () => null,
}));

function showAccount(path = '/account/register') {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/account/:action" element={<AccountPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  api.loadSession.mockReset().mockResolvedValue({ customer: null });
  api.accountAction.mockReset();
});

describe('account pages within the cinema', () => {
  it('uses the cinema header and footer and calls the registration field Password', async () => {
    showAccount();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByLabelText('Password', { exact: true })).toHaveAttribute(
      'autocomplete',
      'new-password',
    );
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /back to showtimes/i }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(api.loadSession).toHaveBeenCalled());
  });

  it.each(['register', 'sign-in', 'forgot-password', 'reset-password'])(
    'does not show verification resend on the initial %s form',
    async (action) => {
      showAccount(`/account/${action}`);
      expect(
        screen.queryByRole('link', { name: /resend verification/i }),
      ).not.toBeInTheDocument();
      await waitFor(() => expect(api.loadSession).toHaveBeenCalled());
    },
  );

  it('keeps account navigation available during a service failure and visibly retries', async () => {
    api.loadSession.mockRejectedValueOnce(
      new Error('The cinema service is unavailable. Please try again.'),
    );
    showAccount();
    expect(
      await screen.findByText(
        'The cinema service is unavailable. Please try again.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Account navigation' }),
    ).toHaveTextContent('Sign in');

    let recover!: (value: { customer: null }) => void;

    api.loadSession.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          recover = resolve;
        }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('button', { name: 'Retrying…' }),
    ).toBeDisabled();
    await act(async () => recover({ customer: null }));
    await waitFor(() =>
      expect(
        screen.queryByText(
          'The cinema service is unavailable. Please try again.',
        ),
      ).not.toBeInTheDocument(),
    );
  });

  it('shows pending and success states for registration and clears the password', async () => {
    let complete!: (message: string) => void;
    api.accountAction.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          complete = resolve;
        }),
    );
    showAccount();
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'customer@example.test' },
    });
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), {
      target: { value: 'Example-Password-123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'Example-Password-123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByRole('button', { name: 'Please wait…' }),
    ).toBeDisabled();
    expect(api.accountAction).toHaveBeenCalledTimes(1);
    expect(api.accountAction).toHaveBeenCalledWith('register', {
      email: 'customer@example.test',
      password: 'Example-Password-123',
      userId: '',
      token: '',
    });
    await act(async () => complete('Check your inbox.'));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Check your inbox.',
    );
    expect(screen.getByLabelText('Password', { exact: true })).toHaveValue('');
  });

  it('shows a failed sign-in without automatically retrying the credentials', async () => {
    api.accountAction.mockRejectedValueOnce(new Error('Unable to sign in.'));
    showAccount('/account/sign-in');
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'customer@example.test' },
    });
    fireEvent.change(screen.getByLabelText('Password', { exact: true }), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to sign in.',
    );
    expect(api.accountAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });
});
