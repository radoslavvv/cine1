using Cinema.Application.Booking.Results;
using Cinema.Application.Admin;
using Cinema.Application.Booking.Commands;
using Cinema.Application.Booking.Services;
using Cinema.Application.Schedule.Contracts;
using Cinema.Application.Schedule.Services;
using Xunit;

namespace Cinema.Tests;

public sealed class ApplicationTests
{
    [Theory]
    [InlineData(null, "2D")]
    [InlineData("1899-12-31", "2D")]
    [InlineData("9999-01-01", "2D")]
    [InlineData("2026-10-30", null)]
    [InlineData("2026-10-30", "unknown")]
    public async Task Invalid_schedule_filters_do_not_query_persistence(string? date, string? format)
    {
        var repository = new TestScheduleRepository();
        var result = await new ScheduleService(repository).GetForDateAsync(
            new GetScheduleQuery(date is null ? null : DateOnly.Parse(date), null, format), CancellationToken.None);
        Assert.NotNull(result.ValidationError);
        Assert.False(repository.Called);
    }

    [Theory]
    [InlineData(2026, 3, 29, 23)]
    [InlineData(2026, 10, 25, 25)]
    public async Task Schedule_queries_use_Kyiv_day_bounds_across_clock_changes(int year, int month, int day, int hours)
    {
        var repository = new TestScheduleRepository();
        using var cancellation = new CancellationTokenSource();
        var result = await new ScheduleService(repository).GetForDateAsync(
            new GetScheduleQuery(new DateOnly(year, month, day), " Drama ", "2D"), cancellation.Token);
        Assert.Null(result.ValidationError);
        Assert.Equal(TimeSpan.FromHours(hours), repository.End - repository.Start);
        Assert.Equal(DateTimeKind.Utc, repository.Start.Kind);
        Assert.Equal("Drama", repository.Genre);
        Assert.Equal("2D", repository.Format);
        Assert.Equal(cancellation.Token, repository.Token);
        Assert.Equal("Example", Assert.Single(result.Showtimes).Movie.Title);
    }

    [Theory]
    [InlineData(new int[0])]
    [InlineData(new[] { 1, 1 })]
    [InlineData(new[] { 0 })]
    [InlineData(new[] { 1, 2, 3, 4, 5, 6, 7, 8, 9 })]
    public async Task Invalid_booking_commands_do_not_reach_the_repository(int[] seats)
    {
        var repository = new TestBookingRepository();
        var result = await new BookingService(repository).ConfirmAsync(
            new ConfirmBookingCommand(1, Guid.NewGuid(), "customer@example.com", seats), CancellationToken.None);
        Assert.Equal(BookingOutcome.InvalidSeats, result.Outcome);
        Assert.False(repository.Called);
    }

    [Fact]
    public async Task Booking_commands_preserve_idempotency_key_and_trim_email()
    {
        var repository = new TestBookingRepository();
        var requestId = Guid.NewGuid();
        await new BookingService(repository).ConfirmAsync(
            new ConfirmBookingCommand(42, requestId, " customer@example.com ", [2, 3]), CancellationToken.None);
        Assert.Equal(42, repository.ShowtimeId);
        Assert.Equal(requestId, repository.RequestId);
        Assert.Equal("customer@example.com", repository.Email);
        Assert.Equal(new[] { 2, 3 }, repository.Seats);
    }

    [Theory]
    [InlineData("2026-03-29")]
    [InlineData("2026-10-25")]
    public void Admin_rejects_skipped_or_ambiguous_Kyiv_start_times(string date)
    {
        var error = Assert.Throws<AdminRuleException>(() => AdminValidation.Starts(new SaveShowtimesCommand(1, 1, "2D", "03:30", [date])));
        Assert.Equal(AdminFailure.Validation, error.Failure);
    }

    [Fact]
    public void Admin_normalizes_movie_commands()
    {
        var movie = AdminValidation.Movie(new SaveMovieCommand(" Example ", 100, [" Drama ", "Drama", " "], " Synopsis ", " ", null));
        Assert.Equal("Example", movie.Title);
        Assert.Equal(new[] { "Drama" }, movie.Genres);
        Assert.Null(movie.PosterUrl);
        Assert.Equal("Synopsis", movie.Synopsis);
    }

    [Fact]
    public async Task Seat_map_service_uses_the_clock_and_preserves_taken_seats()
    {
        var now = new DateTimeOffset(2026, 10, 30, 12, 0, 0, TimeSpan.Zero);
        var map = await new SeatMapService(new TestSeatMapRepository(now.UtcDateTime), new FixedTimeProvider(now)).GetAsync(1, CancellationToken.None);
        Assert.NotNull(map);
        Assert.Equal(now.UtcDateTime, map!.ServerNow);
        Assert.False(map.SelectionOpen);
        Assert.True(Assert.Single(map.Seats).Taken);
    }
}
