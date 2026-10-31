using CinemaR.Application.Booking.Results;
using CinemaR.Application.Booking.Responses;
using CinemaR.Application.Booking.Repositories;

namespace CinemaR.Tests.Support;

internal sealed class TestBookingRepository : IBookingRepository
{
    public bool Called;
    public int ShowtimeId;
    public Guid RequestId;
    public string? Email;
    public int[]? Seats;

    public Task<BookingResult> ConfirmAsync(int id, Guid requestId, string email, int[] seats, CancellationToken ct, string? customerId = null)
    {
        Called = true;
        (ShowtimeId, RequestId, Email, Seats) = (id, requestId, email, seats);

        return Task.FromResult(new BookingResult(BookingOutcome.Confirmed));
    }

    public Task<BookingConfirmationResponse?> FindAsync(string token, CancellationToken ct)
    {
        throw new NotSupportedException();
    }
}
