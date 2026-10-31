using Cinema.Application.Booking.Results;
using Cinema.Application.Booking.Contracts;
using Cinema.Application.Booking.Commands;
using Cinema.Application.Booking.Repositories;

namespace Cinema.Application.Booking.Services;

public sealed class BookingService(IBookingRepository repository) : IBookingService
{
    public Task<BookingResult> ConfirmAsync(ConfirmBookingCommand command, CancellationToken cancellationToken)
    {
        if (command.ShowtimeId <= 0 || command.RequestId == Guid.Empty || command.SeatIds is null || command.SeatIds.Length is < 1 or > 8
            || command.SeatIds.Any(id => id <= 0) || command.SeatIds.Distinct().Count() != command.SeatIds.Length)
            return Task.FromResult(new BookingResult(BookingOutcome.InvalidSeats));

        return repository.ConfirmAsync(command.ShowtimeId, command.RequestId, command.Email.Trim(), command.SeatIds, cancellationToken, command.CustomerId);
    }

    public Task<BookingConfirmation?> FindAsync(string confirmationToken, CancellationToken cancellationToken) =>
        repository.FindAsync(confirmationToken, cancellationToken);
}
