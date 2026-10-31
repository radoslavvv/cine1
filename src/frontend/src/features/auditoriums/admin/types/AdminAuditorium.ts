import type { AdminSeat } from './AdminSeat';

export interface AdminAuditorium {
  id: number;
  name: string;
  supportedFormats: string[];
  isRetired: boolean;
  layoutLocked: boolean;
  isUsed: boolean;
  seats: AdminSeat[];
}
