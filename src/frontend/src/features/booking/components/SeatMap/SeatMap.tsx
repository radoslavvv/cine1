import type { SeatPresentation } from '../../model/bookingPresentation';
import { seatMapTheme as theme } from './SeatMap.theme';

export function SeatMap({
  seats,
  onToggle,
}: {
  seats: SeatPresentation[];
  onToggle: (id: number) => void;
}) {
  const rows = [...new Set(seats.map((seat) => seat.gridRow))].sort(
    (a, b) => a - b,
  );
  const columns = Math.max(...seats.map((seat) => seat.gridColumn)) + 1;
  const gridTemplateColumns = `28px repeat(${columns}, 44px) 28px`;

  return (
    <section className={theme.panel} aria-label="Auditorium seat map">
      <div className={theme.screen}>SCREEN</div>
      <p id="seat-map-help" className={theme.hint}>
        Swipe to see the whole row
      </p>

      <div
        className={theme.scroll}
        tabIndex={0}
        role="region"
        aria-label="Scrollable seat layout"
      >
        <div
          className={theme.grid}
          role="group"
          aria-label="Seats, front rows first"
        >
          {rows.map((row, index) => {
            const rowSeats = seats.filter((seat) => seat.gridRow === row);
            const label = rowSeats[0].rowLabel;
            const gap = index > 0 ? row - rows[index - 1] - 1 : row;

            return (
              <div
                key={row}
                className={theme.row}
                role="group"
                aria-label={`Row ${label}`}
                style={{
                  gridTemplateColumns,
                  marginTop: gap * 44,
                }}
              >
                <span className={theme.rowLabel} aria-hidden="true">
                  {label}
                </span>

                {rowSeats.map((seat) => {
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      className={theme.seat}
                      style={{
                        gridColumn: seat.gridColumn + 2,
                      }}
                      aria-label={`Row ${seat.rowLabel}, seat ${seat.number}${seat.taken ? ', taken' : ''}`}
                      aria-pressed={seat.selected}
                      disabled={seat.disabled}
                      onClick={() => onToggle(seat.id)}
                    >
                      <span
                        className={`${theme.chair} ${seat.taken ? theme.taken : seat.selected ? theme.selected : theme.available}`}
                      >
                        {seat.taken ? (
                          <span aria-hidden="true">×</span>
                        ) : (
                          seat.number
                        )}
                      </span>
                    </button>
                  );
                })}

                <span
                  className={theme.rowLabel}
                  style={{ gridColumn: columns + 2 }}
                  aria-hidden="true"
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={theme.legend}>
        <span className={theme.legendItem}>
          <span
            aria-hidden="true"
            className={`${theme.swatch} border-ivory/40 bg-raised`}
          />
          Available
        </span>
        <span className={theme.legendItem}>
          <span
            aria-hidden="true"
            className={`${theme.swatch} border-amber bg-amber`}
          />
          Selected
        </span>
        <span className={theme.legendItem}>
          <span
            aria-hidden="true"
            className={`${theme.swatch} ${theme.takenSwatch}`}
          >
            ×
          </span>
          Taken
        </span>
      </div>
    </section>
  );
}
