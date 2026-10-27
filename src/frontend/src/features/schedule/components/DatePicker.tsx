import { datePickerTheme as theme } from './DatePicker.theme';
import type { ScheduleDate } from '../model/demoSchedule';

interface DatePickerProps {
  dates: ScheduleDate[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function DatePicker({ dates, selectedIndex, onSelect }: DatePickerProps) {
  return (
    <div className={theme.group} role="group" aria-label="Choose schedule date">
      {dates.map((date, index) => (
        <button key={date.key} type="button" aria-label={date.fullLabel} aria-pressed={selectedIndex === index} onClick={() => onSelect(index)} data-schedule-enter="date" data-schedule-key={`date:${date.key}`} data-schedule-order={index} className={`${theme.day} ${selectedIndex === index ? theme.selected : theme.idle}`}>
          <span className={theme.weekday}>{date.weekday}</span>
          <span className={theme.dayNumber}>{date.day}</span>
          <span className={theme.month}>{date.month}</span>
        </button>
      ))}
    </div>
  );
}
