export function safeReturnTo(value: string | null) {
  // Only known application destinations; never redirect to an external URL or back into sign-in.
  return value &&
    /^\/(?:booking\/[1-9]\d*|schedule|admin(?:\/[a-z]+)?)(?:\?[^#]*)?$/.test(
      value,
    )
    ? value
    : '/account/bookings';
}

export function accountSignInUrl(pathname: string, search: string) {
  const returnTo = pathname.startsWith('/account/')
    ? (new URLSearchParams(search).get('returnTo') ?? '/account/bookings')
    : pathname + search;
  return '/account/sign-in?' + new URLSearchParams({ returnTo });
}
