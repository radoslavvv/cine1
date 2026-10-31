using CinemaR.Application.Booking.Results;
using CinemaR.Application.Booking.Services;
using CinemaR.Infrastructure.Data.Repositories;
using CinemaR.Infrastructure.Identity.Entities;
using CinemaR.IntegrationTests.Support;
using Xunit;

namespace CinemaR.IntegrationTests;

public sealed class CustomerHistoryTests
{
    [Fact]
    public async Task History_uses_account_ownership_not_contact_email_and_replay_cannot_change_owner()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        await using (var db = database.OpenContext())
        {
            db.Users.AddRange(
                new CinemaRUser { Id = "owner", UserName = "owner", NormalizedUserName = "OWNER" },
                new CinemaRUser { Id = "other", UserName = "other", NormalizedUserName = "OTHER" });
            await db.SaveChangesAsync();
        }

        var requestId = Guid.NewGuid();
        var owned = await cinema.BookAsync([cinema.SeatIds[0]], requestId, customerId: "owner");
        Assert.Equal(BookingOutcome.Confirmed, owned.Outcome);
        Assert.Equal(BookingOutcome.Confirmed, (await cinema.BookAsync([cinema.SeatIds[1]])).Outcome);
        Assert.Equal(BookingOutcome.Confirmed, (await cinema.BookAsync([cinema.SeatIds[2]], customerId: "other")).Outcome);

        await using var verify = database.OpenContext();
        var service = new MyBookingsService(new MyBookingsRepository(verify));
        var history = await service.FindAsync("owner", 1, CancellationToken.None);
        Assert.Equal(owned.Confirmation!.ConfirmationToken, Assert.Single(history.Items).ConfirmationToken);
        Assert.False(history.HasMore);
        Assert.Empty((await service.FindAsync("owner", 2, CancellationToken.None)).Items);
        Assert.Empty((await service.FindAsync("unrelated-account", 1, CancellationToken.None)).Items);

        var stolen = await cinema.BookAsync([cinema.SeatIds[0]], requestId, customerId: "other");
        Assert.Equal(BookingOutcome.RequestConflict, stolen.Outcome);
        Assert.Null(stolen.Confirmation);
    }
}
