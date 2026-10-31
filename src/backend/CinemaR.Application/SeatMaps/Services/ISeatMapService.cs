using CinemaR.Application.SeatMaps.Responses;

namespace CinemaR.Application.SeatMaps.Services;

public interface ISeatMapService
{
    Task<SeatMapResponse?> GetAsync(int showtimeId, CancellationToken cancellationToken);
}
