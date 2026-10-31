// Run only against the disposable database documented in docs/authentication-design.md.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const api = process.env.AUTH_TEST_API ?? 'http://127.0.0.1:5081';
const inbox = process.env.AUTH_TEST_INBOX ?? 'http://127.0.0.1:8025';
const connection = process.env.AUTH_TEST_CONNECTION;
for (const origin of [api, inbox])
  assert.ok(
    ['127.0.0.1', 'localhost'].includes(new URL(origin).hostname),
    'Verification must use a local server.',
  );
assert.ok(
  connection?.includes('Database=cinemar_auth_verification;'),
  'Set AUTH_TEST_CONNECTION to the disposable cinemar_auth_verification database.',
);
const backend = fileURLToPath(
  new URL('../src/backend/CinemaR.Api/', import.meta.url),
);
const suffix = randomUUID().slice(0, 8);
const password = `Cinema-${randomUUID()}-Aa1!`;
const email = `customer-${suffix}@example.test`;
const adminEmail = `administrator-${suffix}@example.test`;

function browser() {
  const cookies = new Map();
  let csrf;
  async function request(path, method = 'GET', body, protect = true) {
    if (method !== 'GET' && protect && !csrf) await session();
    const headers = {
      Cookie: [...cookies]
        .map(([name, value]) => `${name}=${value}`)
        .join('; '),
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (protect && csrf && method !== 'GET') headers['X-CSRF-Token'] = csrf;
    const response = await fetch(api + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [name, ...value] = cookie.split(';')[0].split('=');
      cookies.set(name, value.join('='));
    }
    if (response.status === 429) {
      console.log(
        'Account rate limit reached as expected; waiting for the next window.',
      );
      await delay(60_000);
      return request(path, method, body, protect);
    }
    const result = await response.json().catch(() => null);
    return { status: response.status, result, headers: response.headers };
  }
  async function session() {
    const response = await request('/api/account/session');
    assert.equal(response.status, 200);
    csrf = response.result.csrfToken;
    return response.result.customer;
  }
  return { request, session };
}

async function emailLink(address, path) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const list = await (await fetch(`${inbox}/api/v1/messages`)).json();
    for (const item of list.messages ?? []) {
      if (!item.To?.some((to) => to.Address === address)) continue;
      const message = await (
        await fetch(`${inbox}/api/v1/message/${item.ID}`)
      ).json();
      const links = message.Text?.match(/http[^\s]+/g) ?? [];
      const link = links.find(
        (value) => new URL(value).pathname === `/account/${path}`,
      );
      if (link) return new URL(link);
    }
    await delay(250);
  }
  throw new Error(`No ${path} email found for test account.`);
}

async function verify(client, address) {
  const link = await emailLink(address, 'verify-email');
  const response = await client.request(
    '/api/account/verify-email',
    'POST',
    Object.fromEntries(link.searchParams),
  );
  assert.equal(response.status, 200, 'Verification succeeds.');
}

async function signIn(client, address, secret = password) {
  const response = await client.request('/api/account/sign-in', 'POST', {
    email: address,
    password: secret,
  });
  assert.equal(response.status, 200, 'Verified credentials sign in.');
  const cookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith('cinemaR.session='));
  assert.match(cookie, /httponly/i);
  assert.match(cookie, /samesite=strict/i);
  assert.doesNotMatch(
    cookie,
    /expires=|max-age=/i,
    'Sign-in uses a browser-session cookie.',
  );
  return client.session();
}

const customer = browser();
assert.equal((await customer.request('/api/admin/movies')).status, 401);
assert.equal((await customer.request('/api/account/bookings')).status, 401);
assert.equal(
  (
    await customer.request(
      '/api/account/register',
      'POST',
      { email, password },
      false,
    )
  ).status,
  400,
  'CSRF protects anonymous account writes.',
);
await customer.session();
assert.equal(
  (
    await customer.request('/api/account/register', 'POST', {
      email,
      password,
      isAdministrator: true,
    })
  ).status,
  200,
);
assert.equal(
  (await customer.request('/api/account/sign-in', 'POST', { email, password }))
    .status,
  401,
  'Unverified email cannot sign in.',
);
await verify(customer, email);
const owner = await signIn(customer, email);
assert.equal(
  owner.isAdministrator,
  false,
  'Registration cannot grant administrator privileges.',
);
assert.equal(
  (await customer.request('/api/admin/movies')).status,
  403,
  'Customer cannot access administration.',
);
console.log(
  'Passed: registration, verification, cookies, CSRF, and customer/admin isolation.',
);

const setup = spawnSync(
  'dotnet',
  [
    'bin/Debug/net10.0/CinemaR.Api.dll',
    'setup-admin',
    '--environment',
    'Development',
    '--Logging:LogLevel:Default',
    'Warning',
  ],
  {
    cwd: backend,
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, ConnectionStrings__CinemaR: connection },
    input: `${adminEmail}\n${password}\n`,
  },
);
assert.equal(setup.status, 0, 'Administrator setup succeeds.');
const repeat = spawnSync(
  'dotnet',
  [
    'bin/Debug/net10.0/CinemaR.Api.dll',
    'setup-admin',
    '--environment',
    'Development',
    '--Logging:LogLevel:Default',
    'Warning',
  ],
  {
    cwd: backend,
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, ConnectionStrings__CinemaR: connection },
  },
);
assert.equal(repeat.status, 0);
assert.match(repeat.stdout, /already exists/);
const admin = browser();
await verify(admin, adminEmail);
assert.equal((await signIn(admin, adminEmail)).isAdministrator, true);
const catalog = await admin.request('/api/admin/movies');
assert.equal(
  catalog.status,
  200,
  'Verified administrator can access administration.',
);
console.log(
  'Passed: single-administrator provisioning, repeated setup, verification, and authorized administration.',
);

