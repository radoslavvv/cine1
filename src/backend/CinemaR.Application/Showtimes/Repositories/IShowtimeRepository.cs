using CinemaR.Application.Showtimes.ReadModels;
namespace CinemaR.Application.Showtimes.Repositories;

public interface IShowtimeRepository
{
    Task<IReadOnlyList<ShowtimeReadModel>> GetForIntervalAsync(DateTime startInclusive, DateTime endExclusive, string? genre, string format, CancellationToken cancellationToken);
}
