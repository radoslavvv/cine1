using CinemaR.Infrastructure.Data.Contexts;
using CinemaR.Domain.Auditoriums;
using CinemaR.Application.Showtimes.ReadModels;
using CinemaR.Application.Showtimes.Repositories;
using Microsoft.EntityFrameworkCore;

namespace CinemaR.Infrastructure.Data.Repositories;

public sealed class ShowtimeRepository(CinemaRDbContext db) : IShowtimeRepository
{
    public async Task<IReadOnlyList<ShowtimeReadModel>> GetForIntervalAsync(
        DateTime startInclusive, DateTime endExclusive, string? genre, string format, CancellationToken cancellationToken) =>
        await db.Showtimes.AsNoTracking()
            .Where(showtime => showtime.CancelledAt == null)
            .Where(showtime => showtime.StartsAt >= startInclusive && showtime.StartsAt < endExclusive)
            .Where(showtime => showtime.Format == format)
            .Where(showtime => genre == null || showtime.Movie.Genres.Contains(genre))
            .OrderBy(showtime => showtime.StartsAt).ThenBy(showtime => showtime.Id)
            .Select(showtime => new ShowtimeReadModel(
                showtime.Id, showtime.StartsAt,
                showtime.Movie.Id, showtime.Movie.Title, showtime.ScheduledDurationMinutes, showtime.Movie.Genres, showtime.Movie.Synopsis,
                showtime.Auditorium.Id, showtime.Auditorium.Name, showtime.Format, showtime.Movie.PosterUrl, showtime.Movie.BackdropUrl))
            .ToListAsync(cancellationToken);
}
