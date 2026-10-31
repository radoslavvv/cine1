using CinemaR.Application.Showtimes.Queries;
using CinemaR.Application.Showtimes.Services;
using CinemaR.Domain.Auditoriums;
using CinemaR.Domain.Movies;
using CinemaR.Domain.Showtimes;
using CinemaR.Infrastructure.Data.Repositories;
using CinemaR.IntegrationTests.Support;
using Xunit;

namespace CinemaR.IntegrationTests;

public sealed class ShowtimesPersistenceTests
{
    [Theory]
    [InlineData("2026-03-29", "2026-03-28T22:00:00Z", "2026-03-29T21:00:00Z")]
    [InlineData("2026-10-25", "2026-10-24T21:00:00Z", "2026-10-25T22:00:00Z")]
    public async Task Public_showtimes_filter_the_correct_Kyiv_day_and_exclude_cancelled_or_nonmatching_screenings(
        string date, string utcStart, string utcEnd)
    {
        await using var database = await PostgresDatabase.CreateAsync();
        await using var db = database.OpenContext();
        var start = DateTimeOffset.Parse(utcStart).UtcDateTime;
        var end = DateTimeOffset.Parse(utcEnd).UtcDateTime;
        var movie = new Movie { Title = "Drama film", DurationMinutes = 60, Genres = ["Drama"], Synopsis = "Fixture" };
        var comedy = new Movie { Title = "Comedy film", DurationMinutes = 60, Genres = ["Comedy"], Synopsis = "Fixture" };
        var roomNumber = 0;
        Showtime Screening(DateTime at, Movie film, string format = "2D", bool cancelled = false)
        {
            return new Showtime
            {
                Movie = film,
                Auditorium = new Auditorium { Name = "Room " + ++roomNumber },
                StartsAt = at,
                OccupiedUntil = at.AddMinutes(75),
                Format = format,
                CancelledAt = cancelled ? start.AddDays(-1) : null
            };
        }
        var first = Screening(start, movie);
        var last = Screening(end.AddSeconds(-1), movie);
        db.AddRange(first, last, Screening(start.AddSeconds(-1), movie), Screening(end, movie),
            Screening(start.AddHours(1), movie, cancelled: true),
            Screening(start.AddHours(2), movie, "3D"), Screening(start.AddHours(3), comedy));
        await db.SaveChangesAsync();

        var result = await new ShowtimesService(new ShowtimeRepository(db)).GetForDateAsync(
            new GetShowtimesQuery(DateOnly.Parse(date), " Drama ", "2D"), CancellationToken.None);

        Assert.Null(result.ValidationError);
        Assert.Equal(new[] { first.Id, last.Id }, result.Showtimes.Select(showtime => showtime.Id));
        Assert.All(result.Showtimes, showtime => Assert.Equal(60, showtime.Movie.DurationMinutes));
    }
}
