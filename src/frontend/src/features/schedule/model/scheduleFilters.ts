import type { ScheduleDate } from './scheduleDates';

export const SHOWTIME_FORMATS = ['2D', '3D', 'IMAX 2D', 'IMAX 3D'] as const;
export type ShowtimeFormat = (typeof SHOWTIME_FORMATS)[number];
export const DEFAULT_FORMAT: ShowtimeFormat = '2D';

export function readScheduleFilters(
  params: URLSearchParams,
  dates: ScheduleDate[],
) {
  const dateIndex = dates.findIndex((date) => date.key === params.get('date'));
  const format = params.get('format') ?? '';
  return {
    selectedIndex: dateIndex < 0 ? 0 : dateIndex,
    genre: params.get('genre') ?? '',
    format:
      SHOWTIME_FORMATS.find((value) => value === format) ?? DEFAULT_FORMAT,
  };
}
