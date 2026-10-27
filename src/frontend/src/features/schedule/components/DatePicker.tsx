import type { ScheduleDate } from '../model/demoSchedule';

interface DatePickerProps {
  dates: ScheduleDate[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function DatePicker({ dates, selectedIndex, onSelect }: DatePickerProps) {
  return (
    <div className="mt-8 grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3" role="group" aria-label="Choose schedule date">
      {dates.map((date, index) => (
        <button key={date.key} type="button" aria-label={date.fullLabel} aria-pressed={selectedIndex === index} onClick={() => onSelect(index)} className={`min-h-23 rounded-xl border px-3 py-3 text-center transition-colors sm:min-h-26 ${selectedIndex === index ? 'border-amber/70 bg-amber/10 text-amber-light' : 'border-edge bg-surface text-muted hover:border-amber/40 hover:text-ivory'}`}>
          <span className="block font-label text-[10px]">{date.weekday}</span>
          <span className="my-1 block font-display text-2xl sm:text-3xl">{date.day}</span>
          <span className="block font-label text-[9px] uppercase tracking-wider">{date.month}</span>
        </button>
      ))}
    </div>
  );
}
