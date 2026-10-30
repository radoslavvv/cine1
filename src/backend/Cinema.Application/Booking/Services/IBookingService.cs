using Cinema.Application.Booking.Results;
using Cinema.Application.Booking.Contracts;
using Cinema.Application.Booking.Commands;

namespace Cinema.Application.Booking.Services;

public interface IBookingService
{
    Task<BookingResult> ConfirmAsync(ConfirmBookingCommand command, CancellationToken cancellationToken);
    Task<BookingConfirmation?> FindAsync(string confirmationToken, CancellationToken cancellationToken);
}

