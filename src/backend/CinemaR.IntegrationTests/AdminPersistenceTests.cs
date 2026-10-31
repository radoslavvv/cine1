using CinemaR.Application.Admin.Exceptions;
using CinemaR.Application.Admin.Results;
using CinemaR.Application.Auditoriums.Commands;
using CinemaR.Application.Auditoriums.Services;
using CinemaR.Application.Showtimes.Commands;
using CinemaR.Application.Showtimes.Services;
using CinemaR.Application.Booking.Results;
using CinemaR.Infrastructure.Data.Repositories;
using CinemaR.IntegrationTests.Support;
using Xunit;

namespace CinemaR.IntegrationTests;

public sealed class AdminPersistenceTests
{
    [Fact]
    public async Task Cancellation_preserves_booking_history_but_invalidates_tickets_and_new_sales()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        var requestId = Guid.NewGuid();
        var booking = await cinema.BookAsync([cinema.SeatIds[0]], requestId);
        Assert.NotEmpty(Assert.Single(booking.Confirmation!.Tickets).TicketCode);

        await using (var db = database.OpenContext())
        {
            var service = new ShowtimeManagementService(new ShowtimeManagementRepository(db), cinema.Clock);
            await service.CancelShowtimeAsync(cinema.ShowtimeId, CancellationToken.None);
        }

        var history = await cinema.FindAsync(booking.Confirmation.ConfirmationToken);
        Assert.True(history!.IsCancelled);
        Assert.Empty(Assert.Single(history.Tickets).TicketCode);
        Assert.Equal(booking.Confirmation.ConfirmationToken, history.ConfirmationToken);
        Assert.Null(await cinema.SeatsAsync());
        Assert.Equal(BookingOutcome.Cancelled, (await cinema.BookAsync([cinema.SeatIds[1]])).Outcome);
        var replay = await cinema.BookAsync([cinema.SeatIds[0]], requestId);
        Assert.Equal(BookingOutcome.Confirmed, replay.Outcome);
        Assert.True(replay.Confirmation!.IsCancelled);
    }

    [Fact]
    public async Task Booked_layout_and_screening_details_remain_protected()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        var booking = await cinema.BookAsync([cinema.SeatIds[0]]);

        await using (var db = database.OpenContext())
        {
            var service = new ShowtimeManagementService(new ShowtimeManagementRepository(db), cinema.Clock);
            var error = await Assert.ThrowsAsync<AdminRuleException>(() => service.SaveShowtimesAsync(cinema.ShowtimeId,
                new SaveShowtimesCommand(cinema.MovieId, cinema.AuditoriumId, "3D", "18:00", ["2026-11-02"]), CancellationToken.None));
            Assert.Equal(AdminFailure.Conflict, error.Failure);
            await service.CancelShowtimeAsync(cinema.ShowtimeId, CancellationToken.None);
        }
        await using (var db = database.OpenContext())
        {
            var service = new AuditoriumService(new AuditoriumRepository(db), cinema.Clock);
            var error = await Assert.ThrowsAsync<AdminRuleException>(() => service.SaveAuditoriumAsync(cinema.AuditoriumId,
                new SaveAuditoriumCommand("Replacement", 2, 2, ["2D"], true), CancellationToken.None));
            Assert.Equal(AdminFailure.Conflict, error.Failure);
        }

        var retained = await cinema.FindAsync(booking.Confirmation!.ConfirmationToken);
        Assert.Equal("Test room", retained!.AuditoriumName);
        Assert.Equal("A", Assert.Single(retained.Tickets).RowLabel);
        Assert.Equal(1, Assert.Single(retained.Tickets).Number);
    }

    [Fact]
    public async Task Failed_layout_replacement_rolls_back_deleted_seats_and_room_changes()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        await using (var db = database.OpenContext())
        {
            var service = new AuditoriumService(new AuditoriumRepository(db), cinema.Clock);
            // DeleteSeatsAsync executes immediately, before the duplicate name fails SaveChanges.
            var error = await Assert.ThrowsAsync<AdminRuleException>(() => service.SaveAuditoriumAsync(cinema.AuditoriumId,
                new SaveAuditoriumCommand("Other room", 2, 2, ["2D"], true), CancellationToken.None));
            Assert.Equal(AdminFailure.Conflict, error.Failure);
        }

        await using var verify = database.OpenContext();
        var rooms = await new AuditoriumService(new AuditoriumRepository(verify), cinema.Clock).AuditoriumsAsync(CancellationToken.None);
        var room = Assert.Single(rooms.Where(item => item.Id == cinema.AuditoriumId));
        Assert.Equal("Test room", room.Name);
        Assert.Equal(4, room.Seats.Count);
        Assert.Equal(cinema.SeatIds, (await cinema.SeatsAsync())!.Seats.Select(seat => seat.Id));
    }

    [Fact]
    public async Task Conflicting_batch_saves_no_partial_showtimes()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        await using (var db = database.OpenContext())
        {
            var service = new ShowtimeManagementService(new ShowtimeManagementRepository(db), cinema.Clock);
            await Assert.ThrowsAsync<AdminRuleException>(() => service.SaveShowtimesAsync(null,
                new SaveShowtimesCommand(cinema.MovieId, cinema.AuditoriumId, "2D", "14:00", ["2026-11-02", "2026-11-04"]), CancellationToken.None));
        }

        await using var verify = database.OpenContext();
        var reader = new ShowtimeManagementService(new ShowtimeManagementRepository(verify), cinema.Clock);
        Assert.Empty(await reader.ShowtimesAsync("2026-11-04", CancellationToken.None));
        Assert.Single(await reader.ShowtimesAsync("2026-11-02", CancellationToken.None));
    }
}
