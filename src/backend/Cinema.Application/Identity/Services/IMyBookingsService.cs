using Cinema.Application.Identity.Contracts;
namespace Cinema.Application.Identity.Services;

public interface IMyBookingsService
{
    Task<BookingHistory> FindAsync(string customerId, int page, CancellationToken cancellationToken);
}
