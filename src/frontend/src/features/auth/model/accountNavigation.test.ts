import { expect, it } from 'vitest';
import { accountSignInUrl, safeReturnTo } from './accountNavigation';

it('sign-in preserves a booking round trip while rejecting external and recursive return destinations', () => {
  const url = accountSignInUrl('/booking/42', '?checkout=true');
  const returnTo = new URL(url, 'https://cinema.example').searchParams.get(
    'returnTo',
  );

  expect(safeReturnTo(returnTo)).toBe('/booking/42?checkout=true');

  for (const unsafe of [
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/account/sign-in',
    'javascript:alert(1)',
  ]) {
    expect(safeReturnTo(unsafe)).toBe('/account/bookings');
  }
});