const adminRegression = spawnSync(
  'node',
  [
    fileURLToPath(new URL('./check-admin-api.cjs', import.meta.url)),
    api,
    '--allow-writes',
  ],
  {
    encoding: 'utf8',
    windowsHide: true,
    env: {
      ...process.env,
      CINEMAR_ADMIN_EMAIL: adminEmail,
      CINEMAR_ADMIN_PASSWORD: password,
    },
  },
);
assert.equal(
  adminRegression.status,
  0,
  `Authenticated administration regression failed: ${adminRegression.stderr}`,
);
console.log(
  'Passed: existing administration write and booking regressions with authenticated access.',
);

// Use a future seeded screening in this disposable database.
const dates = Array.from({ length: 7 }, (_, offset) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Date.now() + offset * 86400000)),
);
let map;
for (const date of dates) {
  const showtimes = await customer.request(
    `/api/showtimes?date=${date}&format=2D`,
  );
  const showtime = showtimes.result?.find(
    (item) => Date.parse(item.startsAt) > Date.now() + 600_000,
  );
  if (!showtime) continue;
  map = (await customer.request(`/api/showtimes/${showtime.id}/seats`)).result;
  if (map?.seats.filter((seat) => !seat.taken).length >= 3) break;
}
assert.ok(map, 'Disposable seed contains a future screening.');
const seats = map.seats.filter((seat) => !seat.taken).slice(0, 3);
const requestId = randomUUID();
const body = {
  requestId,
  email: 'forged-contact@example.test',
  seatIds: [seats[0].id],
  expectedCustomerId: owner.id,
};
const booked = await customer.request(
  `/api/showtimes/${map.showtimeId}/bookings`,
  'POST',
  body,
);
assert.equal(booked.status, 200);
assert.equal(
  booked.result.email,
  email,
  'Signed-in email is derived by the server.',
);
assert.equal(
  (
    await customer.request(
      `/api/showtimes/${map.showtimeId}/bookings`,
      'POST',
      body,
    )
  ).result.confirmationToken,
  booked.result.confirmationToken,
  'Same-owner replay is idempotent.',
);
let history = await customer.request('/api/account/bookings');
assert.equal(history.result.items.length, 1);
assert.equal(
  history.result.items[0].confirmationToken,
  booked.result.confirmationToken,
);
const guest = browser();
assert.equal(
  (await guest.request(`/api/bookings/${booked.result.confirmationToken}`))
    .status,
  200,
  'Private links remain accessible without sign-in.',
);
const qr = await fetch(
  `${api}/api/bookings/${booked.result.confirmationToken}/tickets/${seats[0].id}/qr`,
);
assert.equal(qr.status, 200);
assert.equal(qr.headers.get('content-type'), 'image/png');
assert.equal(
  (
    await guest.request(
      `/api/showtimes/${map.showtimeId}/bookings`,
      'POST',
      body,
    )
  ).status,
  401,
  'Expired session never becomes a guest booking.',
);
assert.equal(
  (
    await admin.request(`/api/showtimes/${map.showtimeId}/bookings`, 'POST', {
      ...body,
      expectedCustomerId: (await admin.session()).id,
    })
  ).status,
  409,
  'Another owner cannot replay an existing request.',
);
const guestBooking = await guest.request(
  `/api/showtimes/${map.showtimeId}/bookings`,
  'POST',
  { requestId: randomUUID(), email, seatIds: [seats[1].id] },
);
assert.equal(guestBooking.status, 200);
history = await customer.request('/api/account/bookings');
assert.equal(
  history.result.items.length,
  1,
  'Guest bookings are never claimed by matching email.',
);
assert.equal(
  (await admin.request('/api/account/bookings')).result.items.length,
  0,
  'Another account cannot see customer history.',
);
console.log(
  'Passed: booking ownership, history isolation, guest checkout, private links/QR, and replay/session boundaries.',
);

assert.equal(
  (await customer.request('/api/account/forgot-password', 'POST', { email }))
    .status,
  200,
);
const resetLink = await emailLink(email, 'reset-password');
const replacement = `New-${randomUUID()}-Aa1!`;
assert.equal(
  (
    await customer.request('/api/account/reset-password', 'POST', {
      ...Object.fromEntries(resetLink.searchParams),
      password: replacement,
    })
  ).status,
  200,
);
assert.equal(
  await customer.session(),
  null,
  'Password reset invalidates existing sessions.',
);
assert.equal(
  (
    await customer.request('/api/account/reset-password', 'POST', {
      ...Object.fromEntries(resetLink.searchParams),
      password: replacement,
    })
  ).status,
  400,
  'Reset links are single-use.',
);
const resetBrowser = browser();
assert.equal(
  (
    await resetBrowser.request('/api/account/sign-in', 'POST', {
      email,
      password,
    })
  ).status,
  401,
  'Old password no longer works.',
);
await signIn(resetBrowser, email, replacement);
assert.equal(
  (await resetBrowser.request('/api/account/sign-out', 'POST')).status,
  200,
);
assert.equal(await resetBrowser.session(), null);
console.log(
  'Passed: email password recovery, single-use reset tokens, new credentials, and sign-out.',
);

const locked = browser();
for (let attempt = 0; attempt < 5; attempt++)
  assert.equal(
    (
      await locked.request('/api/account/sign-in', 'POST', {
        email,
        password: 'Wrong-password-1!',
      })
    ).status,
    401,
  );
assert.equal(
  (
    await locked.request('/api/account/sign-in', 'POST', {
      email,
      password: replacement,
    })
  ).status,
  401,
  'Repeated failures temporarily lock the account.',
);
console.log(
  'Passed: failed-login lockout. Authentication integration checks complete.',
);
