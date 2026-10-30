using Cinema.Api.Admin;
using Cinema.Api.Booking;
using Cinema.Api.Movies;
using Cinema.Api.Schedule;
using Microsoft.EntityFrameworkCore;

namespace Cinema.Api.Data.Repositories;

public sealed class AdminRepository(CatalogDbContext db, TimeProvider clock)
{
    private DateTime Now => clock.GetUtcNow().UtcDateTime;

    public async Task<AdminCatalog> CatalogAsync(CancellationToken ct)
    {
        var movies = await db.Movies.AsNoTracking().OrderBy(m => m.Title).Select(m => new AdminMovie(
            m.Id, m.Title, m.DurationMinutes, m.Genres, m.Synopsis, m.PosterUrl, m.BackdropUrl, m.IsArchived,
            db.Showtimes.Any(s => s.MovieId == m.Id))).ToListAsync(ct);
        var rooms = await db.Auditoriums.AsNoTracking().OrderBy(a => a.Name).Select(a => new AdminAuditorium(
            a.Id, a.Name, a.SupportedFormats, a.IsRetired,
            db.Bookings.Any(b => b.Showtime.AuditoriumId == a.Id),
            db.Showtimes.Any(s => s.AuditoriumId == a.Id),
            db.Seats.Where(s => s.AuditoriumId == a.Id).OrderBy(s => s.GridRow).ThenBy(s => s.GridColumn)
                .Select(s => new AdminSeat(s.RowLabel, s.Number, s.GridRow, s.GridColumn)).ToList())).ToListAsync(ct);
        return new(movies, rooms);
    }

    public async Task<IReadOnlyList<AdminShowtime>> ShowtimesAsync(DateOnly date, CancellationToken ct)
    {
        var (start, end) = CinemaCalendar.DayBounds(date);
        return await db.Showtimes.AsNoTracking().Where(s => s.StartsAt >= start && s.StartsAt < end)
            .OrderBy(s => s.StartsAt).ThenBy(s => s.Id).Select(s => new AdminShowtime(s.Id, s.MovieId,
                s.Movie.Title, s.AuditoriumId, s.Auditorium.Name, s.StartsAt, s.OccupiedUntil,
                s.ScheduledDurationMinutes, s.Format, s.CancelledAt != null,
                db.Bookings.Count(b => b.ShowtimeId == s.Id))).ToListAsync(ct);
    }

    public Task<int> SaveMovieAsync(int? id, MovieInput input, CancellationToken ct) => WriteAsync(async () =>
    {
        var movie = id is null ? new Movie { Title = input.Title, Genres = [], Synopsis = "" }
            : await db.Movies.SingleOrDefaultAsync(m => m.Id == id, ct) ?? throw Missing();
        movie.Title = input.Title;
        movie.DurationMinutes = input.DurationMinutes;
        movie.Genres = input.Genres;
        movie.Synopsis = input.Synopsis;
        movie.PosterUrl = input.PosterUrl;
        movie.BackdropUrl = input.BackdropUrl;
        if (id is null) db.Movies.Add(movie);
        await db.SaveChangesAsync(ct);
        return movie.Id;
    }, ct);

    public Task<int> ArchiveMovieAsync(int id, CancellationToken ct) => WriteAsync(async () =>
    {
        var movie = await db.Movies.SingleOrDefaultAsync(m => m.Id == id, ct) ?? throw Missing();
        if (await db.Showtimes.AnyAsync(s => s.MovieId == id && s.CancelledAt == null && s.OccupiedUntil > Now, ct))
            throw new AdminRuleException("Finish or cancel this movie's remaining screenings before archiving it.");
        movie.IsArchived = true;
        return id;
    }, ct);

    public Task<int> DeleteMovieAsync(int id, CancellationToken ct) => WriteAsync(async () =>
    {
        var movie = await db.Movies.SingleOrDefaultAsync(m => m.Id == id, ct) ?? throw Missing();
        if (await db.Showtimes.AnyAsync(s => s.MovieId == id, ct)) throw new AdminRuleException("This movie has screenings. Archive it to preserve history.");
        db.Movies.Remove(movie);
        return id;
    }, ct);

