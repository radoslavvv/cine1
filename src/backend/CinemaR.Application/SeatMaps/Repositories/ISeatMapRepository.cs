using CinemaR.Application.SeatMaps.ReadModels;
namespace CinemaR.Application.SeatMaps.Repositories;

public interface ISeatMapRepository
{
    Task<SeatMapReadModel?> GetAsync(int showtimeId, CancellationToken cancellationToken);
}
