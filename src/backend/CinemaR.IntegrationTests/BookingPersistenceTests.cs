using CinemaR.Application.Booking.Results;
using CinemaR.IntegrationTests.Support;
using Xunit;

namespace CinemaR.IntegrationTests;

public sealed class BookingPersistenceTests
{
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
