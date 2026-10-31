using CinemaR.Application.Booking.Contracts;
namespace CinemaR.Application.Booking.Repositories;

public interface IMyBookingsRepository
{
    Task<BookingHistory> FindForCustomerAsync(string customerId, int page, CancellationToken cancellationToken);
}