    public Task<int> SaveAuditoriumAsync(int? id, AuditoriumInput input, CancellationToken ct) => WriteAsync(async () =>
    {
        var room = id is null ? new Auditorium { Name = input.Name }
            : await db.Auditoriums.SingleOrDefaultAsync(a => a.Id == id, ct) ?? throw Missing();
        if (id is not null)
        {
            if (await db.Showtimes.AnyAsync(s => s.AuditoriumId == id && s.CancelledAt == null && s.OccupiedUntil > Now
                    && !input.SupportedFormats.Contains(s.Format), ct))
                throw new AdminRuleException("A remaining screening uses a format you are removing.");
            if (input.ReplaceLayout)
            {
                if (await db.Bookings.AnyAsync(b => b.Showtime.AuditoriumId == id, ct))
                    throw new AdminRuleException("The seating layout is permanently locked after its first booking. Create a replacement auditorium.");
                await db.Seats.Where(s => s.AuditoriumId == id).ExecuteDeleteAsync(ct);
            }
        }
        room.Name = input.Name;
        room.SupportedFormats = input.SupportedFormats;
        if (id is null) db.Auditoriums.Add(room);
        await db.SaveChangesAsync(ct);
        if (id is null || input.ReplaceLayout)
            for (var row = 0; row < input.Rows; row++)
                for (var column = 0; column < input.SeatsPerRow; column++)
                    db.Seats.Add(new Seat { AuditoriumId = room.Id, RowLabel = ((char)('A' + row)).ToString(),
                        Number = column + 1, GridRow = row, GridColumn = column });
        return room.Id;
    }, ct);

    public Task<int> RetireAuditoriumAsync(int id, CancellationToken ct) => WriteAsync(async () =>
    {
        var room = await db.Auditoriums.SingleOrDefaultAsync(a => a.Id == id, ct) ?? throw Missing();
        if (await db.Showtimes.AnyAsync(s => s.AuditoriumId == id && s.CancelledAt == null && s.OccupiedUntil > Now, ct))
            throw new AdminRuleException("Finish or cancel this auditorium's remaining screenings before retiring it.");
        room.IsRetired = true;
        return id;
    }, ct);

    public Task<int> DeleteAuditoriumAsync(int id, CancellationToken ct) => WriteAsync(async () =>
    {
        var room = await db.Auditoriums.SingleOrDefaultAsync(a => a.Id == id, ct) ?? throw Missing();
        if (await db.Showtimes.AnyAsync(s => s.AuditoriumId == id, ct))
            throw new AdminRuleException("This auditorium has screenings. Retire it to preserve history.");
        await db.Seats.Where(s => s.AuditoriumId == id).ExecuteDeleteAsync(ct);
        db.Auditoriums.Remove(room);
        return id;
    }, ct);

    public Task<int[]> SaveShowtimesAsync(int? id, ShowtimeInput input, DateTime[] starts, CancellationToken ct) => WriteAsync(async () =>
    {
        if (id is not null && starts.Length != 1) throw new AdminRuleException("Edit one screening at a time.", 400);
        if (starts.Any(s => s <= Now)) throw new AdminRuleException("New or rescheduled screenings must start in the future.", 400);
        var movie = await db.Movies.SingleOrDefaultAsync(m => m.Id == input.MovieId, ct) ?? throw Missing();
        var room = await db.Auditoriums.SingleOrDefaultAsync(a => a.Id == input.AuditoriumId, ct) ?? throw Missing();
        if (movie.IsArchived || room.IsRetired) throw new AdminRuleException("Choose an active movie and auditorium.");
        if (!room.SupportedFormats.Contains(input.Format)) throw new AdminRuleException("This auditorium does not support the selected format.", 400);
        Showtime? original = null;
        if (id is not null)
        {
            original = await db.Showtimes.SingleOrDefaultAsync(s => s.Id == id, ct) ?? throw Missing();
            if (original.CancelledAt != null || original.StartsAt <= Now) throw new AdminRuleException("Cancelled or started screenings cannot be edited.");
            if (await db.Bookings.AnyAsync(b => b.ShowtimeId == id, ct))
                throw new AdminRuleException("This screening has confirmed bookings. Cancel it instead of changing its details.");
        }
        var duration = original is not null && original.MovieId == movie.Id ? original.ScheduledDurationMinutes : movie.DurationMinutes;
        var intervals = starts.Select(start => (Start: start, End: start.AddMinutes(duration + 15))).ToArray();
        var conflicts = new List<string>();
        for (var i = 0; i < intervals.Length; i++)
        {
            var interval = intervals[i];
            var overlapping = await db.Showtimes.AsNoTracking().Where(s => s.Id != id && s.AuditoriumId == room.Id
                    && s.CancelledAt == null && s.StartsAt < interval.End && s.OccupiedUntil > interval.Start)
                .Select(s => new { s.Id, s.StartsAt, s.Movie.Title }).ToListAsync(ct);
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
            if (original is null) db.Showtimes.Add(screening);
            saved.Add(screening);
        }
        await db.SaveChangesAsync(ct);
        return saved.Select(s => s.Id).ToArray();
    }, ct);

