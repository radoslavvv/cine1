import { securityFetch } from './authApi';

export async function adminRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await securityFetch(`/api/admin/${path}`, {
    ...init,
    cache: 'no-store',
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as {
      title?: string;
      errors?: Record<string, string[]>;
    };
    const details = Object.values(problem.errors ?? {})
      .flat()
      .join(' ');

    throw new Error(
      details || problem.title || `Request failed (${response.status}).`,
    );
  }

  return response.json() as Promise<T>;
}
