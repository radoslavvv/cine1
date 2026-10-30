using Cinema.Application.Booking.ReadModels;
namespace Cinema.Application.Booking.Repositories;

public interface ISeatMapRepository
{
    Task<SeatMapReadModel?> GetAsync(int showtimeId, CancellationToken cancellationToken);
}
