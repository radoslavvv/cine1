import http from 'k6/http';
import exec from 'k6/execution';
import {
  base,
  commonOptions,
  fixture,
  peak,
  stage,
} from '../support/config.js';
import {
  body,
  book,
  id,
  identityMismatch,
  session,
  unexpected,
} from '../support/bookingClient.js';

export { handleSummary } from '../support/config.js';

export const options = {
  ...commonOptions,
  scenarios: {
    capacity: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 100,
      stages: [
        { target: Math.max(1, Math.floor(peak / 4)), duration: stage },
        { target: Math.max(1, Math.floor(peak / 2)), duration: stage },
        { target: peak, duration: stage },
        { target: peak, duration: stage },
        { target: 0, duration: stage },
      ],
      gracefulStop: '30s',
    },
  },
  thresholds: {
    unexpected_outcome: ['rate==0'],
    replay_mismatch: ['rate==0'],
    booking_confirmed: ['count>0'],
    // Dropped work means the requested traffic was not actually generated.
    dropped_iterations: ['count==0'],
    'http_req_duration{operation:booking}': [],
    'http_req_duration{operation:browse}': [],
  },
};

export default function capacity() {
  // Always emit this metric so an absent replay workload cannot hide a missing threshold metric.
  identityMismatch.add(false);

  if (!session()) {
    return;
  }

  const iteration = exec.scenario.iterationInTest;

  if (iteration % 5 !== 0) {
    const response = http.get(
      `${base}/api/showtimes?date=${fixture.date}&format=2D`,
      {
        tags: { name: 'showtimes', operation: 'browse' },
        timeout: '15s',
      },
    );
    const rows = body(response);

    unexpected.add(
      response.status !== 200 || !Array.isArray(rows) || rows.length !== 43,
    );

    return;
  }

  const slot = fixture.capacity[Math.floor(iteration / 5)];

  if (!slot) {
    exec.test.abort(
      'Fixture exhausted; this is a workload configuration failure.',
    );

    return;
  }

  book(
    slot.showtimeId,
    [slot.seatId],
    id(10000 + iteration),
    `load${iteration}@example.test`,
  );
}
