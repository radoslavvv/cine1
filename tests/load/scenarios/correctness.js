import exec from 'k6/execution';
import { commonOptions, fixture } from '../support/config.js';
import {
  book,
  id,
  identityMismatch,
  rendezvous,
  session,
  ticketsIdentity,
} from '../support/bookingClient.js';

export { handleSummary } from '../support/config.js';

export const options = {
  ...commonOptions,
  scenarios: {
    hot: {
      executor: 'per-vu-iterations',
      exec: 'hot',
      vus: 100,
      iterations: 1,
      maxDuration: '45s',
    },
    overlap: {
      executor: 'per-vu-iterations',
      exec: 'overlap',
      vus: 2,
      iterations: 1,
      startTime: '46s',
      maxDuration: '20s',
    },
    replay: {
      executor: 'per-vu-iterations',
      exec: 'replay',
      vus: 20,
      iterations: 1,
      startTime: '67s',
      maxDuration: '20s',
    },
  },
  thresholds: {
    unexpected_outcome: ['rate==0'],
    replay_mismatch: ['rate==0'],
    'booking_confirmed{scenario:hot}': ['count==1'],
    'seat_conflicts{scenario:hot}': ['count==99'],
    'booking_confirmed{scenario:overlap}': ['count==1'],
    'seat_conflicts{scenario:overlap}': ['count==1'],
    'booking_confirmed{scenario:replay}': ['count==40'],
  },
};

export function setup() {
  if (!session()) {
    throw new Error('Could not establish a guest CSRF session.');
  }

  const original = book(
    fixture.replay.showtimeId,
    fixture.replay.seatIds.slice(0, 2),
    id(2000),
    'replay@example.test',
  );

  if (!original.success) {
    throw new Error('Could not prepare the replay reference booking.');
  }

  return { startAt: Date.now() + 5000, reference: original.data };
}

export function hot(data) {
  if (rendezvous(data)) {
    book(
      fixture.hot.showtimeId,
      [fixture.hot.seatIds[0]],
      id(exec.vu.idInTest),
      `hot${exec.vu.idInTest}@example.test`,
      true,
    );
  }
}

export function overlap(data) {
  if (rendezvous(data)) {
    const index = exec.scenario.iterationInTest;

    book(
      fixture.overlap.showtimeId,
      fixture.overlap.seatIds.slice(index, index + 2),
      id(1000 + index),
      `overlap${index}@example.test`,
      true,
    );
  }
}

export function replay(data) {
  if (!rendezvous(data)) {
    return;
  }

  const seats = fixture.replay.seatIds.slice(0, 2);
  const original = book(
    fixture.replay.showtimeId,
    seats,
    id(2000),
    'replay@example.test',
  );
  const retry = book(
    fixture.replay.showtimeId,
    [...seats].reverse(),
    id(2000),
    'replay@example.test',
  );

  identityMismatch.add(
    !original.success ||
      !retry.success ||
      original.data.confirmationToken !== retry.data.confirmationToken ||
      original.data.confirmationToken !== data.reference.confirmationToken ||
      ticketsIdentity(original.data.tickets) !==
        ticketsIdentity(retry.data.tickets) ||
      ticketsIdentity(retry.data.tickets) !==
        ticketsIdentity(data.reference.tickets),
  );
}
