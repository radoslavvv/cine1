using CinemaR.Application.Admin.Exceptions;
using CinemaR.Application.Showtimes.Responses;
using CinemaR.Application.Showtimes.Commands;
using CinemaR.Application.Admin.Results;
using CinemaR.Application.Admin.Validation;
using CinemaR.Domain.Showtimes;

using CinemaR.Application.Showtimes.Repositories;

namespace CinemaR.Application.Showtimes.Services;

public sealed class ShowtimeManagementService(IShowtimeManagementRepository repository, TimeProvider clock) : IShowtimeManagementService
{
    private DateTime Now => clock.GetUtcNow().UtcDateTime;
    public Task<IReadOnlyList<AdminShowtimeResponse>> ShowtimesAsync(string date, CancellationToken ct) => repository.ShowtimesAsync(AdminValidation.Date(date), ct);

    public Task<int[]> SaveShowtimesAsync(int? id, SaveShowtimesCommand input, CancellationToken ct)
    {
        var starts = AdminValidation.Starts(input);
        return repository.ExecuteWriteAsync(async () =>
        {
            if (id is not null && starts.Length != 1) throw new AdminRuleException("Edit one screening at a time.", AdminFailure.Validation);
            if (starts.Any(s => s <= Now)) throw new AdminRuleException("New or rescheduled screenings must start in the future.", AdminFailure.Validation);
            var movie = await repository.FindMovieAsync(input.MovieId, ct) ?? throw Missing();
            var room = await repository.FindAuditoriumAsync(input.AuditoriumId, ct) ?? throw Missing();
            if (movie.IsArchived || room.IsRetired) throw new AdminRuleException("Choose an active movie and auditorium.");
            if (!room.SupportedFormats.Contains(input.Format)) throw new AdminRuleException("This auditorium does not support the selected format.", AdminFailure.Validation);
            Showtime? original = null;
            if (id is not null)
            {
                original = await repository.FindShowtimeAsync(id.Value, ct) ?? throw Missing();
                if (original.CancelledAt != null || original.StartsAt <= Now) throw new AdminRuleException("Cancelled or started screenings cannot be edited.");
                if (await repository.HasShowtimeBookingsAsync(id.Value, ct))
                    throw new AdminRuleException("This screening has confirmed bookings. Cancel it instead of changing its details.");
            }
            var duration = original is not null && original.MovieId == movie.Id ? original.ScheduledDurationMinutes : movie.DurationMinutes;
            var intervals = starts.Select(start => (Start: start, End: start.AddMinutes(duration + 15))).ToArray();
            var conflicts = new List<string>();
            for (var i = 0; i < intervals.Length; i++)
            {
                var interval = intervals[i];
                var overlapping = await repository.FindOverlapsAsync(id, room.Id, interval.Start, interval.End, ct);
                foreach (var conflict in overlapping)
                    conflicts.Add($"{Local(interval.Start)} conflicts with #{conflict.Id} {conflict.Title} at {Local(conflict.StartsAt)}");
                if (intervals.Take(i).Any(other => other.Start < interval.End && other.End > interval.Start))
                    conflicts.Add($"{Local(interval.Start)} overlaps another selected date");
            }
            if (conflicts.Count > 0) throw new AdminRuleException("Nothing saved. " + string.Join("; ", conflicts));
            var saved = new List<Showtime>();
            foreach (var interval in intervals)
            {
                var screening = original ?? new Showtime();
                screening.MovieId = movie.Id;
                screening.AuditoriumId = room.Id;
                screening.Format = input.Format;
                screening.StartsAt = interval.Start;
                screening.OccupiedUntil = interval.End;
                if (original is null) repository.Add(screening);
                saved.Add(screening);
            }
            await repository.SaveChangesAsync(ct);
            return saved.Select(s => s.Id).ToArray();
        }, ct);
    }

    public Task<int> CancelShowtimeAsync(int id, CancellationToken ct) => repository.ExecuteWriteAsync(async () =>
    {
        var screening = await repository.FindShowtimeAsync(id, ct) ?? throw Missing();
        if (screening.CancelledAt is not null) return id;
        if (screening.StartsAt <= Now) throw new AdminRuleException("Only upcoming screenings can be cancelled.");
        screening.CancelledAt = Now;
        return id;
    }, ct);

    private static AdminRuleException Missing() => new("Record not found.", AdminFailure.NotFound);

    private static string Local(DateTime value) => TimeZoneInfo.ConvertTimeFromUtc(value, CinemaCalendar.TimeZone).ToString("yyyy-MM-dd HH:mm");
}
