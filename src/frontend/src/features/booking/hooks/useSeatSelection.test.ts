import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seatMap } from '../../../test/bookingFixtures';
import { useSeatSelection } from './useSeatSelection';

describe('seat selection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-30T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('limits selection to eight available seats and allows deselection', () => {
    const { result } = renderHook(() => useSeatSelection(seatMap(), 0));
    act(() => {
      for (let id = 1; id <= 10; id++) result.current.toggle(id);
      result.current.toggle(999);
    });
    expect(result.current.selectedSeats.map((seat) => seat.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    act(() => result.current.toggle(1));
    act(() => result.current.toggle(9));
    expect(result.current.selectedSeats.map((seat) => seat.id)).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('closes exactly at the server-adjusted start and clears the active selection', () => {
    const { result } = renderHook(() => useSeatSelection(seatMap(), 30_000));
    act(() => result.current.toggle(1));
    act(() => vi.advanceTimersByTime(29_999));
    expect(result.current.isOpen).toBe(true);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedSeats).toEqual([]);
    act(() => result.current.toggle(2));
    expect(result.current.selectedSeats).toEqual([]);
  });

  it('removes seats taken during a refresh and lets the customer choose again', () => {
    const map = seatMap();
    const { result, rerender } = renderHook(({ map }) => useSeatSelection(map, 0), { initialProps: { map } });
    act(() => result.current.toggle(1));
    rerender({ map: { ...map, seats: map.seats.map((seat) => ({ ...seat, taken: seat.id === 1 || seat.taken })) } });
    expect(result.current.selectedSeats).toEqual([]);
    act(() => result.current.toggle(2));
    expect(result.current.selectedSeats.map((seat) => seat.id)).toEqual([2]);
    act(() => result.current.clear());
    expect(result.current.selectedSeats).toEqual([]);
  });

  it('never opens selection when the server has closed it', () => {
    const { result } = renderHook(() => useSeatSelection({ ...seatMap(), selectionOpen: false }, 0));
    act(() => result.current.toggle(1));
    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedSeats).toEqual([]);
  });
});
