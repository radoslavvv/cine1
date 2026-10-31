using CinemaR.Application.Booking.Results;
using CinemaR.Application.Booking.Responses;
using CinemaR.Application.Booking.Commands;

namespace CinemaR.Application.Booking.Services;

public interface IBookingService
{
    Task<BookingResult> ConfirmAsync(ConfirmBookingCommand command, CancellationToken cancellationToken);

    Task<BookingConfirmationResponse?> FindAsync(string confirmationToken, CancellationToken cancellationToken);
}

