using Cinema.Application.Admin.Contracts;
using Cinema.Application.Admin.Results;
using Cinema.Application.Admin.Validation;
using Cinema.Application.Admin.ReadModels;
using Cinema.Application.Admin.Repositories;
using Cinema.Domain.Booking;
using Cinema.Domain.Movies;
using Cinema.Domain.Schedule;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Cinema.Infrastructure.Data.Repositories;

public sealed class AdminRepository(CinemaRDbContext db) : IAdminRepository
{
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

    public async Task<BookingPage> BookingsAsync(BookingFilters filters, CancellationToken ct)
    {
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

    public Task<Movie?> FindMovieAsync(int id, CancellationToken ct) => db.Movies.SingleOrDefaultAsync(m => m.Id == id, ct);
    public Task<Auditorium?> FindAuditoriumAsync(int id, CancellationToken ct) => db.Auditoriums.SingleOrDefaultAsync(a => a.Id == id, ct);
    public Task<Showtime?> FindShowtimeAsync(int id, CancellationToken ct) => db.Showtimes.SingleOrDefaultAsync(s => s.Id == id, ct);
    public void Add(Movie movie) => db.Movies.Add(movie);
    public void Add(Auditorium auditorium) => db.Auditoriums.Add(auditorium);
    public void Add(Seat seat) => db.Seats.Add(seat);
    public void Add(Showtime showtime) => db.Showtimes.Add(showtime);
    public void Remove(Movie movie) => db.Movies.Remove(movie);
    public void Remove(Auditorium auditorium) => db.Auditoriums.Remove(auditorium);
    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
    public Task DeleteSeatsAsync(int id, CancellationToken ct) => db.Seats.Where(s => s.AuditoriumId == id).ExecuteDeleteAsync(ct);
    public Task<bool> HasMovieShowtimesAsync(int id, CancellationToken ct) => db.Showtimes.AnyAsync(s => s.MovieId == id, ct);
    public Task<bool> HasAuditoriumShowtimesAsync(int id, CancellationToken ct) => db.Showtimes.AnyAsync(s => s.AuditoriumId == id, ct);
    public Task<bool> HasRemainingMovieShowtimesAsync(int id, DateTime now, CancellationToken ct) =>
        db.Showtimes.AnyAsync(s => s.MovieId == id && s.CancelledAt == null && s.OccupiedUntil > now, ct);
    public Task<bool> HasRemainingAuditoriumShowtimesAsync(int id, DateTime now, CancellationToken ct) =>
        db.Showtimes.AnyAsync(s => s.AuditoriumId == id && s.CancelledAt == null && s.OccupiedUntil > now, ct);
    public Task<bool> HasUnsupportedRemainingShowtimesAsync(int id, string[] formats, DateTime now, CancellationToken ct) =>
        db.Showtimes.AnyAsync(s => s.AuditoriumId == id && s.CancelledAt == null && s.OccupiedUntil > now && !formats.Contains(s.Format), ct);
    public Task<bool> HasAuditoriumBookingsAsync(int id, CancellationToken ct) => db.Bookings.AnyAsync(b => b.Showtime.AuditoriumId == id, ct);
    public Task<bool> HasShowtimeBookingsAsync(int id, CancellationToken ct) => db.Bookings.AnyAsync(b => b.ShowtimeId == id, ct);
    public async Task<IReadOnlyList<ShowtimeConflict>> FindOverlapsAsync(int? exceptId, int auditoriumId, DateTime start, DateTime end, CancellationToken ct) =>
        await db.Showtimes.AsNoTracking().Where(s => s.Id != exceptId && s.AuditoriumId == auditoriumId
            && s.CancelledAt == null && s.StartsAt < end && s.OccupiedUntil > start)
            .Select(s => new ShowtimeConflict(s.Id, s.StartsAt, s.Movie.Title)).ToListAsync(ct);

    public async Task<T> ExecuteWriteAsync<T>(Func<Task<T>> action, CancellationToken ct)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await CatalogWriteLock.ExclusiveAsync(db, ct);
        try
        {
            var result = await action();
            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return result;
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException)
        {
            var postgres = (PostgresException)exception.InnerException;
            var message = postgres.SqlState switch
            {
                PostgresErrorCodes.ExclusionViolation => "A screening conflicts with this auditorium's schedule. Nothing was saved; refresh and adjust the dates.",
                PostgresErrorCodes.UniqueViolation => "This name or seat layout already exists. Nothing was saved.",
                PostgresErrorCodes.ForeignKeyViolation => "This record is in use and cannot be deleted.",
                _ => null
            };
            if (message is null) throw;
            throw new AdminRuleException(message);
        }
    }
    private static AdminRuleException Missing() => new("Record not found.", AdminFailure.NotFound);
}
