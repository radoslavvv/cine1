using CinemaR.Application.Booking.Results;
using CinemaR.Application.Booking.Contracts;
using CinemaR.Application.Booking.Commands;

namespace CinemaR.Application.Booking.Services;

public interface IBookingService
{
    Task<BookingResult> ConfirmAsync(ConfirmBookingCommand command, CancellationToken cancellationToken);
    Task<BookingConfirmation?> FindAsync(string confirmationToken, CancellationToken cancellationToken);
}

