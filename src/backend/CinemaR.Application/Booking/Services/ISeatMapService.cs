using CinemaR.Application.Booking.Contracts;

namespace CinemaR.Application.Booking.Services;

public interface ISeatMapService
{
    Task<SeatMapResponse?> GetAsync(int showtimeId, CancellationToken cancellationToken);
}
