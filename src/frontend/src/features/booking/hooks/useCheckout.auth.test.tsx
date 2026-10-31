import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormEvent, ReactNode } from 'react';
import type { Customer } from '../../auth/types';
import { seatMap } from '../../../test/bookingFixtures';
import { useCheckout } from './useCheckout';
import { BookingError } from '../api/bookingQueries';

const state = vi.hoisted(() => ({
  customer: null as Customer | null,
  loading: false,
  error: '',
  refresh: vi.fn(),
  signOut: vi.fn(),
  confirm: vi.fn(),
}));
vi.mock('../../auth/hooks/useAuth', () => ({ useAuth: () => state }));
vi.mock('../api/bookingQueries', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  confirmBooking: state.confirm,
}));

const owner: Customer = {
  id: 'owner',
  email: 'verified@example.test',
  isAdministrator: false,
};
const event = { preventDefault() {} } as FormEvent<HTMLFormElement>;
function setup() {
  const client = new QueryClient();
  return renderHook(
    () =>
      useCheckout({
        showtimeId: 1,
        seats: seatMap().seats.slice(0, 1),
        isOpen: true,
        onConflict: vi.fn(),
      }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>
          <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
      ),
    },
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  state.customer = owner;
  state.loading = false;
  state.error = '';
  state.confirm.mockResolvedValue({ confirmationToken: 'token' });
});

describe('checkout identity boundaries', () => {
  it('uses the verified email and includes the expected owner in confirmation', async () => {
    const { result } = setup();
    act(() => result.current.onEmailChange('different@example.test'));
    await act(() => result.current.onSubmit(event));
    expect(state.confirm).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        email: owner.email,
        expectedCustomerId: owner.id,
      }),
    );
    expect(result.current.emailReadOnly).toBe(true);
  });

  it('requires an explicit choice when the account disappears, then permits guest checkout', async () => {
    const { result, rerender } = setup();
    state.customer = null;
    rerender();
    expect(result.current.sessionChanged).toBe(true);
    await act(() => result.current.onSubmit(event));
    expect(state.confirm).not.toHaveBeenCalled();
    await act(() => result.current.onContinueAsGuest());
    act(() => result.current.onEmailChange('guest@example.test'));
    await act(() => result.current.onSubmit(event));
    const request = state.confirm.mock.calls[0][1];
    expect(request.email).toBe('guest@example.test');
    expect(request.expectedCustomerId).toBeUndefined();
  });

  it('does not silently adopt a different account signed in through another tab', async () => {
    const { result, rerender } = setup();
    state.customer = { ...owner, id: 'other', email: 'other@example.test' };
    rerender();
    expect(result.current.submitDisabled).toBe(true);
    act(() => result.current.onUseCurrentAccount());
    await act(() => result.current.onSubmit(event));
    expect(state.confirm).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ expectedCustomerId: 'other' }),
    );
  });

  it('refreshes the session and stops after a server-side expiry response', async () => {
    state.confirm.mockRejectedValue(
      new BookingError(401, 'session_changed', 'Your sign-in changed.'),
    );
    const { result } = setup();
    await act(() => result.current.onSubmit(event));
    expect(state.refresh).toHaveBeenCalledTimes(1);
    expect(result.current.sessionChanged).toBe(true);
    expect(result.current.submitDisabled).toBe(true);
    expect(state.confirm).toHaveBeenCalledTimes(1);
  });

  it('keeps an uncertain confirmation bound to its original account through expiry and sign-in', async () => {
    state.confirm.mockRejectedValueOnce(new TypeError('Connection lost'));
    const { result, rerender } = setup();
    await act(() => result.current.onSubmit(event));
    const original = state.confirm.mock.calls[0][1];
    state.customer = null;
    rerender();
    expect(result.current.canContinueAsGuest).toBe(false);
    await act(() => result.current.onContinueAsGuest());
    expect(result.current.sessionChanged).toBe(true);
    state.customer = owner;
    rerender();
    await act(() => result.current.onSubmit(event));
    expect(state.confirm.mock.calls[1][1]).toBe(original);
  });
});
