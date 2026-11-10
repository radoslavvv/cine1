import http from 'k6/http';
import { sleep } from 'k6';
import exec from 'k6/execution';
import { Counter, Rate } from 'k6/metrics';
import { base } from './config.js';

const confirmed = new Counter('booking_confirmed');
const conflicts = new Counter('seat_conflicts');
export const unexpected = new Rate('unexpected_outcome');
export const identityMismatch = new Rate('replay_mismatch');
let csrf;

export function session() {
  if (csrf) {
    return true;
  }

  const response = http.get(`${base}/api/account/session`, {
    tags: { name: 'session', operation: 'session' },
    timeout: '10s',
  });
  const data = body(response);
  const valid = response.status === 200 && typeof data.csrfToken === 'string';

  unexpected.add(!valid);
  csrf = valid ? data.csrfToken : undefined;

  return valid;
}

export function body(response) {
  try {
    return response.json() || {};
  } catch {
    return {};
  }
}

export function id(number) {
  return `00000000-0000-4000-8000-${number.toString(16).padStart(12, '0')}`;
}

export function ticketsIdentity(tickets) {
  // setup() data can return with JSON object keys in a different order.
  return JSON.stringify(
    (tickets || []).map((ticket) => [
      ticket.seatId,
      ticket.ticketCode,
      ticket.rowLabel,
      ticket.number,
    ]),
  );
}

export function book(
  showtimeId,
  seatIds,
  requestId,
  email,
  allowConflict = false,
) {
  const response = http.post(
    `${base}/api/showtimes/${showtimeId}/bookings`,
    JSON.stringify({ requestId, email, seatIds }),
    {
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      tags: { name: 'booking', operation: 'booking' },
      timeout: '15s',
      responseCallback: http.expectedStatuses(
        200,
        ...(allowConflict ? [409] : []),
      ),
    },
  );
  const data = body(response);
  const returnedSeats = (data.tickets || [])
    .map((ticket) => ticket.seatId)
    .sort((left, right) => left - right);
  const requestedSeats = [...seatIds].sort((left, right) => left - right);
  const success =
    response.status === 200 &&
    typeof data.confirmationToken === 'string' &&
    data.showtimeId === showtimeId &&
    data.email === email &&
    JSON.stringify(returnedSeats) === JSON.stringify(requestedSeats);
  const taken =
    allowConflict && response.status === 409 && data.code === 'seats_taken';

  confirmed.add(success ? 1 : 0);
  conflicts.add(taken ? 1 : 0);
  unexpected.add(!success && !taken);

  return { success, data };
}

export function rendezvous(data) {
  if (!session()) {
    return false;
  }

  // Align requests approximately after CSRF setup; exact lock interleavings belong in integration tests.
  const remaining =
    Math.max(data.startAt, exec.scenario.startTime + 3000) - Date.now();

  if (remaining > 0) {
    sleep(remaining / 1000);
  }

  return true;
}
