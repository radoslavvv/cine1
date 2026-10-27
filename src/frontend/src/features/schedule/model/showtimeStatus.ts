export type ShowtimeStatus = 'Upcoming' | 'Started' | 'Finished';

export function getShowtimeStatus(startsAt: string, durationMinutes: number, now: number): ShowtimeStatus {
  const start = Date.parse(startsAt);
  if (now < start) return 'Upcoming';
  return now < start + durationMinutes * 60_000 ? 'Started' : 'Finished';
}
