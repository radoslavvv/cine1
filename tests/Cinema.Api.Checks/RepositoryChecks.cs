using Cinema.Api.Data;
using Cinema.Api.Data.Repositories;
using Cinema.Api.Schedule;
using Microsoft.EntityFrameworkCore;

internal static class RepositoryChecks
{
    public static async Task RunAsync(CatalogDbContext db, Action<bool, string> check)
    {
        var movieId = await db.Movies.Select(movie => movie.Id).FirstAsync();
        var rooms = await db.Auditoriums.OrderBy(room => room.Id).Select(room => room.Id).ToArrayAsync();
        var (start, end) = CinemaCalendar.DayBounds(new DateOnly(2098, 1, 1));
        await using var transaction = await db.Database.BeginTransactionAsync();
        Showtime Screening(int id, int room, DateTime at) => new()
        {
            Id = id, MovieId = movieId, AuditoriumId = room, StartsAt = at, OccupiedUntil = at.AddMinutes(1)
        };
        db.Showtimes.AddRange(
            Screening(-100, rooms[0], start.AddMinutes(-1)),
            Screening(-101, rooms[0], start),
            Screening(-102, rooms[0], end.AddMinutes(-1)),
            Screening(-103, rooms[0], end),
            Screening(-104, rooms[1], start));
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
        var repository = new ShowtimeRepository(db);
        var rows = await repository.GetForIntervalAsync(start, end, CancellationToken.None);
        check(rows.Select(row => row.Id).SequenceEqual([-104, -101, -102]),
            "Repository includes midnight, excludes next midnight, and sorts ties by ID");
        check(rows.All(row => row.MovieId == movieId && row.Title.Length > 0 && row.Genres.Length > 0 && row.AuditoriumName.Length > 0),
            "Repository joins persisted movie metadata and auditoriums");
        check(!db.ChangeTracker.Entries().Any(), "Repository returns read models without tracking EF entities");
        check((await repository.GetForIntervalAsync(end.AddDays(1), end.AddDays(2), CancellationToken.None)).Count == 0,
            "Repository returns no fabricated screenings for an empty interval");
        await transaction.RollbackAsync();
    }
}
