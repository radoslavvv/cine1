using Cinema.Api.Data;
using Cinema.Api.Movies;
using Cinema.Api.Schedule;
using Microsoft.EntityFrameworkCore;

internal static class SeedUpgradeChecks
{
    public static async Task RunAsync(CatalogDbContext db, Action<bool, string> check)
    {
        // This context belongs to the disposable integration database, never the application database.
        db.ChangeTracker.Clear();
        await db.Showtimes.ExecuteDeleteAsync();
        await db.SeedHistory.ExecuteDeleteAsync();
        await db.Movies.ExecuteDeleteAsync();
        await db.Auditoriums.ExecuteDeleteAsync();
        string[] titles = ["Interstellar", "Spirited Away", "The Grand Budapest Hotel"];
        int[] durations = [169, 125, 99];
        var movies = titles.Select((title, index) => new Movie
        {
            Title = title, DurationMinutes = durations[index], Genres = ["Preserved genre"], Synopsis = "Preserved movie text"
        }).ToArray();
        var rooms = Enumerable.Range(1, 3).Select(number => new Auditorium { Name = $"Auditorium {number}" }).ToArray();
        var appliedAt = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(appliedAt, CinemaCalendar.TimeZone));
        var legacy = new List<Showtime>();
        for (var day = 0; day < 7; day++)
        for (var index = 0; index < 3; index++)
        foreach (var hour in new[] { 13, 17, 21 })
        {
            var start = CinemaCalendar.ToUtc(today.AddDays(day), new TimeOnly(hour, 30).AddMinutes(index * 15));
            legacy.Add(new Showtime { Movie = movies[index], Auditorium = rooms[index], StartsAt = start, OccupiedUntil = start.AddMinutes(durations[index] + 15) });
        }
        // An edited legacy screening and a custom morning screening must survive the upgrade.
        legacy[0].OccupiedUntil = legacy[0].OccupiedUntil.AddMinutes(1);
        var customStart = CinemaCalendar.ToUtc(today, new TimeOnly(10, 0));
        var custom = new Showtime { Movie = movies[0], Auditorium = rooms[0], StartsAt = customStart, OccupiedUntil = customStart.AddHours(1) };
        db.AddRange(legacy);
        db.Add(custom);
        db.SeedHistory.Add(new SeedHistory { Name = "initial-catalog-v1", AppliedAt = appliedAt });
        await db.SaveChangesAsync();
        var legacyIds = legacy.Select(showtime => showtime.Id).ToArray();
        var editedId = legacy[0].Id;
        var customId = custom.Id;
        db.ChangeTracker.Clear();

        await db.Database.MigrateAsync();
        check(await db.Movies.CountAsync() == 8, "Seed upgrade adds five movies to the existing catalog");
        var remainingLegacyIds = await db.Showtimes.Where(showtime => legacyIds.Contains(showtime.Id)).Select(showtime => showtime.Id).ToArrayAsync();
        check(remainingLegacyIds.SequenceEqual([editedId]), "Seed upgrade replaces unchanged legacy screenings and preserves edited screenings");
        check(await db.Showtimes.AnyAsync(showtime => showtime.Id == customId), "Seed upgrade preserves custom screenings and skips conflicting seed slots");
        check(await db.Movies.Where(movie => titles.Contains(movie.Title)).AllAsync(movie => movie.Synopsis == "Preserved movie text"),
            "Seed upgrade preserves existing movie metadata");
        check(await db.SeedHistory.CountAsync() == 2, "Seed upgrade records its own version alongside the original seed marker");
        var count = await db.Showtimes.CountAsync();
        await db.Database.MigrateAsync();
        check(await db.Showtimes.CountAsync() == count, "Seed upgrade is idempotent");
    }
}
