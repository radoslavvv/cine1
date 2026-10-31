using CinemaR.Application.Booking.ReadModels;
namespace CinemaR.Application.Booking.Repositories;

public interface ISeatMapRepository
{
    Task<SeatMapReadModel?> GetAsync(int showtimeId, CancellationToken cancellationToken);
}
