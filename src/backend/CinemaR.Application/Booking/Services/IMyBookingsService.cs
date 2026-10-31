using CinemaR.Application.Booking.Responses;
using CinemaR.Application.Identity.Responses;
namespace CinemaR.Application.Booking.Services;

public interface IMyBookingsService
{
    Task<BookingHistoryResponse> FindAsync(string customerId, int page, CancellationToken cancellationToken);
}
