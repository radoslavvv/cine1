import assert from 'node:assert/strict';
import test from 'node:test';
import { getScheduleDates } from '../src/features/schedule/model/demoSchedule.ts';

test('schedule starts on the cinema date when UTC is still the previous day', () => {
  const dates = getScheduleDates(new Date('2026-10-27T23:30:00Z'));
  assert.equal(dates[0].key, '2026-10-28');
  assert.equal(dates[0].weekday, 'Today');
});

test('a seven-day schedule crosses the year boundary without duplicate dates', () => {
  const dates = getScheduleDates(new Date('2026-12-31T12:00:00Z'));
  assert.equal(dates.length, 7);
  assert.equal(new Set(dates.map(date => date.key)).size, 7);
  assert.equal(dates[0].key, '2026-12-31');
  assert.equal(dates[6].key, '2027-01-06');
  assert.match(dates[6].fullLabel, /6 January 2027/);
});

test('the daylight-saving transition preserves consecutive calendar days', () => {
  const dates = getScheduleDates(new Date('2026-10-24T12:00:00Z'));
  assert.deepEqual(dates.slice(0, 3).map(date => date.key), ['2026-10-24', '2026-10-25', '2026-10-26']);
  assert.equal(dates[6].key, '2026-10-30');
});
