namespace Cinema.Api.Schedule.Repositories;

public interface IShowtimeRepository
{
    Task<IReadOnlyList<ShowtimeReadModel>> GetForIntervalAsync(DateTime startInclusive, DateTime endExclusive, CancellationToken cancellationToken);
}

// Materialized query data, independent of EF entities and the HTTP response contract.
public sealed record ShowtimeReadModel(
    int Id, DateTime StartsAt,
    int MovieId, string Title, int DurationMinutes, string[] Genres, string Synopsis,
    int AuditoriumId, string AuditoriumName);
