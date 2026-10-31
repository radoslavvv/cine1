export const CINEMA_TIME_ZONE = 'Europe/Kyiv';

export interface ShowtimesDate {
  key: string;
  weekday: string;
  day: string;
  month: string;
  fullLabel: string;
}

// Calendar dates are calculated in the cinema's timezone, not the viewer's.
export function getShowtimesDates(now = new Date()): ShowtimesDate[] {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CINEMA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((entry) => entry.type === type)!.value;
  const start = new Date(
    `${part('year')}-${part('month')}-${part('day')}T12:00:00Z`,
  );

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    const format = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(
        date,
      );
    return {
      key: date.toISOString().slice(0, 10),
      weekday: index === 0 ? 'Today' : format({ weekday: 'short' }),
      day: format({ day: '2-digit' }),
      month: format({ month: 'short' }),
      fullLabel: format({
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  });
}

export function formatShowtime(startsAt: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: CINEMA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(startsAt));
}
