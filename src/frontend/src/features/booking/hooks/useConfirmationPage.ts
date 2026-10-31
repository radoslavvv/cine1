import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { bookingQueries, SeatMapError } from '../api/bookingQueries';
import { formatBookingDate } from '../model/bookingPresentation';

export function useConfirmationPage() {
  const { token = '' } = useParams();
  const valid = /^[a-f0-9]{64}$/.test(token);
  const query = useQuery({
    ...bookingQueries.confirmation(token),
    enabled: valid,
  });
  const missing =
    !valid ||
    (query.error instanceof SeatMapError && query.error.status === 404);
  const booking = query.data;
  const url = window.location.origin + '/booking/confirmation/' + token;

  function copyLink() {
    void navigator.clipboard.writeText(url).catch(() => {});
  }

  return {
    query,
    missing,
    booking,
    url,
    copyLink,
    dateLabel: booking ? formatBookingDate(booking.startsAt) : '',
    retry: () => void query.refetch(),
  };
}
