import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingQueries, SeatMapError } from '../api/bookingQueries';
import type { Seat } from '../types';
import { useSeatSelection } from './useSeatSelection';
import { useCheckout } from './useCheckout';
import {
  MAX_SEATS,
  prepareSeats,
  formatBookingDate,
} from '../model/bookingPresentation';

export function useBookingPage(showtimeId: string) {
  const queryClient = useQueryClient();
  const validId =
    /^[1-9]\d*$/.test(showtimeId) && Number(showtimeId) <= 2_147_483_647;
  const query = useQuery({
    ...bookingQueries.seats(showtimeId),
    enabled: validId,
  });
  const map = query.data;
  const { selectedSeats, isOpen, toggle, clear } = useSeatSelection(
    map,
    map?.clockOffsetMs ?? 0,
  );
  const [checkoutSeats, setCheckoutSeats] = useState<Seat[] | null>(null);
  const [notice, setNotice] = useState('');
  const { reset: resetCheckout, ...checkout } = useCheckout({
    showtimeId: Number(showtimeId),
    seats: checkoutSeats ?? [],
    isOpen,
    active: checkoutSeats !== null,
    onConflict: handleConflict,
  });

  async function handleConflict(message: string) {
    setNotice(message);
    clear();
    await queryClient.invalidateQueries({ queryKey: ['seat-map', showtimeId] });
    setCheckoutSeats(null);
    resetCheckout();
  }

  function beginCheckout() {
    if (!isOpen || selectedSeats.length === 0) return;
    resetCheckout();
    setNotice('');
    setCheckoutSeats(selectedSeats);
  }

  function backToSelection() {
    setCheckoutSeats(null);
    resetCheckout();
  }

  return {
    query,
    notFound:
      !validId ||
      (query.error instanceof SeatMapError && query.error.status === 404),
    retry: () => void query.refetch(),
    selectedSeats,
    isOpen,
    checkoutSeats,
    notice,
    toggle,
    clear,
    checkout,
    seats: prepareSeats(map?.seats ?? [], selectedSeats, isOpen),
    dateLabel: map ? formatBookingDate(map.startsAt) : '',
    maxSeats: MAX_SEATS,
    selectionLimitReached: selectedSeats.length === MAX_SEATS,
    continueDisabled: !isOpen || selectedSeats.length === 0,
    beginCheckout,
    backToSelection,
  };
}
