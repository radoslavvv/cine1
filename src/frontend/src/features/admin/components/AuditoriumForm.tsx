import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Checkbox } from '@/shared/components/ui/checkbox';
import type { FormEvent } from 'react';
import { cinemaFormats, type AdminSeat, type AuditoriumDraft } from '../types';
import { adminTheme as t } from '../admin.theme';

export function AuditoriumForm({
  draft,
  editing,
  locked,
  pending,
  preview,
  onChange,
  onSave,
  onClear,
}: {
  draft: AuditoriumDraft;
  editing: boolean;
  locked: boolean;
  pending: boolean;
  preview: AdminSeat[];
  onChange: (draft: AuditoriumDraft) => void;
  onSave: (event: FormEvent) => void;
  onClear: () => void;
}) {
  return (
    <section
      className={`${t.panel} lg:order-last lg:sticky lg:top-6`}
      aria-labelledby="auditorium-form-title"
    >
      <h2 id="auditorium-form-title" tabIndex={-1} className={t.heading}>
        {editing ? 'Edit auditorium' : 'Add an auditorium'}
      </h2>
      <form className={t.form} onSubmit={onSave}>
        <fieldset disabled={pending} className="contents">
          <label className={t.field}>
            Name
            <Input
              required
              maxLength={100}
              value={draft.name}
              onChange={(e) => onChange({ ...draft, name: e.target.value })}
            />
          </label>
          <div className={t.row}>
            <label className={t.field}>
              Rows · A–Z
              <Input
                type="number"
                required
                min={1}
                max={26}
                disabled={locked}
                value={draft.rows}
                onChange={(e) =>
                  onChange({ ...draft, rows: Number(e.target.value) })
                }
              />
            </label>
            <label className={t.field}>
              Seats per row
              <Input
                type="number"
                required
                min={1}
                max={40}
                disabled={locked}
                value={draft.seatsPerRow}
                onChange={(e) =>
                  onChange({ ...draft, seatsPerRow: Number(e.target.value) })
                }
              />
            </label>
          </div>
          {locked && (
            <p className={t.muted}>
              This layout has bookings and is permanently locked. Create a new
              auditorium to use a different layout.
            </p>
          )}
          <fieldset>
            <legend className={`${t.field} mb-2`}>Supported formats</legend>
            <div className={t.checks}>
              {cinemaFormats.map((format) => (
                <label key={format} className="flex items-center gap-2">
                  <Checkbox
                    disabled={pending}
                    checked={draft.supportedFormats.includes(format)}
                    onCheckedChange={(checked) =>
                      onChange({
                        ...draft,
                        supportedFormats:
                          checked === true
                            ? [...draft.supportedFormats, format]
                            : draft.supportedFormats.filter(
                                (f) => f !== format,
                              ),
                      })
                    }
                  />
                  {format}
                </label>
              ))}
            </div>
          </fieldset>
          <div
            className={t.preview}
            aria-label={`Seating preview: ${preview.length} seats`}
          >
            <div className={t.screen}>Screen</div>
            <div
              className={t.seats}
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, Math.min(40, draft.seatsPerRow))}, 1.5rem)`,
              }}
            >
              {preview.map((seat) => (
                <span
                  key={`${seat.gridRow}-${seat.gridColumn}`}
                  className={t.seat}
                  style={{
                    gridRow: seat.gridRow + 1,
                    gridColumn: seat.gridColumn + 1,
                  }}
                >
                  {seat.rowLabel}
                  {seat.number}
                </span>
              ))}
            </div>
          </div>
          <p className={t.muted}>
            {preview.length} seats · Layout changes are allowed only before the
            first booking.
          </p>
          <div className={t.actions}>
            <Button
              size="sm"
              disabled={draft.supportedFormats.length === 0}
              type="submit"
            >
              {pending
                ? 'Saving…'
                : editing
                  ? 'Save changes'
                  : 'Create auditorium'}
            </Button>
            {editing && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={onClear}
              >
                Cancel editing
              </Button>
            )}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
