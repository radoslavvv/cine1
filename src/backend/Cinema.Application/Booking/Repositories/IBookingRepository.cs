using Cinema.Application.Booking.Results;
using Cinema.Application.Booking.Contracts;

namespace Cinema.Application.Booking.Repositories;

public interface IBookingRepository
{
    Task<BookingResult> ConfirmAsync(int showtimeId, Guid requestId, string email, int[] seatIds, CancellationToken cancellationToken);
    Task<BookingConfirmation?> FindAsync(string confirmationToken, CancellationToken cancellationToken);
}
