using Cinema.Application.Booking.Contracts;

namespace Cinema.Application.Booking.Services;

public interface ISeatMapService
{
    Task<SeatMapResponse?> GetAsync(int showtimeId, CancellationToken cancellationToken);
}
