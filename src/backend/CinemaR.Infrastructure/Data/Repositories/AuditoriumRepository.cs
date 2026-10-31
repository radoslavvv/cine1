using CinemaR.Application.Auditoriums.Contracts;
using CinemaR.Domain.Auditoriums;
using CinemaR.Application.Admin.Results;
using CinemaR.Domain.Showtimes;
using Microsoft.EntityFrameworkCore;
using Npgsql;

using CinemaR.Application.Auditoriums.Repositories;
namespace CinemaR.Infrastructure.Data.Repositories;

public sealed class AuditoriumRepository(CinemaRDbContext db) : CinemaWriteRepository(db), IAuditoriumRepository
{
    public async Task<IReadOnlyList<AdminAuditorium>> AuditoriumsAsync(CancellationToken ct)
    {
        var rooms = await Db.Auditoriums.AsNoTracking().OrderBy(a => a.Name).Select(a => new AdminAuditorium(
            a.Id, a.Name, a.SupportedFormats, a.IsRetired,
            Db.Bookings.Any(b => b.Showtime.AuditoriumId == a.Id),
            Db.Showtimes.Any(s => s.AuditoriumId == a.Id),
            Db.Seats.Where(s => s.AuditoriumId == a.Id).OrderBy(s => s.GridRow).ThenBy(s => s.GridColumn)
                .Select(s => new AdminSeat(s.RowLabel, s.Number, s.GridRow, s.GridColumn)).ToList())).ToListAsync(ct);
        return rooms;
    }

    public Task<Auditorium?> FindAuditoriumAsync(int id, CancellationToken ct) => Db.Auditoriums.SingleOrDefaultAsync(a => a.Id == id, ct);

    public void Add(Auditorium auditorium) => Db.Auditoriums.Add(auditorium);

    public void Add(Seat seat) => Db.Seats.Add(seat);

    public void Remove(Auditorium auditorium) => Db.Auditoriums.Remove(auditorium);

    public Task DeleteSeatsAsync(int id, CancellationToken ct) => Db.Seats.Where(s => s.AuditoriumId == id).ExecuteDeleteAsync(ct);

    public Task<bool> HasAuditoriumShowtimesAsync(int id, CancellationToken ct) => Db.Showtimes.AnyAsync(s => s.AuditoriumId == id, ct);

    public Task<bool> HasRemainingAuditoriumShowtimesAsync(int id, DateTime now, CancellationToken ct) =>
        Db.Showtimes.AnyAsync(s => s.AuditoriumId == id && s.CancelledAt == null && s.OccupiedUntil > now, ct);

    public Task<bool> HasUnsupportedRemainingShowtimesAsync(int id, string[] formats, DateTime now, CancellationToken ct) =>
        Db.Showtimes.AnyAsync(s => s.AuditoriumId == id && s.CancelledAt == null && s.OccupiedUntil > now && !formats.Contains(s.Format), ct);

    public Task<bool> HasAuditoriumBookingsAsync(int id, CancellationToken ct) => Db.Bookings.AnyAsync(b => b.Showtime.AuditoriumId == id, ct);

}
