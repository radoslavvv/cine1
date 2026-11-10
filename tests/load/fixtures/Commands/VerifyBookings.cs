using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace CinemaR.LoadTests.Commands;

internal static class VerifyBookings
{
    public static async Task<int> ExecuteAsync(LoadTestRun run, string mode)
    {
        await using var db = run.OpenContext();
        using var manifest = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(run.OutputDirectory, "fixture.json")));
        var root = manifest.RootElement;
        var failures = new List<string>();

        if (mode is "correctness" or "all")
        {
            await CheckFixture("hot", 1);
            await CheckFixture("overlap", 2);
            await CheckFixture("replay", 2);
        }

        var emptyBookings = await db.Bookings.CountAsync(booking => !booking.Seats.Any());
        var oversizedBookings = await db.Bookings.CountAsync(booking => booking.Seats.Count > 8);
        var foreignSeats = await db.BookedSeats.CountAsync(seat => seat.Seat.AuditoriumId != seat.Booking.Showtime.AuditoriumId);
        if (emptyBookings + oversizedBookings + foreignSeats != 0)
        {
            failures.Add("Invalid empty/oversized bookings or foreign-auditorium allocations found.");
        }

        // Reconcile persisted capacity bookings with the independently counted HTTP confirmations.
        if (mode is "capacity" or "all")
        {
            using var summary = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(run.OutputDirectory, "capacity-summary.json")));
            var confirmed = summary.RootElement.GetProperty("metrics").GetProperty("booking_confirmed").GetProperty("values").GetProperty("count").GetInt32();
            var ids = root.GetProperty("capacity").EnumerateArray().Select(slot => slot.GetProperty("showtimeId").GetInt32()).Distinct().ToArray();
            var bookings = await db.Bookings.CountAsync(booking => ids.Contains(booking.ShowtimeId));
            var allocations = await db.BookedSeats.CountAsync(seat => ids.Contains(seat.ShowtimeId));
            if (confirmed == 0 || bookings != confirmed || allocations != confirmed)
            {
                failures.Add($"Capacity reconciliation failed: HTTP={confirmed}, bookings={bookings}, allocations={allocations}.");
            }
        }

        var report = new
        {
            checkedAt = DateTimeOffset.UtcNow,
            passed = failures.Count == 0,
            failures,
            bookings = await db.Bookings.CountAsync(),
            allocations = await db.BookedSeats.CountAsync()
        };
        await File.WriteAllTextAsync(Path.Combine(run.OutputDirectory, "database-check.json"), JsonSerializer.Serialize(report, run.JsonOptions));
        Console.WriteLine(JsonSerializer.Serialize(report, run.JsonOptions));

        async Task CheckFixture(string name, int expectedSeats)
        {
            var fixture = root.GetProperty(name);
            var showtimeId = fixture.GetProperty("showtimeId").GetInt32();
            var bookings = await db.Bookings.Where(booking => booking.ShowtimeId == showtimeId).Include(booking => booking.Seats).ToArrayAsync();
            var allocations = await db.BookedSeats.CountAsync(seat => seat.ShowtimeId == showtimeId);
            if (bookings.Length != 1 || allocations != expectedSeats || bookings[0].Seats.Count != expectedSeats)
            {
                failures.Add($"{name}: expected one booking with {expectedSeats} seats; got {bookings.Length} bookings and {allocations} allocations.");
            }
        }

        return failures.Count == 0 ? 0 : 1;
    }
}
