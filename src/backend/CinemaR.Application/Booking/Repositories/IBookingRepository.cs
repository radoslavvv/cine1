using CinemaR.Application.Booking.Results;
using CinemaR.Application.Booking.Responses;

namespace CinemaR.Application.Booking.Repositories;

public interface IBookingRepository
{
    Task<BookingResult> ConfirmAsync(int showtimeId, Guid requestId, string email, int[] seatIds, CancellationToken cancellationToken, string? customerId = null);
    Task<BookingConfirmationResponse?> FindAsync(string confirmationToken, CancellationToken cancellationToken);
}
