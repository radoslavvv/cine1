using CinemaR.Domain.Auditoriums;
using CinemaR.Domain.Showtimes;
using CinemaR.IntegrationTests.Support;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Xunit;

namespace CinemaR.IntegrationTests;

public sealed class DatabaseConstraintTests
{
    [Fact]
    public async Task Database_rejects_overlapping_screenings_but_allows_adjacent_intervals_and_other_rooms()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        var startsAt = cinema.Clock.Now.UtcDateTime.AddDays(1);
        await using (var db = database.OpenContext())
        {
            db.Showtimes.Add(new Showtime
            {
                MovieId = cinema.MovieId,
                AuditoriumId = cinema.AuditoriumId,
                StartsAt = startsAt.AddMinutes(114),
                OccupiedUntil = startsAt.AddMinutes(229)
            });
            var error = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
            var postgres = Assert.IsType<PostgresException>(error.InnerException);
            Assert.Equal(PostgresErrorCodes.ExclusionViolation, postgres.SqlState);
        }

        await using var allowed = database.OpenContext();
        allowed.Showtimes.AddRange(new Showtime
        {
            MovieId = cinema.MovieId,
            AuditoriumId = cinema.AuditoriumId,
            StartsAt = startsAt.AddMinutes(115),
            OccupiedUntil = startsAt.AddMinutes(230)
        }, new Showtime
        {
            MovieId = cinema.MovieId,
            Auditorium = new Auditorium { Name = "Concurrent room" },
            StartsAt = startsAt,
            OccupiedUntil = startsAt.AddMinutes(115)
        });
        await allowed.SaveChangesAsync();
        Assert.Equal(4, await allowed.Showtimes.CountAsync());
    }
}
