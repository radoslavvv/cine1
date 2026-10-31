import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { seatMap } from '../../../../test/bookingFixtures';
import { prepareSeats } from '../../model/bookingPresentation';
import { SeatMap } from './SeatMap';

// Motion preference is irrelevant to seat interaction; keep the real DOM component.
vi.mock('../../../../shared/hooks/useCinemaMotion', () => ({
  useCinemaMotion: () => ({ initial: false, animate: { transition: {} } }),
}));

describe('seat map accessibility and interaction', () => {
  it('names seats, exposes selection and blocks taken seats', () => {
    const seats = seatMap().seats;
    const onToggle = vi.fn();
    render(<SeatMap seats={prepareSeats(seats, [seats[0]], true)} onToggle={onToggle} />);
    expect(screen.getByRole('button', { name: 'Row A, seat 1' })).toHaveAttribute('aria-pressed', 'true');
    const available = screen.getByRole('button', { name: 'Row A, seat 2' });
    expect(available).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(available);
    expect(onToggle).toHaveBeenCalledWith(2);
    const taken = screen.getByRole('button', { name: 'Row A, seat 10, taken' });
    expect(taken).toBeDisabled();
    fireEvent.click(taken);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('keeps selected seats enabled at the limit so they can be deselected', () => {
    const seats = seatMap().seats;
    const { rerender } = render(<SeatMap seats={prepareSeats(seats, seats.slice(0, 8), true)} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Row A, seat 1' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Row A, seat 9' })).toBeDisabled();
    rerender(<SeatMap seats={prepareSeats(seats, [], false)} onToggle={vi.fn()} />);
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
  });
});
