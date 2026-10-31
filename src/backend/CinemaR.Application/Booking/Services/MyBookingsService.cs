using CinemaR.Application.Booking.Contracts;
using CinemaR.Application.Booking.Repositories;
namespace CinemaR.Application.Booking.Services;

public sealed class MyBookingsService(IMyBookingsRepository repository) : IMyBookingsService
{
    public Task<BookingHistory> FindAsync(string customerId, int page, CancellationToken cancellationToken) => repository.FindForCustomerAsync(customerId, page, cancellationToken);
}
