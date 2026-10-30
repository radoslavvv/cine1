using Cinema.Application.Booking.Results;
using Cinema.Application.Booking.Contracts;
using Cinema.Application.Booking.Repositories;

namespace Cinema.Tests;

internal sealed class TestBookingRepository : IBookingRepository
{
    public bool Called;
    public int ShowtimeId;
    public Guid RequestId;
    public string? Email;
    public int[]? Seats;
    public Task<BookingResult> ConfirmAsync(int id, Guid requestId, string email, int[] seats, CancellationToken ct)
    {
        Called = true;
        (ShowtimeId, RequestId, Email, Seats) = (id, requestId, email, seats);
        return Task.FromResult(new BookingResult(BookingOutcome.Confirmed));
    }
    public Task<BookingConfirmation?> FindAsync(string token, CancellationToken ct) => throw new NotSupportedException();
}
