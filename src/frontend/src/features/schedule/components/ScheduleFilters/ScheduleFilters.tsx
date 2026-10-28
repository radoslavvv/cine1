import { SHOWTIME_FORMATS } from '../../model/scheduleFilters';
import { scheduleFiltersTheme as theme } from './ScheduleFilters.theme';

export function ScheduleFilters({
  genres,
  genre,
  format,
  onChange,
}: {
  genres: string[];
  genre: string;
  format: string;
  onChange: (name: 'genre' | 'format', value: string) => void;
}) {
  return (
    <div className={theme.root} role="group" aria-label="Filter screenings">
      <div className={theme.controls}>
        <label className={theme.label}>
          <span className={theme.labelText}>Genre</span>
          <select
            className={theme.select}
            value={genre}
            onChange={(event) => onChange('genre', event.target.value)}
          >
            <option value="">All genres</option>
            {genres.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <fieldset className={theme.formats}>
          <legend className={theme.legend}>Format</legend>
          <div className={theme.pills}>
            {SHOWTIME_FORMATS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={format === value}
                className={`${theme.pill} ${format === value ? theme.selected : theme.unselected}`}
                onClick={() => onChange('format', value)}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
