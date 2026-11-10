using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text.Json;
using CinemaR.Domain.Auditoriums;
using CinemaR.Domain.Movies;
using CinemaR.Domain.Showtimes;
using Microsoft.EntityFrameworkCore;

namespace CinemaR.LoadTests.Commands;

internal static class PrepareFixture
{
    public static async Task ExecuteAsync(LoadTestRun run)
    {
        await using var db = run.OpenContext();
        await db.Database.MigrateAsync();
        if (await db.Movies.AnyAsync())
        {
            throw new InvalidOperationException("Refusing to seed a nonempty load database.");
        }

        var movie = new Movie { Title = "Load fixture", DurationMinutes = 100, Genres = ["Drama"], Synopsis = "Disposable test data" };
        db.Movies.Add(movie);
        var screenings = new List<Showtime>();
        var seatsByRoom = new List<Seat[]>();
        var startsAt = DateTime.UtcNow.Date.AddDays(2).AddHours(12);

        // Three contention fixtures plus forty independent rooms for the capacity workload.
        for (var index = 0; index < 43; index++)
        {
            var room = new Auditorium { Name = $"Load room {index}", SupportedFormats = ["2D"] };
            var seats = Enumerable.Range(0, index < 3 ? 3 : 250).Select(number => new Seat
            {
                Auditorium = room,
                RowLabel = "A",
                Number = number + 1,
                GridRow = number / 25,
                GridColumn = number % 25
            }).ToArray();
            var screening = new Showtime
            {
                Movie = movie,
                Auditorium = room,
                StartsAt = startsAt,
                OccupiedUntil = startsAt.AddMinutes(115)
            };
            db.AddRange(seats);
            db.Showtimes.Add(screening);
            screenings.Add(screening);
            seatsByRoom.Add(seats);
        }

        await db.SaveChangesAsync();
        var manifest = new
        {
            startsAt,
            date = TimeZoneInfo.ConvertTimeFromUtc(startsAt, CinemaCalendar.TimeZone).ToString("yyyy-MM-dd"),
            hot = Fixture(0),
            overlap = Fixture(1),
            replay = Fixture(2),
            capacity = Enumerable.Range(0, 10000).Select(index => new
            {
                showtimeId = screenings[3 + index % 40].Id,
                seatId = seatsByRoom[3 + index % 40][index / 40].Id
            }).ToArray()
        };
        await File.WriteAllTextAsync(Path.Combine(run.OutputDirectory, "fixture.json"), JsonSerializer.Serialize(manifest, run.JsonOptions));

        using var rsa = RSA.Create(2048);
        var request = new CertificateRequest("CN=localhost", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        var names = new SubjectAlternativeNameBuilder();
        names.AddIpAddress(System.Net.IPAddress.Loopback);
        names.AddDnsName("localhost");
        request.CertificateExtensions.Add(names.Build());
        using var certificate = request.CreateSelfSigned(DateTimeOffset.UtcNow.AddMinutes(-5), DateTimeOffset.UtcNow.AddDays(1));
        await File.WriteAllBytesAsync(Path.Combine(run.OutputDirectory, "localhost.pfx"), certificate.Export(X509ContentType.Pfx, "load-only"));
        Console.WriteLine("Prepared 43 future screenings and 10,000 capacity booking slots.");

        object Fixture(int index)
        {
            return new { showtimeId = screenings[index].Id, seatIds = seatsByRoom[index].Select(seat => seat.Id).ToArray() };
        }
    }
}
