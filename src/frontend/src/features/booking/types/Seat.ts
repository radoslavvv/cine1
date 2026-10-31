export interface Seat {
  id: number;
  rowLabel: string;
  number: number;
  gridRow: number;
  gridColumn: number;
  taken: boolean;
}
