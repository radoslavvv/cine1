import { SHOWTIME_FORMATS } from '../../model/scheduleFilters';
import { useId } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
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
  const genreId = useId();
  // Radix reserves an empty value for its placeholder; URLs still use "".
  const allGenres = '__all_genres__';
  return (
    <div className={theme.root} role="group" aria-label="Filter screenings">
      <div className={theme.controls}>
        <div className={theme.label}>
          <label htmlFor={genreId} className={theme.labelText}>
            Genre
          </label>
          <Select
            value={genre || allGenres}
            onValueChange={(value) =>
              onChange('genre', value === allGenres ? '' : value)
            }
          >
            <SelectTrigger id={genreId} className={theme.select}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectItem value={allGenres}>All genres</SelectItem>
              {genres.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <fieldset className={theme.formats}>
          <legend className={theme.legend}>Format</legend>
          <div className={theme.pills}>
            {SHOWTIME_FORMATS.map((value) => (
              <Button
                variant="outline"
                key={value}
                type="button"
                aria-pressed={format === value}
                className={`${theme.pill} ${format === value ? theme.selected : theme.unselected}`}
                onClick={() => onChange('format', value)}
              >
                {value}
              </Button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
