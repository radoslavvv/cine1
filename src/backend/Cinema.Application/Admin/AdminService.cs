using Cinema.Application.Admin.Repositories;
using Cinema.Domain.Movies;
using Cinema.Domain.Schedule;

namespace Cinema.Application.Admin;

public sealed class AdminService(IAdminRepository repository, TimeProvider clock) : IAdminService
{
    private DateTime Now => clock.GetUtcNow().UtcDateTime;
    public Task<AdminCatalog> CatalogAsync(CancellationToken ct) => repository.CatalogAsync(ct);
    public Task<IReadOnlyList<AdminShowtime>> ShowtimesAsync(string date, CancellationToken ct) => repository.ShowtimesAsync(AdminValidation.Date(date), ct);
    public Task<AdminBooking> BookingAsync(Guid id, CancellationToken ct) => repository.BookingAsync(id, ct);
    public Task<BookingPage> BookingsAsync(BookingFilters filters, CancellationToken ct)
    {
        if (filters.Page < 1 || filters.Page > 1000000) throw new AdminRuleException("Invalid page number.", AdminFailure.Validation);
        if (filters.Status is not (null or "" or "active" or "cancelled")) throw new AdminRuleException("Unknown booking status.", AdminFailure.Validation);
        if (!string.IsNullOrEmpty(filters.Date)) AdminValidation.Date(filters.Date);
        return repository.BookingsAsync(filters, ct);
    }

    public Task<int> SaveMovieAsync(int? id, SaveMovieCommand command, CancellationToken ct)
    {
        var input = AdminValidation.Movie(command);
        return repository.ExecuteWriteAsync(async () =>
        {
            var movie = id is null ? new Movie { Title = input.Title, Genres = [], Synopsis = "" }
                : await repository.FindMovieAsync(id.Value, ct) ?? throw Missing();
            movie.Title = input.Title;
            movie.DurationMinutes = input.DurationMinutes;
            movie.Genres = input.Genres;
            movie.Synopsis = input.Synopsis;
            movie.PosterUrl = input.PosterUrl;
            movie.BackdropUrl = input.BackdropUrl;
            if (id is null) repository.Add(movie);
            await repository.SaveChangesAsync(ct);
            return movie.Id;
        }, ct);
    }

    public Task<int> ArchiveMovieAsync(int id, CancellationToken ct) => repository.ExecuteWriteAsync(async () =>
    {
        var movie = await repository.FindMovieAsync(id, ct) ?? throw Missing();
        if (await repository.HasRemainingMovieShowtimesAsync(id, Now, ct))
            throw new AdminRuleException("Finish or cancel this movie's remaining screenings before archiving it.");
        movie.IsArchived = true;
        return id;
    }, ct);

    public Task<int> DeleteMovieAsync(int id, CancellationToken ct) => repository.ExecuteWriteAsync(async () =>
    {
        var movie = await repository.FindMovieAsync(id, ct) ?? throw Missing();
        if (await repository.HasMovieShowtimesAsync(id, ct)) throw new AdminRuleException("This movie has screenings. Archive it to preserve history.");
        repository.Remove(movie);
        return id;
    }, ct);

    public Task<int> SaveAuditoriumAsync(int? id, SaveAuditoriumCommand command, CancellationToken ct)
    {
        var input = AdminValidation.Auditorium(command);
        return repository.ExecuteWriteAsync(async () =>
        {
            var room = id is null ? new Auditorium { Name = input.Name }
                : await repository.FindAuditoriumAsync(id.Value, ct) ?? throw Missing();
            if (id is not null)
            {
                if (await repository.HasUnsupportedRemainingShowtimesAsync(id.Value, input.SupportedFormats, Now, ct))
                    throw new AdminRuleException("A remaining screening uses a format you are removing.");
                if (input.ReplaceLayout)
                {
                    if (await repository.HasAuditoriumBookingsAsync(id.Value, ct))
                        throw new AdminRuleException("The seating layout is permanently locked after its first booking. Create a replacement auditorium.");
                    await repository.DeleteSeatsAsync(id.Value, ct);
                }
            }
            room.Name = input.Name;
            room.SupportedFormats = input.SupportedFormats;
            if (id is null) repository.Add(room);
            await repository.SaveChangesAsync(ct);
            if (id is null || input.ReplaceLayout)
                for (var row = 0; row < input.Rows; row++)
                    for (var column = 0; column < input.SeatsPerRow; column++)
                        repository.Add(new Seat
                        {
                            AuditoriumId = room.Id,
                            RowLabel = ((char)('A' + row)).ToString(),
                            Number = column + 1,
                            GridRow = row,
                            GridColumn = column
                        });
            return room.Id;
        }, ct);
    }

    public Task<int> RetireAuditoriumAsync(int id, CancellationToken ct) => repository.ExecuteWriteAsync(async () =>
    {
        var room = await repository.FindAuditoriumAsync(id, ct) ?? throw Missing();
        if (await repository.HasRemainingAuditoriumShowtimesAsync(id, Now, ct))
            throw new AdminRuleException("Finish or cancel this auditorium's remaining screenings before retiring it.");
        room.IsRetired = true;
        return id;
    }, ct);

    public Task<int> DeleteAuditoriumAsync(int id, CancellationToken ct) => repository.ExecuteWriteAsync(async () =>
    {
        var room = await repository.FindAuditoriumAsync(id, ct) ?? throw Missing();
        if (await repository.HasAuditoriumShowtimesAsync(id, ct))
            throw new AdminRuleException("This auditorium has screenings. Retire it to preserve history.");
        await repository.DeleteSeatsAsync(id, ct);
        repository.Remove(room);
        return id;
    }, ct);

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
