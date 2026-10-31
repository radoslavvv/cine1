using CinemaR.Application.Booking.Responses;
using CinemaR.Application.Booking.Repositories;
namespace CinemaR.Application.Booking.Services;

public sealed class MyBookingsService(IMyBookingsRepository repository) : IMyBookingsService
{
    public Task<BookingHistoryResponse> FindAsync(string customerId, int page, CancellationToken cancellationToken) => repository.FindForCustomerAsync(customerId, page, cancellationToken);
}