    public Task<int> CancelShowtimeAsync(int id, CancellationToken ct) => WriteAsync(async () =>
    {
        var screening = await db.Showtimes.SingleOrDefaultAsync(s => s.Id == id, ct) ?? throw Missing();
        if (screening.CancelledAt is not null) return id;
        if (screening.StartsAt <= Now) throw new AdminRuleException("Only upcoming screenings can be cancelled.");
        screening.CancelledAt = Now;
        return id;
    }, ct);

    public async Task<BookingPage> BookingsAsync(BookingFilters filters, CancellationToken ct)
    {
        if (filters.Page < 1 || filters.Page > 1000000) throw new AdminRuleException("Invalid page number.", 400);
        if (filters.Status is not (null or "" or "active" or "cancelled")) throw new AdminRuleException("Unknown booking status.", 400);
        var query = db.Bookings.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var search = filters.Search.Trim();
            var isId = Guid.TryParse(search, out var bookingId);
            query = query.Where(b => b.Email.ToLower().Contains(search.ToLower()) || (isId && b.Id == bookingId));
        }
        if (!string.IsNullOrEmpty(filters.Date))
        {
            var (start, end) = CinemaCalendar.DayBounds(AdminValidation.Date(filters.Date));
            query = query.Where(b => b.Showtime.StartsAt >= start && b.Showtime.StartsAt < end);
        }
        if (filters.MovieId is not null) query = query.Where(b => b.Showtime.MovieId == filters.MovieId);
        if (filters.AuditoriumId is not null) query = query.Where(b => b.Showtime.AuditoriumId == filters.AuditoriumId);
        if (filters.Status == "active") query = query.Where(b => b.Showtime.CancelledAt == null);
        if (filters.Status == "cancelled") query = query.Where(b => b.Showtime.CancelledAt != null);
        var total = await query.CountAsync(ct);
        var items = await BookingDetails(query.OrderByDescending(b => b.ConfirmedAt).ThenBy(b => b.Id)
            .Skip((filters.Page - 1) * 25).Take(25)).ToListAsync(ct);
        return new(filters.Page, 25, total, items);
    }

    public async Task<AdminBooking> BookingAsync(Guid id, CancellationToken ct) =>
        await BookingDetails(db.Bookings.AsNoTracking().Where(b => b.Id == id)).SingleOrDefaultAsync(ct) ?? throw Missing();

    private static IQueryable<AdminBooking> BookingDetails(IQueryable<ConfirmedBooking> query) => query.Select(b =>
        new AdminBooking(b.Id, b.Email, b.ConfirmedAt, b.ShowtimeId, b.Showtime.Movie.Title,
            b.Showtime.Auditorium.Name, b.Showtime.StartsAt, b.Showtime.CancelledAt != null,
            b.Seats.OrderBy(s => s.Seat.GridRow).ThenBy(s => s.Seat.GridColumn)
                .Select(s => s.Seat.RowLabel + s.Seat.Number).ToList()));

    private async Task<T> WriteAsync<T>(Func<Task<T>> action, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await CatalogWriteLock.ExclusiveAsync(db, ct);
        var result = await action();
        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return result;
    }

    private static AdminRuleException Missing() => new("Record not found.", 404);
    private static string Local(DateTime value) => TimeZoneInfo.ConvertTimeFromUtc(value, CinemaCalendar.TimeZone).ToString("yyyy-MM-dd HH:mm");
}
