using Cinema.Api.Booking.Contracts;

namespace Cinema.Api.Booking.Repositories;

public interface IBookingRepository
{
    Task<BookingResult> ConfirmAsync(int showtimeId, Guid requestId, string email, int[] seatIds, CancellationToken cancellationToken);
    Task<BookingConfirmation?> FindAsync(string confirmationToken, CancellationToken cancellationToken);
}

public enum BookingOutcome { Confirmed, NotFound, Started, InvalidSeats, SeatsTaken, RequestConflict }
public sealed record BookingResult(BookingOutcome Outcome, BookingConfirmation? Confirmation = null);
