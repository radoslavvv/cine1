using CinemaR.Application.Booking.Responses;
namespace CinemaR.Application.Booking.Repositories;

public interface IMyBookingsRepository
{
    Task<BookingHistoryResponse> FindForCustomerAsync(string customerId, int page, CancellationToken cancellationToken);
}
