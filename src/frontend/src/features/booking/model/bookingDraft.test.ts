import { afterEach, expect, it, vi } from 'vitest';
import { readBookingDraft, saveBookingDraft } from './bookingDraft';

afterEach(() => {
  sessionStorage.clear();
  vi.useRealTimers();
});

it('restores a tab-scoped seat selection for sign-in, expires it after two hours, and clears abandoned choices', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
  saveBookingDraft('42', [1, 2], true);
  expect(readBookingDraft('42')).toEqual({ seatIds: [1, 2], checkout: true });
  expect(readBookingDraft('43')).toBeNull();

  vi.setSystemTime(new Date('2026-11-01T14:00:01Z'));
  expect(readBookingDraft('42')).toBeNull();
  saveBookingDraft('42', [3], false);
  saveBookingDraft('42', [], false);
  expect(readBookingDraft('42')).toBeNull();
});
