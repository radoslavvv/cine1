using Cinema.Api.Data;
using Cinema.Api.Schedule;
using Microsoft.EntityFrameworkCore;
using Npgsql;

static void Check(bool condition, string message)
{
    if (!condition) throw new Exception(message);
    Console.WriteLine($"PASS {message}");
}

var spring = CinemaCalendar.DayBounds(new DateOnly(2026, 3, 29));
await ServiceChecks.RunAsync(Check);
var autumn = CinemaCalendar.DayBounds(new DateOnly(2026, 10, 25));
Check((spring.End - spring.Start).TotalHours == 23, "Kyiv spring day is 23 hours");
Check((autumn.End - autumn.Start).TotalHours == 25, "Kyiv autumn day is 25 hours");
Check(autumn.Start == new DateTime(2026, 10, 24, 21, 0, 0, DateTimeKind.Utc), "Kyiv midnight can be on the previous UTC date");
Check(CinemaCalendar.ToUtc(new DateOnly(2026, 10, 25), new TimeOnly(13, 30)).Hour == 11, "Kyiv screening is converted using winter offset");

// Use a new isolated database on this project's local Compose server. Never reset the app database.
var testDatabase = "cinemar_checks_" + Guid.NewGuid().ToString("N");
var connection = new NpgsqlConnectionStringBuilder
{
    Host = "localhost", Port = 5433, Database = "postgres", Username = "cinemar", Password = "cinemar_local", Pooling = false
};
await using var admin = new NpgsqlConnection(connection.ConnectionString);
await admin.OpenAsync();
await using (var create = new NpgsqlCommand($"CREATE DATABASE {testDatabase}", admin)) await create.ExecuteNonQueryAsync();
try
{
    connection.Database = testDatabase;
    var options = new DbContextOptionsBuilder<CatalogDbContext>()
        .UseNpgsql(connection.ConnectionString, postgres => postgres.MigrationsHistoryTable("__ef_migrations_history", "catalog"))
        .UseAsyncSeeding((context, _, token) => CatalogSeed.RunAsync((CatalogDbContext)context, token)).Options;
    await using var db = new CatalogDbContext(options);
    await db.Database.MigrateAsync();
    Check(await db.Movies.CountAsync() == 8 && await db.Auditoriums.CountAsync() == 3 && await db.Showtimes.CountAsync() == 84,
        "Fresh migrations create and seed 8 movies, 3 auditoriums, and 84 screenings");
    var originalStart = await db.Showtimes.MinAsync(showtime => showtime.StartsAt);
    await RepositoryChecks.RunAsync(db, Check);
    var marker = await db.SeedHistory.SingleAsync();
    Check(await db.Showtimes.AllAsync(showtime => showtime.OccupiedUntil == showtime.StartsAt.AddMinutes(showtime.Movie.DurationMinutes + 15)),
        "Every seeded screening includes its runtime and 15-minute turnaround");

    var movie = await db.Movies.OrderBy(movie => movie.Id).FirstAsync();
    movie.Synopsis = "Persisted test edit";
    await db.SaveChangesAsync();
    await db.Database.MigrateAsync();
    Check(await db.Showtimes.CountAsync() == 84 && await db.Showtimes.MinAsync(showtime => showtime.StartsAt) == originalStart,
        "Repeated initialization preserves row counts and original schedule dates");
    Check(await db.SeedHistory.CountAsync() == 1 && (await db.SeedHistory.SingleAsync()).AppliedAt == marker.AppliedAt,
        "Repeated initialization preserves the original seed marker");
    Check((await db.Movies.AsNoTracking().SingleAsync(value => value.Id == movie.Id)).Synopsis == "Persisted test edit",
        "Repeated initialization preserves stored edits");

    var screening = await db.Showtimes.OrderBy(value => value.Id).FirstAsync();
    await using var sql = new NpgsqlConnection(connection.ConnectionString);
    await sql.OpenAsync();
    var otherRoom = await db.Auditoriums.Where(room => room.Id != screening.AuditoriumId).Select(room => room.Id).FirstAsync();
    async Task InsertScreening(int id, int roomId, DateTime start, DateTime end)
    {
        await using var command = new NpgsqlCommand("INSERT INTO catalog.showtimes (id,movie_id,auditorium_id,starts_at,occupied_until) VALUES ($1,$2,$3,$4,$5)", sql);
        command.Parameters.AddWithValue(id);
        command.Parameters.AddWithValue(screening.MovieId);
        command.Parameters.AddWithValue(roomId);
        command.Parameters.AddWithValue(start);
        command.Parameters.AddWithValue(end);
        await command.ExecuteNonQueryAsync();
    }
    async Task Rejected(Func<Task> action, string state, string message)
    {
        await using var transaction = await sql.BeginTransactionAsync();
        try
        {
            await action();
            throw new Exception($"Expected rejection: {message}");
        }
        catch (PostgresException exception) when (exception.SqlState == state) { Check(true, message); }
        finally { await transaction.RollbackAsync(); }
    }
    await Rejected(() => InsertScreening(-1, screening.AuditoriumId, screening.StartsAt.AddMinutes(1), screening.OccupiedUntil), "23P01",
        "Database rejects overlapping screenings");
    await Rejected(() => InsertScreening(-2, screening.AuditoriumId, screening.OccupiedUntil.AddMinutes(-1), screening.OccupiedUntil.AddMinutes(1)), "23P01",
        "Database rejects a screening inside the turnaround interval");
    await Rejected(() => InsertScreening(-3, screening.AuditoriumId, screening.StartsAt, screening.StartsAt), "23514",
        "Database rejects an empty occupied interval");
    await using (var transaction = await sql.BeginTransactionAsync())
    {
        // Beyond the seeded week: test adjacency and simultaneous screenings independently of seed contents.
        var start = screening.StartsAt.AddDays(30);
        await InsertScreening(-4, screening.AuditoriumId, start, start.AddHours(2));
        await InsertScreening(-5, screening.AuditoriumId, start.AddHours(2), start.AddHours(4));
        await InsertScreening(-6, otherRoom, start, start.AddHours(2));
        await transaction.RollbackAsync();
        Check(true, "Database accepts exact interval adjacency and simultaneous screenings in different auditoriums");
    }

    db.Showtimes.Remove(screening);
    await db.SaveChangesAsync();
    await db.Database.MigrateAsync();
    Check(await db.Showtimes.CountAsync() == 83, "Initialization does not replenish deliberately deleted screenings");
    await SeedUpgradeChecks.RunAsync(db, Check);
}
finally
{
    await using var drop = new NpgsqlCommand($"DROP DATABASE {testDatabase} WITH (FORCE)", admin);
    await drop.ExecuteNonQueryAsync();
}
