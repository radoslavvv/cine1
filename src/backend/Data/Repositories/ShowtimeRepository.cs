using Cinema.Api.Schedule.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Api.Data.Repositories;

public sealed class ShowtimeRepository(CatalogDbContext db) : IShowtimeRepository
{
    public async Task<IReadOnlyList<ShowtimeReadModel>> GetForIntervalAsync(
        DateTime startInclusive, DateTime endExclusive, CancellationToken cancellationToken) =>
        await db.Showtimes.AsNoTracking()
            .Where(showtime => showtime.StartsAt >= startInclusive && showtime.StartsAt < endExclusive)
            .OrderBy(showtime => showtime.StartsAt).ThenBy(showtime => showtime.Id)
            .Select(showtime => new ShowtimeReadModel(
                showtime.Id, showtime.StartsAt,
                showtime.Movie.Id, showtime.Movie.Title, showtime.Movie.DurationMinutes, showtime.Movie.Genres, showtime.Movie.Synopsis,
                showtime.Auditorium.Id, showtime.Auditorium.Name))
            .ToListAsync(cancellationToken);
}
