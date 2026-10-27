using Cinema.Api.Movies;
using Cinema.Api.Schedule;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Api.Data;

public static class ExpandedCatalogSeed
{
    private const string Version = "expanded-catalog-v3";

    public static async Task RunAsync(CatalogDbContext db, CancellationToken cancellationToken)
    {
        if (await db.SeedHistory.AnyAsync(seed => seed.Name == Version, cancellationToken)) return;
        await using var transaction = db.Database.CurrentTransaction is null
            ? await db.Database.BeginTransactionAsync(cancellationToken) : null;

        Movie[] additions =
        [
            new() { Title = "Inception", DurationMinutes = 148, Genres = ["Sci-Fi", "Thriller"], Synopsis = "A skilled dream thief takes on a mission to plant an idea deep within a stranger's subconscious." },
            new() { Title = "Everything Everywhere All at Once", DurationMinutes = 139, Genres = ["Sci-Fi", "Comedy", "Adventure"], Synopsis = "An exhausted laundromat owner discovers parallel lives and becomes her family's unlikely hero." },
            new() { Title = "Spider-Man: Into the Spider-Verse", DurationMinutes = 117, Genres = ["Animation", "Adventure"], Synopsis = "Miles Morales meets heroes from other dimensions as he learns what it means to be Spider-Man." },
            new() { Title = "Coco", DurationMinutes = 105, Genres = ["Animation", "Fantasy"], Synopsis = "A young musician journeys into the Land of the Dead to uncover his family's forgotten story." },
            new() { Title = "La La Land", DurationMinutes = 128, Genres = ["Drama", "Romance"], Synopsis = "An aspiring actor and a jazz musician fall in love while pursuing their dreams in Los Angeles." },
            new() { Title = "Knives Out", DurationMinutes = 130, Genres = ["Crime", "Comedy", "Thriller"], Synopsis = "A detective untangles a web of family secrets after a celebrated mystery writer's sudden death." },
            new() { Title = "The Truman Show", DurationMinutes = 103, Genres = ["Comedy", "Drama"], Synopsis = "A cheerful insurance salesman begins to suspect that his entire world has been staged." }
        ];
        var samples = CatalogSeed.CreateSampleMovies().Concat(additions).ToArray();
        var movies = await db.Movies.ToListAsync(cancellationToken);
        var rooms = await db.Auditoriums.ToListAsync(cancellationToken);
        var existing = await db.Showtimes.ToListAsync(cancellationToken);
        var roomsWithSeats = (await db.Seats.Select(seat => seat.AuditoriumId).Distinct().ToListAsync(cancellationToken)).ToHashSet();
        string[] formats = ["2D", "3D", "IMAX 2D", "IMAX 3D"];
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, CinemaCalendar.TimeZone));

        for (var movieIndex = 0; movieIndex < samples.Length; movieIndex++)
        {
            var sample = samples[movieIndex];
            var movie = movies.FirstOrDefault(movie => movie.Title == sample.Title);
            if (movie is null)
            {
                movie = sample;
                db.Movies.Add(movie);
                movies.Add(movie);
            }
            for (var formatIndex = 0; formatIndex < formats.Length; formatIndex++)
            {
                var format = formats[formatIndex];
                // Dedicated demo screens allow the dense schedule without overlapping room bookings.
                var roomName = $"Screen {movieIndex + 1:00} · {format}";
                var room = rooms.FirstOrDefault(room => room.Name == roomName);
                if (room is null)
                {
                    room = new Auditorium { Name = roomName };
                    db.Auditoriums.Add(room);
                    rooms.Add(room);
                }
                if (!roomsWithSeats.Contains(room.Id))
                    AddSeats(db, room, formatIndex);

                var roomShowtimes = existing.Where(showtime => ReferenceEquals(showtime.Auditorium, room)).ToList();
                for (var day = 0; day < 7; day++)
                    for (var slot = 0; slot < 6; slot++)
                    {
                        var time = new TimeOnly(6, 30).AddMinutes(slot * 195 + (movieIndex + formatIndex + day) % 4 * 5);
                        var startsAt = CinemaCalendar.ToUtc(today.AddDays(day), time);
                        var occupiedUntil = startsAt.AddMinutes(movie.DurationMinutes + 15);
                        if (roomShowtimes.Any(showtime => showtime.StartsAt < occupiedUntil && startsAt < showtime.OccupiedUntil)) continue;
                        var screening = new Showtime { Movie = movie, Auditorium = room, StartsAt = startsAt, OccupiedUntil = occupiedUntil, Format = format };
                        db.Showtimes.Add(screening);
                        roomShowtimes.Add(screening);
                    }
            }
        }

        db.SeedHistory.Add(new SeedHistory { Name = Version, AppliedAt = DateTime.UtcNow });
        await db.SaveChangesAsync(cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
    }

    private static void AddSeats(CatalogDbContext db, Auditorium room, int formatIndex)
    {
        var rows = formatIndex >= 2 ? 10 : 8;
        var columns = formatIndex >= 2 ? 14 : 12;
        for (var row = 0; row < rows; row++)
        {
            var inset = row < 2 ? 1 : 0;
            for (var column = inset; column < columns - inset; column++)
                db.Seats.Add(new Seat
                {
                    Auditorium = room,
                    RowLabel = ((char)('A' + row)).ToString(),
                    Number = column - inset + 1,
                    GridRow = row + (rows == 10 && row >= 5 ? 1 : 0),
                    GridColumn = column + (column >= columns / 2 ? 1 : 0)
                });
        }
    }
}
