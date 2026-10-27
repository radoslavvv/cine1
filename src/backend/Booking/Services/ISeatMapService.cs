using Cinema.Api.Booking.Contracts;

namespace Cinema.Api.Booking.Services;

public interface ISeatMapService
{
    Task<SeatMapResponse?> GetAsync(int showtimeId, CancellationToken cancellationToken);
}
