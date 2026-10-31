import { useEffect, useRef, useState } from 'react';
import { readBookingDraft, saveBookingDraft } from '../model/bookingDraft';
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
  const [draft] = useState(() => readBookingDraft(showtimeId));
  const restored = useRef(false);
  const { selectedSeats, isOpen, toggle, clear } = useSeatSelection(
    map,
    map?.clockOffsetMs ?? 0,
    draft?.seatIds,
  );
  const [checkoutSeats, setCheckoutSeats] = useState<Seat[] | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!map || restored.current) return;
    restored.current = true;
    if (draft?.checkout && map.selectionOpen) {
      const available = map.seats.filter(
        (seat) => !seat.taken && draft.seatIds.includes(seat.id),
      );
      if (available.length === draft.seatIds.length && available.length > 0)
        setCheckoutSeats(available);
      else
        setNotice(
          'Some selected seats are no longer available. Please review your selection.',
        );
    }
  }, [map, draft]);
  useEffect(() => {
    if (!map || !restored.current) return;
    saveBookingDraft(
      showtimeId,
      selectedSeats.map((seat) => seat.id),
      checkoutSeats !== null,
    );
  }, [showtimeId, map, selectedSeats, checkoutSeats]);
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
