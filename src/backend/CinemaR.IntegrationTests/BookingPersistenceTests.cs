using CinemaR.Application.Booking.Results;
using CinemaR.IntegrationTests.Support;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace CinemaR.IntegrationTests;

public sealed class BookingPersistenceTests
{
    [Fact]
    public async Task Concurrent_identical_replays_return_one_booking_and_the_same_tickets()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        var requestId = Guid.NewGuid();
        var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var attempts = Enumerable.Range(0, 20).Select(async index =>
        {
            await start.Task;
            var seats = index % 2 == 0
                ? new[] { cinema.SeatIds[0], cinema.SeatIds[1] }
                : new[] { cinema.SeatIds[1], cinema.SeatIds[0] };
            return await cinema.BookAsync(seats, requestId);
        }).ToArray();

        start.SetResult();
        var results = await Task.WhenAll(attempts).WaitAsync(TimeSpan.FromSeconds(30));
        var original = results[0].Confirmation!;
        Assert.All(results, result =>
        {
            Assert.Equal(BookingOutcome.Confirmed, result.Outcome);
            Assert.Equal(original.ConfirmationToken, result.Confirmation!.ConfirmationToken);
            Assert.Equal(original.Tickets, result.Confirmation.Tickets);
        });

        await using var db = database.OpenContext();
        Assert.Equal(1, await db.Bookings.CountAsync());
        Assert.Equal(2, await db.BookedSeats.CountAsync());
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Concurrent_request_reuse_with_changed_email_or_seats_cannot_create_another_booking(bool changeEmail)
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        var requestId = Guid.NewGuid();
        var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

        async Task<BookingResult> Submit(bool changed)
        {
            await start.Task;
            return await cinema.BookAsync(
                [cinema.SeatIds[changed && !changeEmail ? 1 : 0]], requestId,
                changed && changeEmail ? "other@example.test" : "guest@example.test");
        }

        var attempts = new[] { Submit(false), Submit(true) };
        start.SetResult();
        var results = await Task.WhenAll(attempts).WaitAsync(TimeSpan.FromSeconds(30));
        Assert.Single(results.Where(result => result.Outcome == BookingOutcome.Confirmed));
        Assert.Single(results.Where(result => result.Outcome == BookingOutcome.RequestConflict));

        await using var db = database.OpenContext();
        Assert.Equal(1, await db.Bookings.CountAsync());
        Assert.Equal(1, await db.BookedSeats.CountAsync());
    }

    [Fact]
    public async Task Competing_customers_cannot_sell_the_same_seat_twice()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var attempts = Enumerable.Range(0, 12).Select(async _ =>
        {
            await start.Task;
            return await cinema.BookAsync([cinema.SeatIds[0]]);
        }).ToArray();

        start.SetResult();
        var results = await Task.WhenAll(attempts).WaitAsync(TimeSpan.FromSeconds(30));

        var winner = Assert.Single(results.Where(result => result.Outcome == BookingOutcome.Confirmed));
        Assert.Equal(11, results.Count(result => result.Outcome == BookingOutcome.SeatsTaken));
        Assert.Single((await cinema.SeatsAsync())!.Seats.Where(seat => seat.Taken));
        var recovered = await cinema.FindAsync(winner.Confirmation!.ConfirmationToken);
        Assert.Equal(winner.Confirmation.Tickets, recovered!.Tickets);
    }

    [Fact]
    public async Task Overlapping_multi_seat_requests_are_all_or_nothing()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        var results = await Task.WhenAll(
            cinema.BookAsync([cinema.SeatIds[0], cinema.SeatIds[1]]),
            cinema.BookAsync([cinema.SeatIds[1], cinema.SeatIds[2]]));

        var winner = Assert.Single(results.Where(result => result.Outcome == BookingOutcome.Confirmed));
        Assert.Single(results.Where(result => result.Outcome == BookingOutcome.SeatsTaken));
        var taken = (await cinema.SeatsAsync())!.Seats.Where(seat => seat.Taken).Select(seat => seat.Id).Order();
        Assert.Equal(winner.Confirmation!.Tickets.Select(ticket => ticket.SeatId).Order(), taken);
        Assert.Equal(2, winner.Confirmation.Tickets.Count);
    }

    [Fact]
    public async Task Foreign_auditorium_seats_reject_the_entire_selection()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();

        var result = await cinema.BookAsync([cinema.SeatIds[0], cinema.ForeignSeatId]);

        Assert.Equal(BookingOutcome.InvalidSeats, result.Outcome);
        Assert.All((await cinema.SeatsAsync())!.Seats, seat => Assert.False(seat.Taken));
        Assert.Equal(BookingOutcome.Confirmed, (await cinema.BookAsync([cinema.SeatIds[0]])).Outcome);
    }

    [Fact]
    public async Task Lost_confirmation_can_be_recovered_after_start_with_the_same_tickets()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        var requestId = Guid.NewGuid();
        var original = await cinema.BookAsync([cinema.SeatIds[0], cinema.SeatIds[1]], requestId);
        cinema.Clock.Now = cinema.Clock.Now.AddDays(3);

        // Seat order is immaterial to the identity of a booking request.
        var replay = await cinema.BookAsync([cinema.SeatIds[1], cinema.SeatIds[0]], requestId);

        Assert.Equal(BookingOutcome.Confirmed, replay.Outcome);
        Assert.Equal(original.Confirmation!.ConfirmationToken, replay.Confirmation!.ConfirmationToken);
        Assert.Equal(original.Confirmation.ConfirmedAt, replay.Confirmation.ConfirmedAt);
        Assert.Equal(original.Confirmation.Tickets, replay.Confirmation.Tickets);
        Assert.Equal(BookingOutcome.Started, (await cinema.BookAsync([cinema.SeatIds[2]])).Outcome);
    }

    [Fact]
    public async Task Concurrent_request_id_reuse_on_different_showtimes_returns_a_conflict()
    {
        await using var database = await PostgresDatabase.CreateAsync();
        var cinema = new CinemaFixture(database);
        await cinema.SeedAsync();
        var requestId = Guid.NewGuid();
        var results = await Task.WhenAll(
            cinema.BookAsync([cinema.SeatIds[0]], requestId),
            cinema.BookAsync([cinema.SeatIds[1]], requestId, showtimeId: cinema.OtherShowtimeId));

        Assert.Single(results.Where(result => result.Outcome == BookingOutcome.Confirmed));
        Assert.Single(results.Where(result => result.Outcome == BookingOutcome.RequestConflict));
        Assert.All(results.Where(result => result.Outcome != BookingOutcome.Confirmed), result => Assert.Null(result.Confirmation));
    }
}
