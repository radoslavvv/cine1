export interface AdminSeat {
  rowLabel: string;
  number: number;
  gridRow: number;
  gridColumn: number;
}
export interface AdminAuditorium {
  id: number;
  name: string;
  supportedFormats: string[];
  isRetired: boolean;
  layoutLocked: boolean;
  isUsed: boolean;
  seats: AdminSeat[];
}
export interface AuditoriumDraft {
  name: string;
  rows: number;
  seatsPerRow: number;
  supportedFormats: string[];
}
