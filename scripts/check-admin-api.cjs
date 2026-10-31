// Run only against a disposable database: this test intentionally preserves booking history.
// node scripts/check-admin-api.cjs http://localhost:5081 --allow-writes
// Set CINEMAR_ADMIN_EMAIL and CINEMAR_ADMIN_PASSWORD to a verified test administrator.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const base = process.argv[2];
if (!base || !process.argv.includes('--allow-writes'))
  throw new Error('Provide a disposable API URL and --allow-writes.');
const label = `Admin check ${randomUUID().slice(0, 8)}`;
const sessions = {
  guest: { cookies: new Map(), csrf: null },
  admin: { cookies: new Map(), csrf: null },
};
function storeCookies(session, response) {
  for (const cookie of response.headers.getSetCookie()) {
    const [name, ...value] = cookie.split(';')[0].split('=');
    session.cookies.set(name, value.join('='));
  }
}
const cookieHeader = (session) =>
  [...session.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
async function refreshSession(session) {
  const response = await fetch(base + '/api/account/session', {
    headers: { Cookie: cookieHeader(session) },
  });
  assert.equal(response.status, 200);
  storeCookies(session, response);
  session.csrf = (await response.json()).csrfToken;
}
async function request(
  path,
  method = 'GET',
  body,
  status = 200,
  sessionName = path.startsWith('/api/admin/') ? 'admin' : 'guest',
) {
  const session = sessions[sessionName];
  if (method !== 'GET' && !session.csrf) await refreshSession(session);
  const response = await fetch(base + path, {
    method,
    headers: {
      Cookie: cookieHeader(session),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(method !== 'GET' ? { 'X-CSRF-Token': session.csrf } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  storeCookies(session, response);
  const result = await response.json().catch(() => null);
  assert.equal(
    response.status,
    status,
    `${method} ${path}: ${JSON.stringify(result)}`,
  );
  return result;
}
const admin = (path, method, body, status) =>
  request(`/api/admin/${path}`, method, body, status);
const day = (offset) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

(async () => {
  const email = process.env.CINEMAR_ADMIN_EMAIL;
  const password = process.env.CINEMAR_ADMIN_PASSWORD;
  assert.ok(
    email && password,
    'Provide verified disposable administrator credentials through CINEMAR_ADMIN_EMAIL and CINEMAR_ADMIN_PASSWORD.',
  );
  await request(
    '/api/account/sign-in',
    'POST',
    { email, password },
    200,
    'admin',
  );
  await refreshSession(sessions.admin);
  const initial = { movies: await admin('movies'), auditoriums: await admin('auditoriums') };
  assert(
    initial.auditoriums.every((a) => a.supportedFormats.length > 0),
    'Migrated/seeded rooms retain formats',
  );
  const movie = {
    title: label,
    durationMinutes: 90,
    genres: ['Drama'],
    synopsis: '',
    posterUrl: 'https://example.com/poster.jpg',
    backdropUrl: null,
  };
  const movieId = await admin('movies', 'POST', movie);
  await admin(
    'movies',
    'POST',
    { ...movie, posterUrl: 'javascript:alert(1)' },
    400,
  );
  const room = {
    name: label,
    rows: 2,
    seatsPerRow: 20,
    supportedFormats: ['2D', '3D'],
  };
  const roomId = await admin('auditoriums', 'POST', room);
  const updateRoom = { ...room, rows: 3, replaceLayout: true };
  await admin(`auditoriums/${roomId}`, 'PUT', updateRoom);
  const rooms = await admin('auditoriums');
  assert.equal(
    rooms.find((a) => a.id === roomId).seats.length,
    60,
  );
  const show = {
    movieId,
    auditoriumId: roomId,
    format: '2D',
    localTime: '19:00',
    dates: [day(14)],
  };
  await admin('showtimes', 'POST', { ...show, format: 'IMAX 3D' }, 400);
  const [showId] = await admin('showtimes', 'POST', show);
  await admin('showtimes', 'POST', { ...show, dates: [day(14), day(15)] }, 409);
  assert(
    !(await admin(`showtimes?date=${day(15)}`)).some(
      (s) => s.auditoriumId === roomId,
    ),
    'Conflicting batch saved nothing',
  );
  const ids = await admin('showtimes', 'POST', {
    ...show,
    dates: [day(15), day(16)],
  });
  assert.equal(ids.length, 2);
  await admin(`movies/${movieId}/archive`, 'POST', undefined, 409);
  await admin(`auditoriums/${roomId}/retire`, 'POST', undefined, 409);
  await admin(
    `auditoriums/${roomId}`,
    'PUT',
    { ...updateRoom, supportedFormats: ['3D'], replaceLayout: false },
    409,
  );
  await admin(`movies/${movieId}`, 'PUT', {
    ...movie,
    title: `${label} corrected`,
    durationMinutes: 150,
  });
  const publicShow = (
    await request(`/api/showtimes?date=${day(14)}&format=2D`)
  ).find((s) => s.id === showId);
  assert.equal(
    publicShow.movie.durationMinutes,
    90,
    'Runtime edits do not change existing screenings',
  );
  assert.equal(publicShow.movie.posterUrl, movie.posterUrl);
  const map = await request(`/api/showtimes/${showId}/seats`);
  assert.equal(map.movie.durationMinutes, 90);
  const requestId = randomUUID();
  const bookingInput = {
    requestId,
    email: `test-${label.replaceAll(' ', '-')}@example.com`,
    seatIds: [map.seats[0].id],
  };
  const confirmation = await request(
    `/api/showtimes/${showId}/bookings`,
    'POST',
    bookingInput,
  );
  assert(confirmation.tickets[0].ticketCode);
  await admin(
    `showtimes/${showId}`,
    'PUT',
    { ...show, localTime: '20:00' },
    409,
  );
  await admin(`auditoriums/${roomId}`, 'PUT', { ...updateRoom, rows: 4 }, 409);
  const bookings = await admin(
    `bookings?search=${encodeURIComponent(bookingInput.email)}&movieId=${movieId}&auditoriumId=${roomId}&date=${day(14)}&status=active`,
  );
  assert.equal(bookings.total, 1);
  assert.equal(bookings.items[0].id, requestId);
  assert.deepEqual((await admin(`bookings/${requestId}`)).seats, ['A1']);
  assert(
    !JSON.stringify(bookings).includes(confirmation.confirmationToken),
    'Admin list excludes private ticket credentials',
  );
  // Exercise real pagination with distinct confirmed seats.
  for (let i = 1; i < 26; i++)
    await request(`/api/showtimes/${showId}/bookings`, 'POST', {
      ...bookingInput,
      requestId: randomUUID(),
      seatIds: [map.seats[i].id],
    });
  const page1 = await admin(`bookings?movieId=${movieId}`);
  const page2 = await admin(`bookings?movieId=${movieId}&page=2`);
  assert.equal(page1.total, 26);
  assert.equal(page1.items.length, 25);
  assert.equal(page2.items.length, 1);
  assert(!page1.items.some((a) => a.id === page2.items[0].id));
  await admin(`showtimes/${showId}/cancel`, 'POST');
  assert(
    !(await request(`/api/showtimes?date=${day(14)}&format=2D`)).some(
      (s) => s.id === showId,
    ),
  );
  const cancelled = await request(
    `/api/bookings/${confirmation.confirmationToken}`,
  );
  assert.equal(cancelled.isCancelled, true);
  assert.equal(cancelled.tickets[0].ticketCode, '');
  await request(
    `/api/bookings/${confirmation.confirmationToken}/tickets/${map.seats[0].id}/qr`,
    'GET',
    undefined,
    410,
  );
  await request(
    `/api/showtimes/${showId}/bookings`,
    'POST',
    { ...bookingInput, requestId: randomUUID() },
    409,
  );
  await request(`/api/showtimes/${showId}/seats`, 'GET', undefined, 404);
  assert.equal(
    (await admin(`bookings?movieId=${movieId}&status=cancelled`)).total,
    26,
  );
  await admin(`auditoriums/${roomId}`, 'PUT', { ...updateRoom, rows: 4 }, 409);
  // Cancellation frees the occupied interval, without deleting historical seats or bookings.
  const [replacement] = await admin('showtimes', 'POST', show);
  assert(replacement !== showId);
  assert.equal(
    (await admin(`showtimes?date=${day(14)}`)).find((s) => s.id === replacement)
      .durationMinutes,
    150,
  );
  for (const id of [...ids, replacement])
    await admin(`showtimes/${id}/cancel`, 'POST');
  await admin(`movies/${movieId}/archive`, 'POST');
  await admin(`auditoriums/${roomId}/retire`, 'POST');
  await admin(`movies/${movieId}`, 'DELETE', undefined, 409);
  await admin(`auditoriums/${roomId}`, 'DELETE', undefined, 409);
  await admin('showtimes', 'POST', { ...show, dates: [day(18)] }, 409);
  const unusedMovie = await admin('movies', 'POST', {
    ...movie,
    title: `${label} unused`,
  });
  const unusedRoom = await admin('auditoriums', 'POST', {
    ...room,
    name: `${label} unused`,
  });
  await admin(`movies/${unusedMovie}`, 'DELETE');
  await admin(`auditoriums/${unusedRoom}`, 'DELETE');
  await admin('bookings?page=0', 'GET', undefined, 400);
  await admin('showtimes?date=bad', 'GET', undefined, 400);
  console.log(
    'PASS: movie and auditorium CRUD, format capabilities, atomic conflicts, runtime snapshots, pagination, booked-layout locks, cancellation, ticket invalidation, retirement and history.',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
