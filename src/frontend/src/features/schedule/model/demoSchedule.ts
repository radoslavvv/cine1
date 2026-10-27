export const CINEMA_TIME_ZONE = 'Europe/Kyiv';

export interface ScheduleDate {
  key: string;
  weekday: string;
  day: string;
  month: string;
  fullLabel: string;
}

// Calendar dates are calculated in the cinema's timezone, not the viewer's.
export function getScheduleDates(now = new Date()): ScheduleDate[] {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CINEMA_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((entry) => entry.type === type)!.value;
  const start = new Date(`${part('year')}-${part('month')}-${part('day')}T12:00:00Z`);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(date);
    return {
      key: date.toISOString().slice(0, 10),
      weekday: index === 0 ? 'Today' : format({ weekday: 'short' }),
      day: format({ day: '2-digit' }),
      month: format({ month: 'short' }),
      fullLabel: format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    };
  });
}

export function getDemoShowtimes(movieIndex: number, dateIndex: number) {
  const times = dateIndex % 2 === 0 ? ['13:30', '17:00', '20:30'] : ['14:00', '17:30', '21:00'];
  return {
    auditorium: `Auditorium ${movieIndex + 1}`,
    times: times.map((time) => {
      const [hour, minute] = time.split(':').map(Number);
      const totalMinutes = hour * 60 + minute + movieIndex * 15;
      return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
    }),
  };
}
