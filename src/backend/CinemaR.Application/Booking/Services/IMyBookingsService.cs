using CinemaR.Application.Booking.Contracts;
using CinemaR.Application.Identity.Contracts;
namespace CinemaR.Application.Booking.Services;

public interface IMyBookingsService
{
    Task<BookingHistory> FindAsync(string customerId, int page, CancellationToken cancellationToken);
}
