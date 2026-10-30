using Cinema.Application.Schedule.ReadModels;
namespace Cinema.Application.Schedule.Repositories;

public interface IShowtimeRepository
{
    Task<IReadOnlyList<ShowtimeReadModel>> GetForIntervalAsync(DateTime startInclusive, DateTime endExclusive, string? genre, string format, CancellationToken cancellationToken);
}
