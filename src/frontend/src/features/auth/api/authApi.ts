import type { Customer } from '../types';

let csrfToken: string | null = null;

export async function loadSession(): Promise<{ customer: Customer | null }> {
  let response: Response;

  try {
    response = await fetch('/api/account/session', {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error('The cinema service is unavailable. Please try again.');
  }

  if (!response.ok) {
    throw new Error('The cinema service is unavailable. Please try again.');
  }

  const session = (await response.json()) as {
    customer: Customer | null;
    csrfToken: string;
  };

  csrfToken = session.csrfToken;

  return session;
}

export async function securityFetch(url: string, init: RequestInit = {}) {
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(
    (init.method ?? 'GET').toUpperCase(),
  );

  if (unsafe && !csrfToken) {
    await loadSession();
  }

  const send = () => {
    const headers = new Headers(init.headers);

    if (unsafe) {
      headers.set('X-CSRF-Token', csrfToken!);
    }

    return fetch(url, { ...init, headers, cache: 'no-store' });
  };

  let response = await send();

  // A rejected CSRF check runs before the action, so this retry cannot duplicate a write.
  if (unsafe && response.status === 400) {
    const problem = (await response
      .clone()
      .json()
      .catch(() => ({}))) as { code?: string };

    if (problem.code === 'csrf_invalid') {
      await loadSession();
      response = await send();
    }
  }

  return response;
}

export async function accountAction(path: string, body: object = {}) {
  const response = await securityFetch(`/api/account/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => ({}))) as {
    message?: string;
    title?: string;
    errors?: Record<string, string[]>;
  };

  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? 'Too many attempts. Please wait a minute and try again.'
        : Object.values(result.errors ?? {})
            .flat()
            .join(' ') ||
            result.title ||
            'Something went wrong. Please try again.',
    );
  }

  return result.message ?? 'Done.';
}
