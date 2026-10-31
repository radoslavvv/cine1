import type { AdminAuditorium, AuditoriumDraft } from '../types';

export const emptyAuditorium: AuditoriumDraft = {
  name: '',
  rows: 8,
  seatsPerRow: 12,
  supportedFormats: ['2D'],
};

export function dimensions(room: AdminAuditorium) {
  return {
    rows: Math.max(0, ...room.seats.map((s) => s.gridRow)) + 1,
    seatsPerRow: Math.max(0, ...room.seats.map((s) => s.gridColumn)) + 1,
  };
}
