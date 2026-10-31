using CinemaR.Application.Booking.Results;
using CinemaR.Application.Booking.Responses;
using CinemaR.Application.Booking.Commands;
using CinemaR.Application.Booking.Repositories;

namespace CinemaR.Application.Booking.Services;

public sealed class BookingService(IBookingRepository repository) : IBookingService
{
    public Task<BookingResult> ConfirmAsync(ConfirmBookingCommand command, CancellationToken cancellationToken)
    {
        if (command.ShowtimeId <= 0 || command.RequestId == Guid.Empty || command.SeatIds is null || command.SeatIds.Length is < 1 or > 8
            || command.SeatIds.Any(id => id <= 0) || command.SeatIds
                .Distinct()
                .Count() != command.SeatIds.Length)
        {
            return Task.FromResult(new BookingResult(BookingOutcome.InvalidSeats));
        }

        return repository.ConfirmAsync(command.ShowtimeId, command.RequestId, command.Email.Trim(), command.SeatIds, cancellationToken, command.CustomerId);
    }

    public Task<BookingConfirmationResponse?> FindAsync(string confirmationToken, CancellationToken cancellationToken)
    {
        return repository.FindAsync(confirmationToken, cancellationToken);
    }
}
