import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe('cookie authentication transport', () => {
  it('gets an anonymous CSRF token before a write and sends it as a header', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ customer: null, csrfToken: 'anonymous-token' }),
      )
      .mockResolvedValueOnce(Response.json({ message: 'Done' }));

    vi.stubGlobal('fetch', fetch);

    const { accountAction } = await import('./authApi');

    await accountAction('register', {
      email: 'guest@example.com',
      password: 'Example-Password-1',
    });
    expect(fetch.mock.calls[0][0]).toBe('/api/account/session');
    expect(
      new Headers(fetch.mock.calls[1][1].headers).get('X-CSRF-Token'),
    ).toBe('anonymous-token');
  });

  it('refreshes a stale token and retries only a write rejected by CSRF validation', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ customer: null, csrfToken: 'old' }),
      )
      .mockResolvedValueOnce(
        Response.json({ code: 'csrf_invalid' }, { status: 400 }),
      )
      .mockResolvedValueOnce(
        Response.json({ customer: { id: 'customer' }, csrfToken: 'new' }),
      )
      .mockResolvedValueOnce(Response.json({ message: 'Done' }));

    vi.stubGlobal('fetch', fetch);

    const { accountAction } = await import('./authApi');

    await accountAction('sign-out');
    expect(
      new Headers(fetch.mock.calls[3][1].headers).get('X-CSRF-Token'),
    ).toBe('new');
    expect(fetch.mock.calls[1][1].body).toBe(fetch.mock.calls[3][1].body);
  });

  it('does not automatically replay a failed sign-in or a server error', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ customer: null, csrfToken: 'token' }),
      )
      .mockResolvedValueOnce(
        Response.json({ title: 'Unable to sign in' }, { status: 401 }),
      );

    vi.stubGlobal('fetch', fetch);

    const { accountAction } = await import('./authApi');

    await expect(accountAction('sign-in')).rejects.toThrow('Unable to sign in');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
