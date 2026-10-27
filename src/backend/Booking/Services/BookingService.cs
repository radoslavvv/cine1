using Cinema.Api.Booking.Contracts;
using Cinema.Api.Booking.Repositories;

namespace Cinema.Api.Booking.Services;

public interface IBookingService
{
    Task<BookingResult> ConfirmAsync(int showtimeId, ConfirmBookingRequest request, CancellationToken cancellationToken);
    Task<BookingConfirmation?> FindAsync(string confirmationToken, CancellationToken cancellationToken);
}

public sealed class BookingService(IBookingRepository repository) : IBookingService
{
    public Task<BookingResult> ConfirmAsync(int showtimeId, ConfirmBookingRequest request, CancellationToken cancellationToken)
    {
        if (request.RequestId == Guid.Empty || request.SeatIds.Length is < 1 or > 8
            || request.SeatIds.Any(id => id <= 0) || request.SeatIds.Distinct().Count() != request.SeatIds.Length)
            return Task.FromResult(new BookingResult(BookingOutcome.InvalidSeats));

        return repository.ConfirmAsync(showtimeId, request.RequestId, request.Email.Trim(), request.SeatIds, cancellationToken);
    }

    public Task<BookingConfirmation?> FindAsync(string confirmationToken, CancellationToken cancellationToken) =>
        repository.FindAsync(confirmationToken, cancellationToken);
}
