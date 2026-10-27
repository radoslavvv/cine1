using Cinema.Api.Movies;
using Cinema.Api.Schedule;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Api.Data;

public static class CatalogSeed
{
    public const string Version = "varied-catalog-v2";

    public static async Task RunAsync(CatalogDbContext db, CancellationToken cancellationToken)
    {
        if (await db.SeedHistory.AnyAsync(seed => seed.Name == Version, cancellationToken)) return;
        // EF's migration lock serializes this operation; the transaction makes upgrades atomic too.
        await using var transaction = db.Database.CurrentTransaction is null
            ? await db.Database.BeginTransactionAsync(cancellationToken) : null;

        var movies = await db.Movies.ToListAsync(cancellationToken);
        var rooms = await db.Auditoriums.ToListAsync(cancellationToken);
        var existing = await db.Showtimes.Include(showtime => showtime.Movie).Include(showtime => showtime.Auditorium).ToListAsync(cancellationToken);
        var legacy = await db.SeedHistory.SingleOrDefaultAsync(seed => seed.Name == "initial-catalog-v1", cancellationToken);
        if (legacy is not null)
        {
            // Replace only unchanged rows matching the old seed, preserving custom/edited screenings.
            var legacyDate = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(legacy.AppliedAt, CinemaCalendar.TimeZone));
            var replacements = existing.Where(showtime => IsUnchangedLegacyShowtime(showtime, legacyDate)).ToArray();
            db.Showtimes.RemoveRange(replacements);
            foreach (var replacement in replacements) existing.Remove(replacement);
            await db.SaveChangesAsync(cancellationToken);
        }

        Movie[] samples =
        [
            new() { Title = "Interstellar", DurationMinutes = 169, Genres = ["Sci-Fi", "Adventure"], Synopsis = "A team of explorers travels beyond the solar system in search of a future for humanity." },
            new() { Title = "Spirited Away", DurationMinutes = 125, Genres = ["Animation", "Fantasy"], Synopsis = "A young girl enters a spirit world and must find the courage to bring her family home." },
            new() { Title = "The Grand Budapest Hotel", DurationMinutes = 99, Genres = ["Comedy", "Adventure"], Synopsis = "A concierge and his lobby boy become entangled in a stolen painting and a family fortune." },
            new() { Title = "Arrival", DurationMinutes = 116, Genres = ["Sci-Fi", "Drama"], Synopsis = "A linguist seeks a shared language with mysterious visitors as the world grows anxious." },
            new() { Title = "Dune", DurationMinutes = 155, Genres = ["Sci-Fi", "Adventure"], Synopsis = "Paul Atreides arrives on a desert planet where power, prophecy, and survival collide." },
            new() { Title = "Past Lives", DurationMinutes = 106, Genres = ["Drama", "Romance"], Synopsis = "Childhood friends reunite years later and consider the lives they might have shared." },
            new() { Title = "The Batman", DurationMinutes = 176, Genres = ["Crime", "Thriller"], Synopsis = "A masked detective follows a trail of riddles through Gotham's corruption." },
            new() { Title = "Perfect Days", DurationMinutes = 124, Genres = ["Drama"], Synopsis = "A quiet routine of work, music, and small encounters reveals an unexpectedly rich life in Tokyo." }
        ];
        var lineup = samples.Select(sample =>
        {
            var movie = movies.FirstOrDefault(movie => movie.Title == sample.Title);
            if (movie is not null) return movie;
            db.Movies.Add(sample);
            movies.Add(sample);
            return sample;
        }).ToArray();
        var auditoriums = Enumerable.Range(1, 3).Select(number =>
        {
            var name = $"Auditorium {number}";
            var room = rooms.FirstOrDefault(room => room.Name == name);
            if (room is not null) return room;
            room = new Auditorium { Name = name };
            db.Auditoriums.Add(room);
            rooms.Add(room);
            return room;
        }).ToArray();

        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, CinemaCalendar.TimeZone));
        int[] slotHours = [10, 14, 18, 22];
        for (var day = 0; day < 7; day++)
        for (var roomIndex = 0; roomIndex < auditoriums.Length; roomIndex++)
        for (var slot = 0; slot < slotHours.Length; slot++)
        {
            var movie = lineup[(day * 3 + roomIndex + slot) % lineup.Length];
            var room = auditoriums[roomIndex];
            var minute = ((day + roomIndex * 2 + slot) % 4) * 15;
            var startsAt = CinemaCalendar.ToUtc(today.AddDays(day), new TimeOnly(slotHours[slot], minute));
            var occupiedUntil = startsAt.AddMinutes(movie.DurationMinutes + 15);
            // Preserve existing custom data when it conflicts with a proposed seed slot.
            if (existing.Any(showtime => ReferenceEquals(showtime.Auditorium, room)
                && showtime.StartsAt < occupiedUntil && startsAt < showtime.OccupiedUntil)) continue;
            var screening = new Showtime { Movie = movie, Auditorium = room, StartsAt = startsAt, OccupiedUntil = occupiedUntil };
            db.Showtimes.Add(screening);
            existing.Add(screening);
        }
        db.SeedHistory.Add(new SeedHistory { Name = Version, AppliedAt = DateTime.UtcNow });
        await db.SaveChangesAsync(cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
    }

    private static bool IsUnchangedLegacyShowtime(Showtime showtime, DateOnly firstDate)
    {
        string[] titles = ["Interstellar", "Spirited Away", "The Grand Budapest Hotel"];
        int[] durations = [169, 125, 99];
        var index = Array.IndexOf(titles, showtime.Movie.Title);
        if (index < 0 || showtime.Auditorium.Name != $"Auditorium {index + 1}") return false;
        var local = TimeZoneInfo.ConvertTimeFromUtc(showtime.StartsAt, CinemaCalendar.TimeZone);
        var day = DateOnly.FromDateTime(local).DayNumber - firstDate.DayNumber;
        if (day is < 0 or >= 7) return false;
        return new[] { 13, 17, 21 }.Any(hour =>
            showtime.StartsAt == CinemaCalendar.ToUtc(firstDate.AddDays(day), new TimeOnly(hour, 30).AddMinutes(index * 15)))
            && showtime.OccupiedUntil == showtime.StartsAt.AddMinutes(durations[index] + 15);
    }
}
