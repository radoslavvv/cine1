using CinemaR.Infrastructure.Data.Seeding;
using CinemaR.IntegrationTests.Support;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CinemaR.IntegrationTests;

public sealed class SeedingTests
{
    [Fact]
    public async Task Repeating_development_seeding_preserves_custom_bookings_layouts_and_catalog_counts()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        var booking = await cinema.BookAsync([cinema.SeatIds[0]]);
        int[] counts;
        await using (var db = database.OpenContext())
        {
            await CinemaRSeed.RunAsync(db, CancellationToken.None);
            counts = [await db.Movies.CountAsync(), await db.Auditoriums.CountAsync(),
                await db.Seats.CountAsync(), await db.Showtimes.CountAsync(), await db.SeedHistory.CountAsync()];
        }
        await using (var db = database.OpenContext())
        {
            await CinemaRSeed.RunAsync(db, CancellationToken.None);
            Assert.Equal(counts, new[] { await db.Movies.CountAsync(), await db.Auditoriums.CountAsync(),
                await db.Seats.CountAsync(), await db.Showtimes.CountAsync(), await db.SeedHistory.CountAsync() });
        }

        var retained = await cinema.FindAsync(booking.Confirmation!.ConfirmationToken);
        Assert.Equal(booking.Confirmation.Tickets, retained!.Tickets);
        Assert.Equal("Test room", retained.AuditoriumName);
        Assert.Equal(cinema.SeatIds, (await cinema.SeatsAsync())!.Seats.Select(seat => seat.Id));
    }
}
