import type { ShowtimeDraft } from '../types';
import { dateInKyiv } from '@/shared/model/cinemaDates';
export const emptyShowtime = (): ShowtimeDraft => ({
  movieId: '',
  auditoriumId: '',
  format: '2D',
  localTime: '19:00',
  dates: [dateInKyiv()],
});
