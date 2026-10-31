import assert from 'node:assert/strict';

const origin = process.argv[2] ?? 'http://localhost:5173';
const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Kyiv',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
for (const path of [
  '/api/account/session',
  `/api/showtimes?date=${date}&format=2D`,
]) {
  const response = await fetch(origin + path, {
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(
    response.status,
    200,
    `${path} must be served by the current, healthy backend`,
  );
  const body = await response.json();
  if (path.includes('/session'))
    assert.ok(
      typeof body.csrfToken === 'string' && 'customer' in body,
      'The account endpoint must return a session response.',
    );
  else
    assert.ok(
      Array.isArray(body),
      'The showtimes endpoint must return screenings.',
    );
  console.log(`PASS ${path}`);
}
