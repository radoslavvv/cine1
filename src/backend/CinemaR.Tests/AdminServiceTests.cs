using CinemaR.Tests.Support;
using CinemaR.Application.Admin.Exceptions;
using CinemaR.Application.Auditoriums.Commands;
using CinemaR.Application.Showtimes.Commands;
using CinemaR.Application.Admin.Results;
using CinemaR.Application.Movies.Services;
using CinemaR.Application.Auditoriums.Services;
using CinemaR.Application.Showtimes.Services;
using CinemaR.Application.Booking.Services;
using Xunit;

namespace CinemaR.Tests;

public sealed class AdminServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 30, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Archiving_rechecks_remaining_screenings_inside_the_write_transaction()
    {
        var repository = new TestAdminRepository(Now) { RemainingMovieShowtimes = true };
        var error = await Assert.ThrowsAsync<AdminRuleException>(() => new MovieService(repository, new FixedTimeProvider(Now)).ArchiveMovieAsync(1, CancellationToken.None));
        Assert.Equal(AdminFailure.Conflict, error.Failure);
        Assert.False(repository.Movie.IsArchived);
        Assert.True(repository.QueriedInsideTransaction);
    }

    [Fact]
    public async Task Booked_auditorium_layout_cannot_be_replaced()
    {
        var repository = new TestAdminRepository(Now) { AuditoriumHasBookings = true };
        await Assert.ThrowsAsync<AdminRuleException>(() => new AuditoriumService(repository, new FixedTimeProvider(Now)).SaveAuditoriumAsync(1,
            new SaveAuditoriumCommand("Room", 5, 10, ["2D"], true), CancellationToken.None));
        Assert.False(repository.DeletedSeats);
        Assert.True(repository.QueriedInsideTransaction);
    }

    [Fact]
    public async Task Batch_conflict_prevents_adding_any_screening()
    {
        var repository = new TestAdminRepository(Now) { Overlaps = [new(2, Now.UtcDateTime.AddDays(2), "Another movie")] };
        await Assert.ThrowsAsync<AdminRuleException>(() => new ShowtimeManagementService(repository, new FixedTimeProvider(Now)).SaveShowtimesAsync(null,
            new SaveShowtimesCommand(1, 1, "2D", "18:00", ["2026-11-01", "2026-11-02"]), CancellationToken.None));
        Assert.Empty(repository.AddedShowtimes);
    }

    [Fact]
    public async Task New_screenings_capture_runtime_and_turnaround_within_one_write()
    {
        var repository = new TestAdminRepository(Now);
        await new ShowtimeManagementService(repository, new FixedTimeProvider(Now)).SaveShowtimesAsync(null,
            new SaveShowtimesCommand(1, 1, "2D", "18:00", ["2026-11-01", "2026-11-02"]), CancellationToken.None);
        Assert.Equal(1, repository.WriteCount);
        Assert.Equal(2, repository.AddedShowtimes.Count);
        Assert.All(repository.AddedShowtimes, s => Assert.Equal(TimeSpan.FromMinutes(115), s.OccupiedUntil - s.StartsAt));
    }

    [Fact]
    public async Task Cancelling_an_already_cancelled_screening_is_idempotent()
    {
        var repository = new TestAdminRepository(Now);
        repository.Showtime.CancelledAt = Now.UtcDateTime.AddHours(-1);
        var previous = repository.Showtime.CancelledAt;
        await new ShowtimeManagementService(repository, new FixedTimeProvider(Now)).CancelShowtimeAsync(1, CancellationToken.None);
        Assert.Equal(previous, repository.Showtime.CancelledAt);
    }
}
