using CinemaR.Infrastructure.Data.Contexts;
using CinemaR.Application.Showtimes.Responses;
using CinemaR.Application.Showtimes.ReadModels;
using CinemaR.Domain.Auditoriums;
using CinemaR.Application.Admin.Results;
using CinemaR.Domain.Movies;
using CinemaR.Domain.Showtimes;
using Microsoft.EntityFrameworkCore;
using Npgsql;

using CinemaR.Application.Showtimes.Repositories;
namespace CinemaR.Infrastructure.Data.Repositories;

public sealed class ShowtimeManagementRepository(CinemaRDbContext db) : CinemaWriteRepository(db), IShowtimeManagementRepository
{
    public async Task<IReadOnlyList<AdminShowtimeResponse>> ShowtimesAsync(DateOnly date, CancellationToken ct)
    {
        var (start, end) = CinemaCalendar.DayBounds(date);

        return await Db.Showtimes
            .AsNoTracking()
            .Where(s => s.StartsAt >= start && s.StartsAt < end)
            .OrderBy(s => s.StartsAt)
            .ThenBy(s => s.Id)
            .Select(s => new AdminShowtimeResponse(s.Id, s.MovieId,
                s.Movie.Title, s.AuditoriumId, s.Auditorium.Name, s.StartsAt, s.OccupiedUntil,
                s.ScheduledDurationMinutes, s.Format, s.CancelledAt != null,
                Db.Bookings.Count(b => b.ShowtimeId == s.Id)))
            .ToListAsync(ct);
    }

    public Task<Movie?> FindMovieAsync(int id, CancellationToken ct)
    {
        return Db.Movies.SingleOrDefaultAsync(m => m.Id == id, ct);
    }

    public Task<Auditorium?> FindAuditoriumAsync(int id, CancellationToken ct)
    {
        return Db.Auditoriums.SingleOrDefaultAsync(a => a.Id == id, ct);
    }

    public Task<Showtime?> FindShowtimeAsync(int id, CancellationToken ct)
    {
        return Db.Showtimes.SingleOrDefaultAsync(s => s.Id == id, ct);
    }

    public void Add(Showtime showtime)
    {
        Db.Showtimes.Add(showtime);
    }

    public Task<bool> HasShowtimeBookingsAsync(int id, CancellationToken ct)
    {
        return Db.Bookings.AnyAsync(b => b.ShowtimeId == id, ct);
    }

    public async Task<IReadOnlyList<ShowtimeConflictReadModel>> FindOverlapsAsync(int? exceptId, int auditoriumId, DateTime start, DateTime end, CancellationToken ct)
    {
        return await Db.Showtimes
            .AsNoTracking()
            .Where(s => s.Id != exceptId && s.AuditoriumId == auditoriumId
            && s.CancelledAt == null && s.StartsAt < end && s.OccupiedUntil > start)
            .Select(s => new ShowtimeConflictReadModel(s.Id, s.StartsAt, s.Movie.Title))
            .ToListAsync(ct);
    }
}
